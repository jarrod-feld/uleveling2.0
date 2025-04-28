import { Quest, mockDailyQuests } from "@/mock/dashboardData";
import { QuestStatus } from "@/types/quest";

// Simulate a delay for async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for simulation (replace with actual API calls)
let questsStore: Quest[] = [...mockDailyQuests];

// Helper for deep copying state to prevent mutation issues
function deepCopy<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error("Deep copy failed:", e);
    return obj; // Fallback or handle error appropriately
  }
}

class QuestService {
  /**
   * Fetches all quests.
   * Replace with actual API call.
   */
  static async getQuests(): Promise<{ data: Quest[] | null; error: Error | null }> {
    // console.log("[QuestService] Fetching quests...");
    await delay(50); // Simulate network latency
    try {
      // In a real app: const { data, error } = await supabase.from('quests').select('*');
      const data = deepCopy(questsStore); // Return a deep copy
      // console.log("[QuestService] Quests fetched successfully.");
      return { data, error: null };
    } catch (e: any) {
      // Error log can stay
      console.error("[QuestService] Error fetching quests:", e);
      return { data: null, error: new Error("Failed to fetch quests") };
    }
  }

  /**
   * Updates a specific quest on the backend (simulated).
   * This is intended for internal use by other service methods.
   */
  private static async updateQuestBackend(updatedQuest: Quest): Promise<{ data: Quest | null; error: Error | null }> {
    // console.log(`[QuestService Internal] Updating quest ${updatedQuest.id} on backend...`, updatedQuest);
    await delay(30); // Simulate network latency
    try {
      const index = questsStore.findIndex(q => q.id === updatedQuest.id);
      if (index === -1) {
        throw new Error(`Quest with id ${updatedQuest.id} not found`);
      }
      // In a real app: const { data, error } = await supabase.from('quests').update({...}).eq('id', updatedQuest.id).select().single();
      questsStore[index] = deepCopy(updatedQuest); // Update in-memory store with a copy
      const data = deepCopy(updatedQuest); // Return a copy
      // console.log(`[QuestService Internal] Quest ${updatedQuest.id} updated successfully on backend.`);
      return { data, error: null };
    } catch (e: any) {
      // Error log can stay
      console.error(`[QuestService Internal] Error updating quest ${updatedQuest.id}:`, e);
      return { data: null, error: new Error(`Failed to update quest ${updatedQuest.id}`) };
    }
  }

  /**
   * Marks a quest as completed.
   */
  static async completeQuest(
    questId: string,
    currentQuests: Quest[],
    originalQuestStates: Record<string, Quest>
  ): Promise<{ updatedQuest: Quest | null; updatedOriginalStates: Record<string, Quest>; error: Error | null }> {
    // console.log(`[QuestService] Attempting to complete quest ${questId}`);
    const questToUpdate = currentQuests.find(q => q.id === questId);

    if (!questToUpdate || questToUpdate.status === 'completed') {
      // Warning log can stay
      console.warn(`[QuestService] Complete quest ${questId} aborted: Not found or already completed.`);
      return { updatedQuest: null, updatedOriginalStates: originalQuestStates, error: new Error("Quest not found or already completed") };
    }

    // 1. Save Original State (Deep Copy)
    const newOriginalStates = deepCopy(originalQuestStates);
    newOriginalStates[questId] = deepCopy(questToUpdate); // Store state *before* completion
    // console.log(`[QuestService] Complete: Stored original state for ${questId}`);

    // 2. Prepare Update Payload
    const updatedQuestData: Quest = {
      ...questToUpdate,
      status: 'completed',
      progress: { ...questToUpdate.progress, current: questToUpdate.progress.total },
      completedAt: new Date(), // Set completion timestamp
    };

    // 3. Update Backend
    const { data: backendUpdateResult, error: backendError } = await this.updateQuestBackend(updatedQuestData);

    if (backendError || !backendUpdateResult) {
      // Error log can stay
      console.error(`[QuestService] Complete: Backend update failed for ${questId}:`, backendError?.message);
      // Don't revert original state here, let context decide based on error
      return { updatedQuest: null, updatedOriginalStates: originalQuestStates, error: backendError || new Error("Backend update failed") };
    }

    // console.log(`[QuestService] Complete: Quest ${questId} completed successfully.`);
    return { updatedQuest: backendUpdateResult, updatedOriginalStates: newOriginalStates, error: null };
  }

