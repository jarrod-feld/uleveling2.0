import { Quest } from "@/mock/dashboardData";
// Remove conflicting QuestStatus import if it includes 'pending'
// import { QuestStatus } from "@/types/quest";
import AIService from './AIService';
import { isToday, startOfDay, endOfDay } from 'date-fns'; // Use date-fns for reliable date checks
import RoadmapService from "./RoadmapService";
import AccountService from "./AccountService"; // Needed?
import AuthService from './AuthService'; // Import Supabase client access
import { PostgrestError } from '@supabase/supabase-js';
import { Goal } from "@/mock/roadmapData"; // Keep for AI context
import CacheService from './CacheService';
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

// Helper to map DB row to Quest interface
function _mapDbRowToQuest(row: any): Quest {
  return {
    id: row.quest_instance_id,
    title: row.title,
    description: row.description,
    goalId: row.goal_id,
    stats: row.stats, // Assuming DB returns text[] correctly
    status: row.status as 'active' | 'completed' | 'skipped',
    progress: {
        current: row.progress_current,
        total: row.progress_total
    },
    statIncrements: row.stat_increments, // Assuming DB returns jsonb correctly parsed
    disciplineIncrementAmount: row.discipline_increment_amount,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    // generated_at and updated_at are not part of the core Quest interface used in UI
  };
}

// Helper to map Quest object to DB update object
function _mapQuestToDbUpdate(questData: Partial<Quest>): any {
    const dbUpdate: any = {};
    if (questData.title !== undefined) dbUpdate.title = questData.title;
    if (questData.description !== undefined) dbUpdate.description = questData.description;
    if (questData.goalId !== undefined) dbUpdate.goal_id = questData.goalId;
    if (questData.stats !== undefined) dbUpdate.stats = questData.stats;
    if (questData.status !== undefined) dbUpdate.status = questData.status;
    if (questData.progress !== undefined) {
        dbUpdate.progress_current = questData.progress.current;
        dbUpdate.progress_total = questData.progress.total;
    }
    if (questData.statIncrements !== undefined) dbUpdate.stat_increments = questData.statIncrements;
    if (questData.disciplineIncrementAmount !== undefined) dbUpdate.discipline_increment_amount = questData.disciplineIncrementAmount;
    if (questData.completedAt !== undefined) dbUpdate.completed_at = questData.completedAt?.toISOString();
    // updated_at is handled by trigger
    return dbUpdate;
}

class QuestService {

    private static supabase = AuthService.client; // Get Supabase client instance

  /**
   * Fetches today's quests for the current user from the database.
   * If no quests exist for today, triggers generation of new daily quests.
   */
  static async getQuests(userId: string): Promise<{ data: Quest[] | null; error: Error | null }> {
    console.log(`[QuestService] Attempting to get cached quests for user ${userId}...`);
    const cached = await CacheService.get<Quest[]>(`quests_${userId}`);
    if (cached) {
      console.log(`[QuestService] Returning cached quests for user ${userId}.`);
      return { data: cached, error: null };
    }
    console.log(`[QuestService] Fetching today's quests for user ${userId} from DB...`);
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();

    try {
      // 1. Fetch quests generated today
      let { data: todaysQuestsData, error: fetchError } = await this.supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .gte('generated_at', todayStart)
        .lt('generated_at', todayEnd)
        .order('generated_at', { ascending: true }); // Or order as needed

      if (fetchError) {
        console.error(`[QuestService] DB error fetching today's quests for user ${userId}:`, fetchError);
        throw new Error(fetchError.message);
    }

      // 2. If no quests today, DO NOT generate them automatically.
      //    Initial quests are handled by onboarding completion.
      //    Daily refresh logic should be triggered elsewhere (e.g., on app load for existing users).
      if (!todaysQuestsData || todaysQuestsData.length === 0) {
        console.log(`[QuestService] No quests found for today for user ${userId}. Returning empty array.`);
        // Just return empty array if no quests found for today
        return { data: [], error: null }; 
    }

      // 3. Map DB rows to Quest interface
      const quests = todaysQuestsData.map(_mapDbRowToQuest);
      console.log(`[QuestService] Caching ${quests.length} fetched quests for user ${userId}.`);
      await CacheService.set(`quests_${userId}`, quests, CACHE_TTL);
      return { data: quests, error: null };

    } catch (e) {
      console.error(`[QuestService] Error in getQuests for user ${userId}:`, e);
      return { data: null, error: e instanceof Error ? e : new Error("Failed to get quests") };
    }
  }

