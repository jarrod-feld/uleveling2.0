import { Goal } from "@/mock/roadmapData";
import AuthService from './AuthService'; // Import Supabase client access
import { StatCategory } from "@/types/quest"; // Import StatCategory for casting
import CacheService from './CacheService';

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// Helper to map DB row to Goal interface
function _mapDbRowToGoal(row: any): Goal {
    return {
        id: row.goal_id,
        title: row.title,
        description: row.description,
        // Cast category from DB string to StatCategory type (excluding 'ALL')
        category: row.category as Exclude<StatCategory, 'ALL'>,
        // Map DB timestamps to Date objects
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        // targetDate and isCompleted are not part of the Goal interface
    };
}

class RoadmapService {

    private static supabase = AuthService.client;

  /**
   * Fetches all goals for a specific user from the database.
   */
  static async getGoals(userId: string): Promise<{ data: Goal[] | null; error: Error | null }> {
    // Attempt to return cached goals
    console.log(`[RoadmapService] getGoals called for user ${userId}. Attempting to get cached goals...`);
    const cached = await CacheService.get<Goal[]>(`goals_${userId}`);
    if (cached) {
      console.log(`[RoadmapService] Returning ${cached.length} cached goals for user ${userId}.`);
      return { data: cached, error: null };
    }

    console.log(`[RoadmapService] No cached goals found for user ${userId}. Fetching from DB...`);
    if (!userId) {
        console.warn("[RoadmapService] User ID is null/undefined. Returning empty goals and error.");
        return { data: [], error: new Error("User ID required to fetch goals.") };
    }
    try {
      const { data, error } = await this.supabase
        .from('user_goals')
        // Select only columns needed for the Goal interface + user_id for filtering
        .select('goal_id, user_id, title, description, category, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      console.log(`[RoadmapService] DB response for user ${userId}:`, { data, error });

      if (error) {
        console.error(`[RoadmapService] DB error fetching goals for user ${userId}:`, error);
        throw new Error(error.message);
      }

      const goals = (data || []).map(_mapDbRowToGoal);
      console.log(`[RoadmapService] Mapped DB data to ${goals.length} goals for user ${userId}.`);
      
      if (goals.length > 0) {
        console.log(`[RoadmapService] Caching ${goals.length} fetched goals for user ${userId}.`);
        await CacheService.set(`goals_${userId}`, goals, CACHE_TTL);
      } else {
        console.log(`[RoadmapService] No goals from DB to cache for user ${userId}.`);
      }

      return { data: goals, error: null };

    } catch (e) {
      console.error(`[RoadmapService] Catch block error fetching goals for user ${userId}:`, e);
      return { data: null, error: e instanceof Error ? e : new Error("Failed to fetch goals") };
    }
  }

  /**
   * Saves goals (e.g., from AI generation/onboarding) for a specific user.
   * Uses INSERT and returns the newly created goals with their DB-generated IDs.
   */
  static async saveGoals(userId: string, goals: Omit<Goal, 'id'>[]): Promise<{ data: Goal[] | null; error: Error | null }> { // Expect goals without IDs, return goals WITH IDs
    console.log(`[RoadmapService] Saving ${goals.length} initial goals for user ${userId} to DB...`);
     if (!userId) {
        return { data: null, error: new Error("User ID required to save goals.") };
     }
    if (!goals || goals.length === 0) {
      console.log(`[RoadmapService] No goals to save for user ${userId}.`);
      return { data: [], error: null }; // Nothing to save, return empty array
    }

    // Map Goal interface fields (without ID) to corresponding DB columns
    const dbRows = goals.map(g => ({
      // goal_id is omitted - let DB generate it
      user_id: userId,
      title: g.title,
      description: g.description,
      category: g.category,
      // Let created_at, updated_at use DB defaults
      // target_date and is_completed are not mapped from Goal interface
    }));

    console.log(`[RoadmapService] Attempting to insert the following goal rows for user ${userId}:`, JSON.stringify(dbRows, null, 2)); // Log data being sent

    try {
      // Use insert and select to get back the generated IDs
      const { data: insertedData, error } = await this.supabase
        .from('user_goals')
        .insert(dbRows)
        .select('*'); // Select all columns to map back

      if (error) {
        console.error(`[RoadmapService] DB error saving goals for user ${userId}:`, error);
        throw new Error(error.message);
      }

      // Map the inserted data (including generated IDs and timestamps) back to Goal[]
      const savedGoalsWithIds = (insertedData || []).map(_mapDbRowToGoal);

      console.log(`[RoadmapService] Caching ${savedGoalsWithIds.length} saved goals for user ${userId}.`);
      await CacheService.set(`goals_${userId}`, savedGoalsWithIds, CACHE_TTL);

      return { data: savedGoalsWithIds, error: null }; // Return goals with IDs
    } catch (e) {
      console.error(`[RoadmapService] Error saving goals for user ${userId}:`, e);
      return { data: null, error: e instanceof Error ? e : new Error("Failed to save goals") };
    }
  }

  // Removed getGoalById and mock data store
}

export default RoadmapService; 