  /**
   * Marks a quest as skipped.
   */
  static async skipQuest(
    questId: string,
    currentQuests: Quest[],
    originalQuestStates: Record<string, Quest>
  ): Promise<{ updatedQuest: Quest | null; updatedOriginalStates: Record<string, Quest>; error: Error | null }> {
      // console.log(`[QuestService] Attempting to skip quest ${questId}`);
      const questToUpdate = currentQuests.find(q => q.id === questId);

      if (!questToUpdate || questToUpdate.status === 'skipped') {
        // Warning log can stay
        console.warn(`[QuestService] Skip quest ${questId} aborted: Not found or already skipped.`);
        return { updatedQuest: null, updatedOriginalStates: originalQuestStates, error: new Error("Quest not found or already skipped") };
      }

      // 1. Save Original State (Deep Copy)
      const newOriginalStates = deepCopy(originalQuestStates);
      newOriginalStates[questId] = deepCopy(questToUpdate); // Store state *before* skipping
      // console.log(`[QuestService] Skip: Stored original state for ${questId}`);

      // 2. Prepare Update Payload
      const updatedQuestData: Quest = {
        ...questToUpdate,
        status: 'skipped',
      };

      // 3. Update Backend
      const { data: backendUpdateResult, error: backendError } = await this.updateQuestBackend(updatedQuestData);

      if (backendError || !backendUpdateResult) {
        // Error log can stay
        console.error(`[QuestService] Skip: Backend update failed for ${questId}:`, backendError?.message);
        return { updatedQuest: null, updatedOriginalStates: originalQuestStates, error: backendError || new Error("Backend update failed") };
      }

      // console.log(`[QuestService] Skip: Quest ${questId} skipped successfully.`);
      return { updatedQuest: backendUpdateResult, updatedOriginalStates: newOriginalStates, error: null };
  }

  /**
   * Increments quest progress. Handles completion if progress reaches total.
   */
  static async incrementQuestProgress(
    questId: string,
    currentQuests: Quest[],
    originalQuestStates: Record<string, Quest>
  ): Promise<{ updatedQuest: Quest | null; updatedOriginalStates: Record<string, Quest>; requiresStatUpdate: boolean; error: Error | null }> {
    // console.log(`[QuestService] Attempting to increment progress for quest ${questId}`);
    const questToUpdate = currentQuests.find(q => q.id === questId);

    if (!questToUpdate || questToUpdate.status !== 'active' || !questToUpdate.progress) {
       // Warning log can stay
       console.warn(`[QuestService] Increment quest ${questId} aborted: Not found, not active, or no progress tracking.`);
       return { updatedQuest: null, updatedOriginalStates: originalQuestStates, requiresStatUpdate: false, error: new Error("Quest not found or not active") };
    }

    const newCurrent = Math.min(questToUpdate.progress.total, questToUpdate.progress.current + 1);
    if (newCurrent === questToUpdate.progress.current) {
       // console.log(`[QuestService] Increment quest ${questId}: Already at max progress.`);
       return { updatedQuest: questToUpdate, updatedOriginalStates: originalQuestStates, requiresStatUpdate: false, error: null }; // No change needed
    }

    const isNowCompleted = newCurrent === questToUpdate.progress.total;
    const newStatus: QuestStatus = isNowCompleted ? 'completed' : 'active';
    let newOriginalStates = originalQuestStates; // Default to original

    // 1. Save Original State IF completing
    if (isNowCompleted) {
      newOriginalStates = deepCopy(originalQuestStates);
      newOriginalStates[questId] = deepCopy(questToUpdate); // Store state *before* completion
      // console.log(`[QuestService] Increment: Stored original state for ${questId} before completion.`);
    }

    // 2. Prepare Update Payload
    const updatedQuestData: Quest = {
      ...questToUpdate,
      status: newStatus,
      progress: { ...questToUpdate.progress, current: newCurrent },
      completedAt: isNowCompleted ? new Date() : undefined, // Set timestamp only if completed
    };

    // 3. Update Backend
    const { data: backendUpdateResult, error: backendError } = await this.updateQuestBackend(updatedQuestData);

    if (backendError || !backendUpdateResult) {
      // Error log can stay
      console.error(`[QuestService] Increment: Backend update failed for ${questId}:`, backendError?.message);
      // Revert original state save if it happened
      if (isNowCompleted) {
         newOriginalStates = originalQuestStates;
      }
      return { updatedQuest: null, updatedOriginalStates: originalQuestStates, requiresStatUpdate: false, error: backendError || new Error("Backend update failed") };
    }

    // console.log(`[QuestService] Increment: Quest ${questId} progress updated successfully.`);
    return { updatedQuest: backendUpdateResult, updatedOriginalStates: newOriginalStates, requiresStatUpdate: isNowCompleted, error: null };
  }