  /**
   * Updates a specific quest instance in the database.
   */
  private static async _updateUserQuestInDb(userId: string, questId: string, updates: Partial<Quest>): Promise<{ error: Error | null }> {
    console.log(`[QuestService] Updating quest ${questId} for user ${userId} in DB...`);
    const dbUpdates = _mapQuestToDbUpdate(updates);

    if (Object.keys(dbUpdates).length === 0) {
        console.warn(`[QuestService] No valid fields provided for update on quest ${questId}.`);
        return { error: null }; // Nothing to update
    }

    // updated_at is handled by trigger
    try {
        const { error } = await this.supabase
            .from('user_quests')
            .update(dbUpdates)
            .eq('quest_instance_id', questId)
            .eq('user_id', userId);

        if (error) {
            console.error(`[QuestService] DB error updating quest ${questId} for user ${userId}:`, error);
            throw new Error(error.message);
        }

        console.log(`[QuestService] Quest ${questId} updated successfully in DB for user ${userId}.`);
        return { error: null };
    } catch (e) {
        console.error(`[QuestService] Error in _updateUserQuestInDb for quest ${questId}, user ${userId}:`, e);
        return { error: e instanceof Error ? e : new Error(`Failed to update quest ${questId}`) };
    }
  }

  /**
    * Saves initial quests (e.g., from onboarding) to the database.
   */
   static async saveQuests(userId: string, quests: Quest[]): Promise<{ success: boolean; error: Error | null }> {
     console.log(`[QuestService] Attempting to save ${quests.length} initial quests for user ${userId} to DB...`);
     if (!quests || quests.length === 0) {
         return { success: true, error: null }; // Nothing to save
     }

     const dbRows = quests.map(q => ({
        // quest_instance_id: uses default gen_random_uuid()
        user_id: userId,
        title: q.title,
        description: q.description,
        goal_id: q.goalId,
        stats: q.stats,
        status: q.status || 'active', // Default if status isn't set
        progress_current: q.progress?.current ?? 0,
        progress_total: q.progress?.total ?? 1,
        stat_increments: q.statIncrements,
        discipline_increment_amount: q.disciplineIncrementAmount,
        completed_at: q.completedAt?.toISOString(),
        // generated_at: uses default now()
        // updated_at: uses default now()
     }));

     try {
        const { error } = await this.supabase.from('user_quests').insert(dbRows);
        if (error) {
            console.error(`[QuestService] DB error inserting initial quests for user ${userId}:`, error);
            throw new Error(error.message);
        }
        console.log(`[QuestService] ${dbRows.length} initial quests saved successfully for user ${userId}.`);
        console.log(`[QuestService] Caching ${quests.length} saved quests for user ${userId}.`);
        await CacheService.set(`quests_${userId}`, quests, CACHE_TTL);
        return { success: true, error: null };
     } catch (e) {
        console.error(`[QuestService] Error saving initial quests for user ${userId}:`, e);
        return { success: false, error: e instanceof Error ? e : new Error("Failed to save initial quests") };
    }
  }

  /**
   * Marks a quest as completed for a specific user in the database.
   */
  static async completeQuest(
    userId: string,
    questId: string
    // Removed currentQuests and originalQuestStates dependencies
  ): Promise<{ error: Error | null }> { // Return only error status
    // Find the quest in DB to get its total progress (optional, could assume 1)
    // Or just update status and progress assuming completion means setting current = total
    // For simplicity, let's just set status and completed_at
    console.log(`[QuestService] Marking quest ${questId} completed for user ${userId}.`);
    const updates: Partial<Quest> = {
      status: 'completed',
        // Assuming progress should be maxed out on completion
        // progress: { current: total, total: total} // Need to fetch total first or make assumption
        completedAt: new Date(),
    };
    // Ideally, fetch the quest first to set progress correctly, but for simplicity:
    // We'll rely on the caller (context) to also update progress if needed via setQuestProgress
    // or modify this to fetch first.
    // Let's just update status and timestamp for now.
    return this._updateUserQuestInDb(userId, questId, updates);
  }

  /**
   * Marks a quest as skipped for a specific user in the database.
   */
  static async skipQuest(
    userId: string,
    questId: string
    // Removed dependencies
  ): Promise<{ error: Error | null }> {
    console.log(`[QuestService] Marking quest ${questId} skipped for user ${userId}.`);
    const updates: Partial<Quest> = {
        status: 'skipped'
    };
    return this._updateUserQuestInDb(userId, questId, updates);
  }

