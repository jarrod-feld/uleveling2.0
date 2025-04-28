import { Stat, mockStats } from "@/mock/statsData"; // Assuming Stat type is relevant

// Define a structure for user stats if needed (e.g., a map by label)
export interface UserStats {
    [label: string]: Stat;
}

// Amount to increment stats by upon quest completion
const STAT_INCREMENT_AMOUNT = 1;

class StatService {
  /**
   * Fetches the user's stats (base + bonus).
   * Replace with actual API call.
   */
  static async getStats(userId: string): Promise<{ data: UserStats | null; error: Error | null }> {
    console.log(`[StatService] Fetching stats for user ${userId}... (Placeholder)`);
    // Simulate fetching mock data (already includes base/bonus/total)
    const userStats = mockStats.reduce((acc, stat) => {
        acc[stat.label] = stat; // Use label as key
        return acc;
    }, {} as UserStats);

    await new Promise(resolve => setTimeout(resolve, 50));
    return { data: userStats, error: null };
  }

  /**
   * Increments the bonus for a specific stat (excluding DIS).
   * Replace with actual API call.
   */
  static async incrementStatBonus(userId: string, statLabel: string, amount: number = STAT_INCREMENT_AMOUNT): Promise<{ error: Error | null }> {
    console.log(`[StatService] Incrementing ${statLabel} bonus by ${amount} for user ${userId}... (Placeholder)`);
    await new Promise(resolve => setTimeout(resolve, 30));
    // Simulate success
    return { error: null };
  }

  /**
   * Increments the bonus for the Discipline stat.
   * Replace with actual API call.
   */
  static async incrementDisciplineBonus(userId: string, amount: number = STAT_INCREMENT_AMOUNT): Promise<{ error: Error | null }> {
    console.log(`[StatService] Incrementing DIS bonus by ${amount} for user ${userId}... (Placeholder)`);
    await new Promise(resolve => setTimeout(resolve, 30));
    // Simulate success
    return { error: null };
  }

  // Method to update a whole stat - kept for potential future use, but bonus increments are preferred now
  /**
   * Updates a specific stat for the user (e.g., base value changes).
   * Replace with actual API call.
   */
  // static async updateStat(userId: string, statId: string, updatedValue: Partial<Stat>): Promise<{ error: Error | null }> {
  //   console.log(`[StatService] Updating full stat ${statId} for user ${userId} with:`, updatedValue, '(Placeholder)');
  //   await new Promise(resolve => setTimeout(resolve, 50));
  //   return { error: null };
  // }
}
export default StatService; 