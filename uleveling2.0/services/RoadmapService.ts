import { Goal, mockGoals } from "@/mock/roadmapData";

// Simulate a delay for async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for simulation (replace with actual API calls)
let goalsStore: Goal[] = [...mockGoals];

class RoadmapService {
  /**
   * Fetches all goals.
   * Replace with actual API call.
   */
  static async getGoals(): Promise<{ data: Goal[] | null; error: Error | null }> {
    console.log("[RoadmapService] Fetching goals...");
    await delay(40); // Simulate network latency
    try {
      // In a real app: const { data, error } = await supabase.from('goals').select('*');
      const data = [...goalsStore]; // Return a copy
      console.log("[RoadmapService] Goals fetched successfully.");
      return { data, error: null };
    } catch (e: any) {
      console.error("[RoadmapService] Error fetching goals:", e);
      return { data: null, error: new Error("Failed to fetch goals") };
    }
  }

  /**
   * Fetches a single goal by its ID.
   * Replace with actual API call.
   */
  static async getGoalById(id: string): Promise<{ data: Goal | null; error: Error | null }> {
    console.log(`[RoadmapService] Fetching goal ${id}...`);
    await delay(20);
    try {
      const goal = goalsStore.find(g => g.id === id);
      if (!goal) {
        // return { data: null, error: new Error(`Goal with id ${id} not found`) };
        // Returning null data and null error if not found, as the goal might legitimately not exist for a quest
        console.log(`[RoadmapService] Goal ${id} not found.`);
        return { data: null, error: null };
      }
      // In a real app: const { data, error } = await supabase.from('goals').select('*').eq('id', id).single();
      console.log(`[RoadmapService] Goal ${id} fetched successfully.`);
      return { data: { ...goal }, error: null }; // Return a copy
    } catch (e: any) {
      console.error(`[RoadmapService] Error fetching goal ${id}:`, e);
      return { data: null, error: new Error(`Failed to fetch goal ${id}`) };
    }
  }

  // --- Potentially add other methods like createGoal, updateGoal, deleteGoal later ---
}

export default RoadmapService; 