  /**
   * Increments quest progress for a specific user in the database.
   * Note: This requires fetching the quest first to calculate new progress and check completion.
   */
  static async incrementQuestProgress(
    userId: string,
    questId: string
    // Removed dependencies
  ): Promise<{ requiresStatUpdate: boolean; error: Error | null }> {
    console.log(`[QuestService] Incrementing progress for quest ${questId}, user ${userId}.`);
    try {
        // 1. Fetch the current quest state
        const { data: questData, error: fetchError } = await this.supabase
            .from('user_quests')
            .select('progress_current, progress_total, status')
            .eq('quest_instance_id', questId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !questData) {
            throw fetchError || new Error(`Quest ${questId} not found for increment.`);
        }

        if (questData.status !== 'active') {
            console.warn(`[QuestService] Cannot increment progress for non-active quest ${questId}.`);
            return { requiresStatUpdate: false, error: null }; // Or an error?
        }

        // 2. Calculate new progress
        const newCurrent = Math.min(questData.progress_total, questData.progress_current + 1);
        if (newCurrent === questData.progress_current) {
            return { requiresStatUpdate: false, error: null }; // Already maxed
    }

        const isNowCompleted = newCurrent === questData.progress_total;
        const newStatus: 'active' | 'completed' | 'skipped' = isNowCompleted ? 'completed' : 'active';

        // 3. Update the quest in DB
        const updates: Partial<Quest> = {
            progress: { current: newCurrent, total: questData.progress_total },
      status: newStatus,
            completedAt: isNowCompleted ? new Date() : undefined,
    };
        const { error: updateError } = await this._updateUserQuestInDb(userId, questId, updates);

        if (updateError) {
            throw updateError;
        }

        return { requiresStatUpdate: isNowCompleted, error: null };

    } catch(e) {
        console.error(`[QuestService] Error incrementing quest progress for ${questId}:`, e);
        return { requiresStatUpdate: false, error: e instanceof Error ? e : new Error("Failed to increment progress") };
    }
    }

  /**
   * Decrements quest progress for a specific user in the database.
   */
   static async decrementQuestProgress(
     userId: string,
     questId: string
     // Removed dependencies
   ): Promise<{ error: Error | null }> {
    console.log(`[QuestService] Decrementing progress for quest ${questId}, user ${userId}.`);
    try {
        // 1. Fetch current progress
        const { data: questData, error: fetchError } = await this.supabase
            .from('user_quests')
            .select('progress_current')
            .eq('quest_instance_id', questId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !questData) {
            throw fetchError || new Error(`Quest ${questId} not found for decrement.`);
        }

        // 2. Calculate new progress
        const newCurrent = Math.max(0, questData.progress_current - 1);
        if (newCurrent === questData.progress_current) {
            return { error: null }; // Already at 0
      }

        // 3. Update DB
        const updates: Partial<Quest> = {
            progress: { current: newCurrent, total: -1 }, // Pass -1 for total if unknown/not changing
        };
        const dbUpdates = _mapQuestToDbUpdate(updates);
        delete dbUpdates.progress_total; // Don't update total

        const { error: updateError } = await this.supabase
            .from('user_quests')
            .update(dbUpdates)
            .eq('quest_instance_id', questId)
            .eq('user_id', userId);

        if (updateError) {
            throw updateError;
        }
        return { error: null };

    } catch(e) {
        console.error(`[QuestService] Error decrementing quest progress for ${questId}:`, e);
        return { error: e instanceof Error ? e : new Error("Failed to decrement progress") };
    }
   }

  /**
   * Sets quest progress for a specific user in the database.
   */
  static async setQuestProgress(
    userId: string,
    questId: string,
    count: number
    // Removed dependencies
  ): Promise<{ requiresStatUpdate: boolean; error: Error | null }> {
    console.log(`[QuestService] Setting progress for quest ${questId} to ${count}, user ${userId}.`);
    try {
        // 1. Fetch the current quest state (need total and status)
        const { data: questData, error: fetchError } = await this.supabase
            .from('user_quests')
            .select('progress_current, progress_total, status')
            .eq('quest_instance_id', questId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !questData) {
            throw fetchError || new Error(`Quest ${questId} not found for setProgress.`);
        }

        if (questData.status !== 'active') {
            console.warn(`[QuestService] Cannot set progress for non-active quest ${questId}.`);
            return { requiresStatUpdate: false, error: null }; // Or an error?
        }

        // 2. Calculate new progress
        const newCurrent = Math.max(0, Math.min(questData.progress_total, count));
        if (newCurrent === questData.progress_current) {
            return { requiresStatUpdate: false, error: null }; // No change
     }

        const isNowCompleted = newCurrent === questData.progress_total;
        const newStatus: 'active' | 'completed' | 'skipped' = isNowCompleted ? 'completed' : 'active';

        // 3. Update the quest in DB
        const updates: Partial<Quest> = {
            progress: { current: newCurrent, total: questData.progress_total },
       status: newStatus,
            completedAt: isNowCompleted ? new Date() : undefined,
     };
        const { error: updateError } = await this._updateUserQuestInDb(userId, questId, updates);

        if (updateError) {
            throw updateError;
        }

        return { requiresStatUpdate: isNowCompleted, error: null };

    } catch(e) {
        console.error(`[QuestService] Error setting quest progress for ${questId}:`, e);
        return { requiresStatUpdate: false, error: e instanceof Error ? e : new Error("Failed to set progress") };
    }
     }