  /**
   * Decrements quest progress.
   */
   static async decrementQuestProgress(
     questId: string,
     currentQuests: Quest[]
   ): Promise<{ updatedQuest: Quest | null; error: Error | null }> {
     // console.log(`[QuestService] Attempting to decrement progress for quest ${questId}`);
     const questToUpdate = currentQuests.find(q => q.id === questId);

     if (!questToUpdate || questToUpdate.status !== 'active' || !questToUpdate.progress) {
        // Warning log can stay
        console.warn(`[QuestService] Decrement quest ${questId} aborted: Not found, not active, or no progress tracking.`);
        return { updatedQuest: null, error: new Error("Quest not found or not active") };
     }

     const newCurrent = Math.max(0, questToUpdate.progress.current - 1);
      if (newCurrent === questToUpdate.progress.current) {
        // console.log(`[QuestService] Decrement quest ${questId}: Already at min progress.`);
        return { updatedQuest: questToUpdate, error: null }; // No change needed
      }

     // 1. Prepare Update Payload
     const updatedQuestData: Quest = {
         ...questToUpdate,
         progress: { ...questToUpdate.progress, current: newCurrent },
     };

     // 2. Update Backend
     const { data: backendUpdateResult, error: backendError } = await this.updateQuestBackend(updatedQuestData);

     if (backendError || !backendUpdateResult) {
       // Error log can stay
       console.error(`[QuestService] Decrement: Backend update failed for ${questId}:`, backendError?.message);
       return { updatedQuest: null, error: backendError || new Error("Backend update failed") };
     }

     // console.log(`[QuestService] Decrement: Quest ${questId} progress updated successfully.`);
     return { updatedQuest: backendUpdateResult, error: null };
   }

