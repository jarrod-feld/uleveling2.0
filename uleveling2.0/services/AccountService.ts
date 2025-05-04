import AuthService from './AuthService'; // <-- Re-enabled
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '@/contexts/UserContext'; // Import UserProfile type

// Interface for raw data fetched from the 'users' table
interface DbUserProfileData {
  id: string;
  name: string | null;
  level: number;
  title_id: string | null;
  completed_quests_count: number;
}

// Interface for data allowed in updates
interface UserProfileUpdateData {
  name?: string;
  title_id?: string | null;
  completed_quests_count?: number; // Add completed_quests_count
  level?: number; // Optional: Allow level updates if needed elsewhere
}

/**
 * AccountService
 * Handles user session management, profile data fetching/updating from 'users' table,
 * and delegates auth interactions to AuthService.
 */
class AccountService {

  /**
   * Gets the current user session via AuthService.
   */
  static async getSession(): Promise<{ session: Session | null, error: Error | null }> {
    return AuthService.getSession();
  }

  /**
   * Gets the current authenticated user via AuthService.
   */
  static async getUser(): Promise<{ user: User | null, error: Error | null }> {
      return AuthService.getUser(); 
  }

  /**
   * Listens for changes in the authentication state via AuthService.
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return AuthService.onAuthStateChange(callback);
  }

  /**
   * Signs the user in using Apple OAuth via AuthService.
   * The handle_new_user trigger handles profile creation in the DB.
   */
  static async signInWithApple(): Promise<{ error: Error | null }> {
    const { error } = await AuthService.signInWithApple();
    // Profile row is created by the DB trigger `on_auth_user_created`
    return { error };
  }

  /**
   * Signs the user in anonymously via AuthService.
   * The handle_new_user trigger handles profile creation in the DB.
   */
  static async signInAnonymously(): Promise<{ error: Error | null }> {
    console.log('[AccountService] Attempting Anonymous Sign-In via AuthService...');
    const { error } = await AuthService.signInAnonymously();
    // Profile row is created by the DB trigger `on_auth_user_created`
    if (error) {
      console.error('[AccountService] Anonymous Sign-In failed:', error.message);
    }
    return { error };
  }

  /**
   * Signs the current user out via AuthService.
   */
  static async signOut(): Promise<{ error: Error | null }> {
    return AuthService.signOut();
  }

  /**
   * Fetches the user's raw profile data from the 'users' table.
   * @param userId The ID of the user whose profile to fetch.
   * @returns Raw data matching DbUserProfileData or null.
   */
  static async getProfile(userId: string): Promise<{ data: DbUserProfileData | null, error: Error | null }> {
    if (!userId) return { data: null, error: new Error("User ID is required to fetch profile.") };
    console.log(`[AccountService] Fetching profile for user ${userId} from users table...`);
    try {
      const { data, error } = await AuthService.client
        .from('users')
        .select(`
          id,
          name,
          level,
          title_id,
          completed_quests_count
        `)
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Allow PGRST116 (Not Found)
        console.error(`[AccountService] Error fetching profile for ${userId}:`, error);
        throw new Error(error.message);
      }

      if (!data) {
        console.warn(`[AccountService] Profile row not found for user ${userId}.`);
        return { data: null, error: null };
      }

      console.log(`[AccountService] Raw profile data fetched successfully for ${userId}.`);
      // Return the raw data including title_id
      return { data: data as DbUserProfileData, error: null };

    } catch (err: any) {
      console.error('[AccountService] Unexpected error in getProfile:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred fetching profile.';
      return { data: null, error: new Error(message) };
    }
  }

  /**
   * Updates the user's profile data in the 'users' table.
   * Also updates user_metadata in auth.users if name is changed.
   * @param userId The ID of the user whose profile to update.
   * @param profileData Data to update (e.g., { name: 'New Name', title_id: 't1', completed_quests_count: 10 }).
   * @returns The updated raw DbUserProfileData or null.
   */
  static async updateProfile(
      userId: string,
      profileData: UserProfileUpdateData
  ): Promise<{ data: DbUserProfileData | null, error: Error | null }> { // Return DbUserProfileData
    if (!userId) return { data: null, error: new Error("User ID is required to update profile.") };
    console.log(`[AccountService] Updating profile for user ${userId} in users table with:`, profileData);

    // Prepare data for the 'users' table update
    const updateData: { [key: string]: any } = { ...profileData };
    // updated_at is handled by the DB trigger

    try {
      // 1. Update the 'users' table
      const { data: updatedUserData, error: updateError } = await AuthService.client
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select(`
            id,
            name,
            level,
            title_id,
            completed_quests_count
        `)
        .single();

      if (updateError) {
        console.error(`[AccountService] Error updating users table for ${userId}:`, updateError);
        throw new Error(updateError.message);
      }
      if (!updatedUserData) {
         throw new Error("User profile not found after update attempt.");
      }

      // 2. If name was updated, also update auth.users.user_metadata
      if (profileData.name !== undefined) {
        const { error: metaError } = await AuthService.updateUserMetadata({ name: profileData.name });
        if (metaError) {
          console.warn(`[AccountService] Failed to update auth.users metadata for name on user ${userId}:`, metaError.message);
        }
      }

      console.log(`[AccountService] Profile updated successfully for ${userId}.`);
      // Return the updated raw data
      return { data: updatedUserData as DbUserProfileData, error: null };

    } catch (err: any) {
      console.error(`[AccountService] Unexpected error in updateProfile for ${userId}:`, err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred during profile update.';
      return { data: null, error: new Error(message) };
    }
  }

  // Add methods for other providers (Google, etc.) if needed
}

export default AccountService; 