  /**
   * Reverts a quest's status to active in the database.
   * NOTE: This simplified version only reverts status, not progress or completion count.
   * A more robust undo would require storing original state or recalculating.
   */
  static async undoQuestStatus(
    userId: string,
    questId: string
    // Removed originalQuestStates dependency
  ): Promise<{ requiresStatDecrement: boolean; error: Error | null }> {
    console.log(`[QuestService] Undoing status for quest ${questId}, user ${userId}.`);
    try {
        // 1. Fetch current status to see if decrement is needed
        const { data: questData, error: fetchError } = await this.supabase
            .from('user_quests')
            .select('status')
            .eq('quest_instance_id', questId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !questData) {
            throw fetchError || new Error(`Quest ${questId} not found for undo.`);
      }

        const requiresDecrement = questData.status === 'completed';

        // 2. Update status to active, clear completedAt
        const updates: Partial<Quest> = {
        status: 'active', 
            completedAt: undefined,
            // Optionally reset progress? For now, keep progress as is.
            // progress: { current: 0, total: ?? } // Would need total
        };
        const { error: updateError } = await this._updateUserQuestInDb(userId, questId, updates);

        if (updateError) {
            throw updateError;
      }

      return {
          requiresStatDecrement: requiresDecrement,
          error: null
      };
    } catch(e) {
         console.error(`[QuestService] Error undoing quest status for ${questId}:`, e);
        return { requiresStatDecrement: false, error: e instanceof Error ? e : new Error("Failed to undo status") };
    }
  }

  /**
   * Generates and saves new daily quests using AI and inserts them into the database.
   */
  static async generateAndSaveDailyQuests(userId: string): Promise<{ success: boolean; error: Error | null }> {
    console.log(`[QuestService] Generating and saving new daily quests for user ${userId}...`);

    try {
      // 1. Fetch Context (Goals)
      // TODO: Add completed quests context if needed by AI prompt
      // Correctly pass userId to get user-specific goals
      const { data: roadmapGoals, error: goalsError } = await RoadmapService.getGoals(userId);
      if (goalsError) {
        console.warn(`[QuestService] Failed to fetch goals for context during generation for user ${userId}:`, goalsError.message);
      }
      const context = {
         roadmapGoals: roadmapGoals || [],
         completedQuestsToday: [], // Placeholder
      };

      // 2. Generate New Quests via AI Service
      const { quests: newQuests, error: aiError } = await AIService.generateDailyQuests(userId, context);
      if (aiError || !newQuests || newQuests.length === 0) {
        throw aiError || new Error("AI service failed to generate daily quests or returned empty list");
      }

      // 3. Format for DB insertion
      const dbRows = newQuests.map(q => ({
          user_id: userId,
          title: q.title,
          description: q.description,
          goal_id: q.goalId,
          stats: q.stats,
          status: 'active',
          progress_current: q.progress?.current ?? 0,
          progress_total: q.progress?.total ?? 1,
          stat_increments: q.statIncrements,
          discipline_increment_amount: q.disciplineIncrementAmount,
          // generated_at uses default now()
      }));

      // 4. Insert into DB
      const { error: insertError } = await this.supabase.from('user_quests').insert(dbRows);
      if (insertError) {
        console.error(`[QuestService] DB error inserting generated quests for user ${userId}:`, insertError);
        throw new Error(insertError.message);
      }

      console.log(`[QuestService] Successfully generated and saved ${dbRows.length} daily quests for user ${userId}.`);
      return { success: true, error: null };

    } catch (e: any) {
      console.error(`[QuestService] Error generating/saving daily quests for user ${userId}:`, e);
      return { success: false, error: e instanceof Error ? e : new Error("Daily quest generation/saving failed") };
    }
  }
}

export default QuestService; 