  /**
   * Sets quest progress to a specific value. Handles completion if progress reaches total.
   */
  static async setQuestProgress(
    questId: string,
    count: number,
    currentQuests: Quest[],
    originalQuestStates: Record<string, Quest>
  ): Promise<{ updatedQuest: Quest | null; updatedOriginalStates: Record<string, Quest>; requiresStatUpdate: boolean; error: Error | null }> {
     // console.log(`[QuestService] Attempting to set progress for quest ${questId} to ${count}`);
     const questToUpdate = currentQuests.find(q => q.id === questId);

     if (!questToUpdate || questToUpdate.status !== 'active' || !questToUpdate.progress) {
        // Warning log can stay
        console.warn(`[QuestService] Set Progress quest ${questId} aborted: Not found, not active, or no progress tracking.`);
        return { updatedQuest: null, updatedOriginalStates: originalQuestStates, requiresStatUpdate: false, error: new Error("Quest not found or not active") };
     }

     const newCurrent = Math.max(0, Math.min(questToUpdate.progress.total, count));
     if (newCurrent === questToUpdate.progress.current) {
       // console.log(`[QuestService] Set Progress quest ${questId}: No change in progress.`);
       return { updatedQuest: questToUpdate, updatedOriginalStates: originalQuestStates, requiresStatUpdate: false, error: null }; // No change needed
     }

     const isNowCompleted = newCurrent === questToUpdate.progress.total;
     const newStatus: QuestStatus = isNowCompleted ? 'completed' : 'active';
     let newOriginalStates = originalQuestStates; // Default to original

     // 1. Save Original State IF completing
     if (isNowCompleted) {
       newOriginalStates = deepCopy(originalQuestStates);
       newOriginalStates[questId] = deepCopy(questToUpdate); // Store state *before* completion
       // console.log(`[QuestService] Set Progress: Stored original state for ${questId} before completion.`);
     }

     // 2. Prepare Update Payload
     const updatedQuestData: Quest = {
       ...questToUpdate,
       status: newStatus,
       progress: { ...questToUpdate.progress, current: newCurrent },
       completedAt: isNowCompleted ? new Date() : undefined, // Set timestamp only if completed
     };

     // 3. Update Backend
     const { data: backendUpdateResult, error: backendError } = await this.updateQuestBackend(updatedQuestData);

     if (backendError || !backendUpdateResult) {
       // Error log can stay
       console.error(`[QuestService] Set Progress: Backend update failed for ${questId}:`, backendError?.message);
       // Revert original state save if it happened
       if (isNowCompleted) {
          newOriginalStates = originalQuestStates;
       }
       return { updatedQuest: null, updatedOriginalStates: originalQuestStates, requiresStatUpdate: false, error: backendError || new Error("Backend update failed") };
     }

     // console.log(`[QuestService] Set Progress: Quest ${questId} progress updated successfully.`);
     return { updatedQuest: backendUpdateResult, updatedOriginalStates: newOriginalStates, requiresStatUpdate: isNowCompleted, error: null };
  }

  /**
   * Reverts a quest's status from completed/skipped back to active.
   */
  static async undoQuestStatus(
    questId: string,
    originalQuestStates: Record<string, Quest>
  ): Promise<{ updatedQuest: Quest | null; requiresStatDecrement: boolean; error: Error | null }> {
      // console.log(`[QuestService] Attempting to undo status for quest ${questId}`);
      const questToRestore = originalQuestStates[questId]; // State BEFORE complete/skip

      if (!questToRestore) {
        // Warning log can stay
        console.warn(`[QuestService] Undo quest ${questId} aborted: No original state found.`);
        return { updatedQuest: null, requiresStatDecrement: false, error: new Error("No original state found to undo") };
      }

      const actualOriginalStatusBeforeUndo = questToRestore.status;
      const requiresDecrement = actualOriginalStatusBeforeUndo === 'completed';

      // 1. Prepare Update Payload (Force 'active', clear timestamp, reset progress if needed)
      const stateAfterUndo: Quest = {
        ...questToRestore, 
        status: 'active', 
        completedAt: undefined, // Explicitly clear timestamp
        progress: requiresDecrement 
          ? { ...questToRestore.progress, current: 0 } // Reset progress if was completed
          : questToRestore.progress, // Otherwise, keep original progress
      };
      // console.log("[QuestService] Undo: State being sent to backend:", stateAfterUndo);

      // 2. Update Backend
      const { data: backendUpdateResult, error: backendError } = await this.updateQuestBackend(stateAfterUndo);

      if (backendError || !backendUpdateResult) {
        // Error log can stay
        console.error(`[QuestService] Undo: Backend update failed for ${questId}:`, backendError?.message);
        return { updatedQuest: null, requiresStatDecrement: false, error: backendError || new Error("Backend update failed") };
      }

      // console.log(`[QuestService] Undo: Quest ${questId} status reverted successfully.`);
      return {
          updatedQuest: backendUpdateResult,
          requiresStatDecrement: requiresDecrement,
          error: null
      };
  }

  // --- Potentially add other methods like createQuest, deleteQuest later ---
}

export default QuestService; 