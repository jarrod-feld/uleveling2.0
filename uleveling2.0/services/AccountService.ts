// import AuthService from './AuthService'; // <-- Commented out
import { Session, User } from '@supabase/supabase-js';

interface UserProfileData {
  name?: string;
  // Add other potential profile fields
}

/**
 * AccountService
 * Handles user session management, profile data, and auth interactions.
 * NOTE: AuthService dependency is currently commented out for testing.
 */
class AccountService {

  /**
   * Gets the current user session. (Currently returns null)
   */
  static async getSession(): Promise<{ session: Session | null, error: Error | null }> {
    console.warn('[AccountService] getSession: Returning null (AuthService disabled).');
    // return AuthService.getSession();
    return { session: null, error: null }; 
  }

  /**
   * Gets the current authenticated user by calling AuthService. (Currently returns null)
   */
  static async getUser(): Promise<{ user: User | null, error: Error | null }> {
      console.warn('[AccountService] getUser: Returning null (AuthService disabled).');
      // return AuthService.getUser(); 
      return { user: null, error: null };
  }

  /**
   * Listens for changes in the authentication state. (Currently does nothing)
   * @param callback - Function to call when auth state changes.
   * @returns Subscription object.
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    console.warn('[AccountService] onAuthStateChange: Doing nothing (AuthService disabled).');
    // return AuthService.onAuthStateChange(callback);
    // Return a dummy subscription object
    return { data: { subscription: { unsubscribe: () => {} } } }; 
  }

  /**
   * Signs the user in using Apple OAuth. (Currently returns error)
   */
  static async signInWithApple(): Promise<{ error: Error | null }> {
    console.warn('[AccountService] signInWithApple: Returning error (AuthService disabled).');
    // return AuthService.signInWithApple();
    return { error: new Error('AuthService is currently disabled.') };
  }

  /**
   * Signs the current user out. (Currently returns success)
   */
  static async signOut(): Promise<{ error: Error | null }> {
    console.warn('[AccountService] signOut: Returning success (AuthService disabled).');
    // return AuthService.signOut();
    return { error: null }; 
  }

  /**
   * Updates the current user's metadata by calling AuthService. (Currently returns error)
   * @param profileData - Data to update in user_metadata.
   */
  static async updateProfile(profileData: UserProfileData): Promise<{ user: User | null, error: Error | null }> {
    console.warn('[AccountService] updateProfile: Returning error (AuthService disabled).', profileData);
    // try {
    //   const { user, error } = await AuthService.updateUserMetadata(profileData);
    //   if (error) return { user: null, error };
    //   return { user, error: null };
    // } catch (err: any) { ... }
    return { user: null, error: new Error('AuthService is currently disabled.') };
  }

  // Add methods for other providers (Google, etc.) if needed
}

export default AccountService; 