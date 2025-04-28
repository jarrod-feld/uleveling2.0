import { createClient, Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';

// Retrieve Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that the environment variables are set
if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Did you set EXPO_PUBLIC_SUPABASE_URL in your .env file?");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key not found. Did you set EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file?");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for persistence on React Native
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});

class AuthService {
  // Initialize Supabase client (consider moving initialization to app root)
  static get client() {
    return supabase;
  }

  static async signInWithApple(): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    console.log('[AuthService] Attempting Expo Apple Sign-In...');
    try {
        // 1. Use Expo to get Apple credentials
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
        });

        console.log('[AuthService] Expo Apple Sign-In successful, got credential.');

        // 2. Check if we received the identity token
        if (credential.identityToken) {
            console.log('[AuthService] Identity Token received, signing into Supabase...');
            // 3. Sign in to Supabase using the identity token
            const { data: { user, session }, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
            });

            if (error) {
                console.error('[AuthService] Supabase Sign-In with Apple ID Token Error:', error.message);
                return { user: null, session: null, error };
            }

            console.log('[AuthService] Supabase Sign-In with Apple ID Token successful.');
            // Return the user and session obtained from Supabase
            return { user, session, error: null };

        } else {
            console.error('[AuthService] No identity token received from Apple.');
            // Handle the case where the identity token is missing
            return { user: null, session: null, error: new Error('Apple Sign-In failed: No identity token received.') };
        }

    } catch (error: any) {
        if (error.code === 'ERR_REQUEST_CANCELED') {
            console.log('[AuthService] Apple Sign-In cancelled by user.');
            // Optionally return a specific error or null/null
            return { user: null, session: null, error: new Error('Sign-in cancelled.') };
        }
        console.error('[AuthService] Unexpected Apple Sign-In Error:', error);
        return { user: null, session: null, error: error instanceof Error ? error : new Error('An unexpected Apple Sign-In error occurred') };
    }
  }

  static async signInAnonymously(): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    console.log('[AuthService] Attempting Supabase Anonymous Sign-In...');
    try {
      const { data: { user, session }, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('[AuthService] Supabase Anonymous Sign-In Error:', error.message);
        return { user: null, session: null, error };
      }

      console.log('[AuthService] Supabase Anonymous Sign-In successful.');
      return { user, session, error: null };

    } catch (error: any) {
      console.error('[AuthService] Unexpected Anonymous Sign-In Error:', error);
      return { user: null, session: null, error: error instanceof Error ? error : new Error('An unexpected Anonymous Sign-In error occurred') };
    }
  }

  static async signOut(): Promise<{ error: Error | null }> {
    console.log('[AuthService] Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthService] Sign Out Error:', error.message);
    }
    return { error };
  }

  static async getSession(): Promise<{ session: Session | null; error: Error | null }> {
      const { data, error } = await supabase.auth.getSession();
      // Convert Supabase error to standard Error
      return { session: data.session, error: error ? new Error(error.message) : null };
  }

  static async getUser(): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.getUser();
    // Convert Supabase error to standard Error
    return { user: data.user, error: error ? new Error(error.message) : null };
  }

  static onAuthStateChange(callback: (event: string, session: Session | null) => void): {
    data: { subscription: { unsubscribe: () => void } };
  } {
    return supabase.auth.onAuthStateChange(callback);
  }

  static async updateUserMetadata(metadata: { [key: string]: any }): Promise<{ user: User | null, error: Error | null }> {
    const { data, error } = await supabase.auth.updateUser({ data: metadata });
     // Convert Supabase error to standard Error
    return { user: data.user, error: error ? new Error(error.message) : null };
  }
}

export default AuthService; 