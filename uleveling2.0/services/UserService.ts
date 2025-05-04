import CacheService from './CacheService';
import { isToday, startOfDay } from 'date-fns';
// import { OnboardingData } from '@/app/onboarding'; // Keep if saveOnboardingData needs it

const WARNING_DISMISSED_CACHE_KEY = 'warningDismissedDate';
// const ONBOARDING_DATA_CACHE_KEY_PREFIX = 'onboardingData_'; // No longer caching onboarding data per user this way

// Removed UserOnboardingProfile interface - AI service will get profile context elsewhere

// Helper for delay simulation
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class UserService {

  /**
   * Checks if the daily warning has been dismissed for the current day.
   * @param userId - The ID of the user (currently unused, but good practice).
   * @returns True if the warning was dismissed today, false otherwise.
   */
  static async isWarningDismissedToday(userId: string): Promise<boolean> {
    try {
      const dismissedDateISO = await CacheService.get<string>(WARNING_DISMISSED_CACHE_KEY);
      if (!dismissedDateISO) {
        return false; // Not dismissed if no date is stored
      }
      return isToday(dismissedDateISO);
    } catch (error) {
      console.error(`[UserService] Error checking dismissed date for user ${userId}:`, error);
      return false; // Assume not dismissed on error
    }
  }

  /**
   * Marks the daily warning as dismissed for the current day.
   * @param userId - The ID of the user (currently unused).
   */
  static async dismissWarningForToday(userId: string): Promise<void> {
    try {
      const todayISO = startOfDay(new Date()).toISOString(); // Store the start of today's date
      await CacheService.set(WARNING_DISMISSED_CACHE_KEY, todayISO);
      console.log(`[UserService] Warning dismissed for user ${userId} for date: ${todayISO}`);
    } catch (error) {
      console.error(`[UserService] Error setting dismissed date for user ${userId}:`, error);
    }
  }

  /**
   * Logs the collected onboarding data for a user before AI generation.
   * (Previously saved to cache, now assumed transient).
   * TODO: Decide if any part of this data needs persisting via AccountService.updateProfile.
   */
  static async saveOnboardingData(userId: string, data: any): Promise<{ success: boolean, error: Error | null }> {
    console.log(`[UserService] Received final onboarding data for user ${userId} (logging only):`, JSON.stringify(data, null, 2));
    // Simulate success as we are not saving persistently here
    // If specific fields (e.g., name) should be saved, call AccountService.updateProfile here.
    // const { error } = await AccountService.updateProfile(userId, { name: data.name });
    // if (error) return { success: false, error };
    return { success: true, error: null };
  }

  // Removed getOnboardingProfileData - AI context should come from AccountService or direct args

  // --- Existing methods or placeholders ---
  static async foo() {}
}

export default UserService; 