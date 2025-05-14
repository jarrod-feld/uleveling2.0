import CacheService from './CacheService';
import AuthService from './AuthService';
import UserService from './UserService';
import AIService from './AIService';
import StatService from './StatService';
import RoadmapService from './RoadmapService';
import QuestService from './QuestService';
import AccountService from './AccountService';

const ONBOARDING_COMPLETED_KEY = 'onboardingCompleted';
const ONBOARDING_STEP_KEY = 'onboardingCurrentStep';
const ONBOARDING_DATA_KEY = 'onboardingData';

// Export the stage type
export type OnboardingStage = 'idle' | 'starting' | 'waiting_for_profile' | 'saving_profile' | 'caching_onboarding_data' | 'persisting_onboarding_data' | 'generating_stats' | 'saving_stats' | 'generating_goals' | 'saving_goals' | 'generating_quests' | 'saving_quests' | 'completing' | 'done' | 'error';

class OnboardingService {
  /**
   * Mark onboarding as completed.
   */
  static async setCompleted(): Promise<void> {
    await CacheService.set(ONBOARDING_COMPLETED_KEY, true);
  }

  /**
   * Check if onboarding_data column is non-null for the given user in the users table.
   */
  static async hasOnboardingData(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const { data, error } = await AuthService.client
        .from('users')
        .select('onboarding_data')
        .eq('id', userId)
        .single();
      if (error) {
        console.error(`[OnboardingService] Error fetching onboarding_data for user ${userId}:`, error);
        return false;
      }
      return data?.onboarding_data != null;
    } catch (e) {
      console.error(`[OnboardingService] Exception checking onboarding_data for user ${userId}:`, e);
      return false;
    }
  }

  /**
   * Check if onboarding is completed.
   */
  static async isCompleted(): Promise<boolean> {
    const completed = await CacheService.get<boolean>(ONBOARDING_COMPLETED_KEY);
    return !!completed;
  }

  /**
   * Save the current onboarding step.
   */
  static async setCurrentStep(step: number): Promise<void> {
    await CacheService.set(ONBOARDING_STEP_KEY, step);
  }

  /**
   * Get the last saved onboarding step. Defaults to 0 if not set.
   */
  static async getCurrentStep(): Promise<number> {
    const step = await CacheService.get<number>(ONBOARDING_STEP_KEY);
    return typeof step === 'number' && step >= 0 ? step : 0;
  }

  /**
   * Save onboarding data (partial or full).
   */
  static async setOnboardingData(data: any): Promise<void> {
    await CacheService.set(ONBOARDING_DATA_KEY, data);
  }

  /**
   * Get the last saved onboarding data.
   */
  static async getOnboardingData(): Promise<any | null> {
    return await CacheService.get<any>(ONBOARDING_DATA_KEY);
  }

  /**
   * Clear all onboarding progress (step, data, completion flag).
   */
  static async clear(): Promise<void> {
    await Promise.all([
      CacheService.remove(ONBOARDING_COMPLETED_KEY),
      CacheService.remove(ONBOARDING_STEP_KEY),
      CacheService.remove(ONBOARDING_DATA_KEY),
    ]);
  }

  /**
   * Waits for the user's profile row to appear in the public.users table.
   * Retries a few times with delays.
   * @param userId The user ID to check.
   * @param maxRetries Maximum number of retries.
   * @param delayMs Delay between retries in milliseconds.
   * @throws Error if profile is not found after retries.
   */
  private static async _waitForUserProfile(userId: string, maxRetries: number = 5, delayMs: number = 1500): Promise<void> {
    console.log(`[OnboardingService] Waiting for profile row for user ${userId}...`);
    for (let i = 0; i <= maxRetries; i++) {
      const { data: profileData, error: profileError } = await AccountService.getProfile(userId);

      // Check if profile exists
      if (profileData) {
        console.log(`[OnboardingService] Profile row found for user ${userId} after attempt ${i}.`);
        return; // Profile exists, proceed
      }

      // Log specific error if it's not 'Not Found'
      if (profileError && profileError.message && !profileError.message.includes('PGRST116')) {
         console.error(`[OnboardingService] Error checking profile for user ${userId} (Attempt ${i}):`, profileError.message);
         // Decide if we should throw immediately or continue retrying
         // Throwing immediately might be better for unexpected errors
         throw new Error(`Failed to check user profile due to error: ${profileError.message}`);
      }

      // Profile not found yet (PGRST116 or no data)
      if (i < maxRetries) {
        console.log(`[OnboardingService] Profile row not found for user ${userId} (Attempt ${i}). Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.error(`[OnboardingService] Profile row for user ${userId} not found after ${maxRetries} retries.`);
        throw new Error(`User profile row did not appear in time for user ${userId}.`);
      }
    }
  }

  /**
   * Orchestrates the full onboarding completion flow: saves data, generates and saves stats, goals, and quests, caches them, and marks onboarding as completed.
   */
  static async completeOnboardingFlow(
    userId: string,
    onboardingData: any,
    onProgressUpdate?: (stage: OnboardingStage) => void // Add optional callback parameter
  ): Promise<{ success: boolean; error: Error | null }> {
    // Helper function to report progress
    const reportProgress = (stage: OnboardingStage) => {
      console.log(`[OnboardingService] Progress Update: ${stage}`);
      onProgressUpdate?.(stage);
    };

    console.log(`[OnboardingService] completeOnboardingFlow invoked for user ${userId} with onboardingData:`, onboardingData);
    reportProgress('starting');
    const TTL = 7 * 24 * 60 * 60;
    try {
      // *** NEW STEP: Wait for profile row to be created by trigger ***
      reportProgress('waiting_for_profile');
      await this._waitForUserProfile(userId);
      // ****************************************************************

      reportProgress('caching_onboarding_data');
      console.log(`[OnboardingService] Caching onboarding data for user ${userId}...`);
      await CacheService.set(`onboardingData_${userId}`, onboardingData, TTL);
      console.log(`[OnboardingService] Completed caching onboarding data for user ${userId}.`);
      
      reportProgress('persisting_onboarding_data');
      // 1a. Persist onboarding questionnaire to user table (non-critical)
      try {
        console.log(`[OnboardingService] Persisting onboarding_data to user record for ${userId}`);
        const { error: onboardUpdateError } = await AuthService.client
          .from('users')
          .update({ onboarding_data: onboardingData })
          .eq('id', userId);
        if (onboardUpdateError) {
          console.warn(`[OnboardingService] Warning: could not update onboarding_data column for user ${userId}:`, onboardUpdateError.message);
        } else {
          console.log(`[OnboardingService] onboarding_data column updated for user ${userId}`);
        }
      } catch (e) {
        console.warn(`[OnboardingService] Exception updating onboarding_data for user ${userId}:`, e);
      }

      reportProgress('generating_stats');
      // 2. Generate and save initial stats
      console.log(`[OnboardingService] Initiating initial stats generation for user ${userId}`);
      const { stats, error: statsGenError } = await AIService.generateInitialStats(userId, onboardingData);
      if (statsGenError || !stats) throw statsGenError || new Error("Failed to generate initial stats");
      console.log(`[OnboardingService] Initial stats generated for user ${userId}:`, stats);
      reportProgress('saving_stats');
      const { error: statsSaveError } = await StatService.setInitialBaseStats(userId, stats);
      if (statsSaveError) throw statsSaveError;

      reportProgress('generating_goals');
      // 3. Generate and save initial goals
      console.log(`[OnboardingService] Initiating initial goals generation for user ${userId}`);
      const { goals: goalsWithoutIds, error: goalsGenError } = await AIService.generateInitialGoals(userId, onboardingData);
      if (goalsGenError || !goalsWithoutIds || goalsWithoutIds.length === 0) throw goalsGenError || new Error("Failed to generate initial goals");
      console.log(`[OnboardingService] Initial goals generated for user ${userId}:`, goalsWithoutIds);
      reportProgress('saving_goals');
      const { data: goalsWithIds, error: goalsSaveError } = await RoadmapService.saveGoals(userId, goalsWithoutIds);
      if (goalsSaveError || !goalsWithIds || goalsWithIds.length === 0) throw goalsSaveError || new Error("Failed to save initial goals");

      reportProgress('generating_quests');
      // 4. Generate and save initial quests
      console.log(`[OnboardingService] Initiating initial quests generation for user ${userId}`);
      const { quests: questsWithoutIds, error: questsGenError } = await AIService.generateInitialQuests(userId, goalsWithIds, onboardingData);
      if (questsGenError || !questsWithoutIds) throw questsGenError || new Error("Failed to generate initial quests");
      console.log(`[OnboardingService] Initial quests generated for user ${userId}:`, questsWithoutIds);
      reportProgress('saving_quests');
      // We need the quests with IDs returned from saveQuests if we want to cache them immediately
      // Let's modify the call slightly to expect the data back, matching QuestService's updated signature
      const { success: questsSaveSuccess, error: questsSaveError, data: savedQuestsWithIds } = await QuestService.saveQuests(userId, questsWithoutIds as any);
      if (!questsSaveSuccess) throw questsSaveError || new Error("Failed to save initial quests");
      // savedQuestsWithIds contains the quests with DB IDs, which were already cached by saveQuests

      // 5. Update profile name *after* successful generation (fire and forget)
      if (onboardingData.name) {
          console.log(`[OnboardingService] Updating profile name (fire and forget) for user ${userId} to: ${onboardingData.name}`);
          AccountService.updateProfile(userId, { name: onboardingData.name })
              .then(({ error: nameUpdateError }) => {
                  if (nameUpdateError) {
                      console.warn(`[OnboardingService] Background profile name update failed for user ${userId}:`, nameUpdateError.message);
                  } else {
                      console.log(`[OnboardingService] Background profile name update succeeded for user ${userId}.`);
                  }
              })
              .catch(bgErr => {
                  console.error(`[OnboardingService] Background profile name update threw error for user ${userId}:`, bgErr);
              });
      }

      reportProgress('completing');
      // 6. Mark completed and clear progress
      await this.setCompleted();
      await this.clear();
      reportProgress('done');
      console.log(`[OnboardingService] completeOnboardingFlow completed successfully for user ${userId}`);

      return { success: true, error: null };
    } catch (e: any) {
      console.error(`[OnboardingService] completeOnboardingFlow error for user ${userId}:`, e);
      reportProgress('error');
      return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  // Example placeholder
  static async foo() {}
}
export default OnboardingService; 