import { Quest, mockDailyQuests } from "@/mock/dashboardData";

// Simulate a delay for async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for simulation (replace with actual API calls)
let questsStore: Quest[] = [...mockDailyQuests];

class QuestService {
  /**
   * Fetches all quests.
   * Replace with actual API call.
   */
  static async getQuests(): Promise<{ data: Quest[] | null; error: Error | null }> {
    console.log("[QuestService] Fetching quests...");
    await delay(50); // Simulate network latency
    try {
      // In a real app: const { data, error } = await supabase.from('quests').select('*');
      const data = [...questsStore]; // Return a copy
      console.log("[QuestService] Quests fetched successfully.");
      return { data, error: null };
    } catch (e: any) {
      console.error("[QuestService] Error fetching quests:", e);
      return { data: null, error: new Error("Failed to fetch quests") };
    }
  }

  /**
   * Updates a specific quest.
   * Replace with actual API call.
   * For simplicity, this example updates the whole quest object.
   * A real implementation might update specific fields (status, progress.current).
   */
  static async updateQuest(updatedQuest: Quest): Promise<{ data: Quest | null; error: Error | null }> {
    console.log(`[QuestService] Updating quest ${updatedQuest.id}...`, updatedQuest);
    await delay(30); // Simulate network latency
    try {
      const index = questsStore.findIndex(q => q.id === updatedQuest.id);
      if (index === -1) {
        throw new Error(`Quest with id ${updatedQuest.id} not found`);
      }
      // In a real app: const { data, error } = await supabase.from('quests').update({...}).eq('id', updatedQuest.id).select().single();
      questsStore[index] = updatedQuest; // Update in-memory store
      const data = { ...updatedQuest }; // Return a copy
      console.log(`[QuestService] Quest ${updatedQuest.id} updated successfully.`);
      return { data, error: null };
    } catch (e: any) {
      console.error(`[QuestService] Error updating quest ${updatedQuest.id}:`, e);
      return { data: null, error: new Error(`Failed to update quest ${updatedQuest.id}`) };
    }
  }

  // --- Potentially add other methods like createQuest, deleteQuest later ---
}

export default QuestService; 