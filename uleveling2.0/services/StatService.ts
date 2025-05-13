import { Stat, mockStats } from "@/mock/statsData";
import { StatCategory } from "@/types/quest";
import AuthService from './AuthService'; // Import Supabase client access
import { StatBaseValues } from '@/types/ai'; // Import the new type
import CacheService from './CacheService';

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// Define the structure for user stats object returned by getStats
export interface UserStats {
    [label: string]: Stat; // Maps StatCategory label (e.g., 'STR') to Stat object
}

// Define the default structure for a single stat when not found in DB
const defaultStat = (label: StatCategory): Stat => {
    const mock = mockStats.find(s => s.label === label);
    return {
        id: label,
        label: label,
        baseValue: 5,
        bonus: 0,
        totalValue: 5,
        iconName: mock?.iconName ?? 'Barbell'
    };
};

class StatService {

    private static supabase = AuthService.client;

  /**
   * Fetches all stats for a user from the database.
   * Returns a UserStats object mapping labels to Stat objects.
   * Initializes missing stats with defaults.
   */
  static async getStats(userId: string): Promise<{ data: UserStats | null; error: Error | null }> {
    console.log(`[StatService] Attempting to get cached stats for user ${userId}...`);
    const cached = await CacheService.get<UserStats>(`stats_${userId}`);
    if (cached) {
      console.log(`[StatService] Returning cached stats for user ${userId}.`);
      return { data: cached, error: null };
    }

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

      // Initialize with defaults from mockStats
      const userStats: UserStats = {};
      mockStats.forEach(m => {
          const label = m.label as StatCategory;
          userStats[label] = defaultStat(label);
      });

      // Check if dbStats is an array and process it
      if (Array.isArray(dbStats)) {
          const foundLabels = new Set<string>();
          dbStats.forEach(row => {
              const label = row.stat_label as StatCategory;
              if (label && userStats[label] && typeof row.base_value === 'number' && typeof row.bonus_value === 'number') {
                  userStats[label] = {
                      ...userStats[label],
                      baseValue: row.base_value,
                      bonus: row.bonus_value,
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

      console.log(`[StatService] Caching stats for user ${userId}.`);
      await CacheService.set(`stats_${userId}`, userStats, CACHE_TTL);

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

        console.log(`[StatService] Preparing to upsert stats data for user ${userId}:`, JSON.stringify(upsertData, null, 2));

        const { error } = await this.supabase
            .from('user_stats')
            .upsert(upsertData, { onConflict: 'user_id,stat_label' });

        console.log(`[StatService] Upsert completed for user ${userId}. Supabase error:`, JSON.stringify(error, null, 2));

        if (error) {
            console.error(`[StatService] DB error setting initial stats for user ${userId}:`, error);
            throw new Error(error.message);
        }

        console.log(`[StatService] Caching initial stats in UserStats format for user ${userId}.`);
        const userStatsToCache: UserStats = {};
        Object.entries(baseStats).forEach(([label, baseValue]) => {
            const statLabel = label as StatCategory;
            const defaultInfo = defaultStat(statLabel); // Use your existing defaultStat helper
            userStatsToCache[statLabel] = {
                id: statLabel,
                label: statLabel,
                baseValue: baseValue,
                bonus: 0, // Bonus is 0 initially
                totalValue: baseValue, // Total = base + 0
                iconName: defaultInfo.iconName, // Get icon from defaultStat helper
            };
        });
        await CacheService.set(`stats_${userId}`, userStatsToCache, CACHE_TTL); // Cache the correctly formatted UserStats

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
    return this.incrementStatBonus(userId, 'DIS', amount);
  }

} // end of StatService class

export default StatService;