import { Stat, StatCategory, statCategories, mockStats } from "@/mock/statsData";
import AuthService from './AuthService'; // Import Supabase client access
import { StatBaseValues } from '@/types/ai'; // Import the new type

// Define the structure for user stats object returned by getStats
export interface UserStats {
    [label: string]: Stat; // Maps StatCategory label (e.g., 'STR') to Stat object
}

// Define the default structure for a single stat if not found in DB
const defaultStat = (label: StatCategory): Stat => ({
    id: label, // Use label as ID for simplicity in the object structure
    label: label,
    name: mockStats.find(s => s.label === label)?.name || label, // Get full name from mock data or use label
    baseValue: 5,  // Default base value from DB schema
    bonusValue: 0, // Default bonus value from DB schema
    totalValue: 5   // Calculated default total
});

class StatService {

    private static supabase = AuthService.client;

  /**
   * Fetches all stats for a user from the database.
   * Returns a UserStats object mapping labels to Stat objects.
   * Initializes missing stats with defaults.
   */
  static async getStats(userId: string): Promise<{ data: UserStats | null; error: Error | null }> {
    console.log(`[StatService] Fetching stats for user ${userId} from DB...`);
    if (!userId) {
        return { data: null, error: new Error("User ID required to fetch stats.") };
    }
    try {
      // Log the raw response
      const response = await this.supabase
        .from('user_stats')
        .select('stat_label, base_value, bonus_value')
        .eq('user_id', userId);

      console.log('[StatService] Raw Supabase response:', JSON.stringify(response, null, 2));

      const { data: dbStats, error } = response; // Destructure after logging

      if (error) { // Check error first
        console.error(`[StatService] DB error object present fetching stats for user ${userId}:`, error);
        throw new Error(error.message);
      }

      // Initialize with defaults
      const userStats: UserStats = {};
      if (Array.isArray(statCategories)) {
          statCategories.forEach(label => {
              userStats[label] = defaultStat(label);
          });
      } else {
          console.error("[StatService] Critical Error: statCategories imported from mock/statsData is not an array!");
          // Handle this critical error, perhaps return an error or default structure
          return { data: null, error: new Error("Internal configuration error: statCategories invalid.") };
      }

      // Check if dbStats is an array and process it
      if (Array.isArray(dbStats)) {
          const foundLabels = new Set<string>();
          dbStats.forEach(row => {
              const label = row.stat_label as StatCategory;
              if (label && userStats[label] && typeof row.base_value === 'number' && typeof row.bonus_value === 'number') {
                  userStats[label] = {
                      ...userStats[label],
                      baseValue: row.base_value,
                      bonusValue: row.bonus_value,
                      totalValue: row.base_value + row.bonus_value
                  };
                  foundLabels.add(label);
              } else {
                  console.warn(`[StatService] Skipping row with unexpected structure or invalid label for user ${userId}:`, row);
              }
          });
          console.log(`[StatService] Processed ${dbStats.length} rows from DB for user ${userId}. Found valid labels: ${foundLabels.size}`);
      } else if (dbStats !== null) {
           // Log if dbStats is not an array but also not null (unexpected)
           console.warn(`[StatService] Expected dbStats to be an array or null, but received: ${typeof dbStats}`, dbStats);
      }

      console.log(`[StatService] Final mapped stats for user ${userId}: ${Object.keys(userStats).length}`);
      return { data: userStats, error: null };

    } catch (e) {
      // This will now catch the TypeError if the undefined check somehow fails, or other errors
      console.error(`[StatService] Error during processing stats for user ${userId}:`, e);
      return { data: null, error: e instanceof Error ? e : new Error("Failed to process stats") };
    }
  }

  /**
   * Sets the initial base stats for a user, typically after onboarding.
   * Uses UPSERT to create or update the rows.
   * Initializes bonus_value to 0.
   */
  static async setInitialBaseStats(userId: string, baseStats: StatBaseValues): Promise<{ error: Error | null }> {
    console.log(`[StatService] Setting initial base stats for user ${userId}...`);
    if (!userId) {
      return { error: new Error("User ID required to set initial stats.") };
    }
    if (!baseStats || Object.keys(baseStats).length === 0) {
       return { error: new Error("Base stats data required.") };
    }

    try {
        const upsertData = Object.entries(baseStats).map(([label, baseValue]) => ({
            user_id: userId,
            stat_label: label as StatCategory,
            base_value: baseValue,
            bonus_value: 0, // Initialize bonus to 0
        }));

        const { error } = await this.supabase
            .from('user_stats')
            .upsert(upsertData, { onConflict: 'user_id,stat_label' });

        if (error) {
            console.error(`[StatService] DB error setting initial stats for user ${userId}:`, error);
            throw new Error(error.message);
        }

        console.log(`[StatService] Initial base stats set successfully for user ${userId}.`);
        return { error: null };

    } catch (e) {
        console.error(`[StatService] Failed setting initial stats for user ${userId}:`, e);
        return { error: e instanceof Error ? e : new Error("Failed to set initial base stats") };
    }
  }

  /**
   * Increments the bonus for a specific stat.
   * Uses UPSERT to handle cases where the stat row might not exist yet.
   */
  static async incrementStatBonus(userId: string, statLabel: string, amount: number): Promise<{ error: Error | null }> {
    console.log(`[StatService] Incrementing ${statLabel} bonus by ${amount} for user ${userId} in DB...`);
    if (!userId || !statLabel) {
      return { error: new Error("User ID and Stat Label required.") };
    }

    try {
        // Use RPC call to handle the increment atomically and potential upsert
        const { error } = await this.supabase.rpc('increment_stat_bonus', {
            user_id_input: userId,
            stat_label_input: statLabel,
            increment_amount: amount
        });

      if (error) {
        console.error(`[StatService] DB error incrementing ${statLabel} bonus for user ${userId}:`, error);
        throw new Error(error.message);
      }

      console.log(`[StatService] ${statLabel} bonus incremented successfully for user ${userId}.`);
      return { error: null };

    } catch (e) {
      console.error(`[StatService] Failed incrementing ${statLabel} bonus for user ${userId}:`, e);
      return { error: e instanceof Error ? e : new Error(`Failed to increment ${statLabel} bonus`) };
    }
  }

  /**
   * Increments the bonus for the Discipline stat.
   */
  static async incrementDisciplineBonus(userId: string, amount: number): Promise<{ error: Error | null }> {
    // Delegate to the general function
    return this.incrementStatBonus(userId, 'DIS', amount);
  }

  // Removed cache methods and mock data usage
}

export default StatService; 