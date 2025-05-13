import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import AccountService from '@/services/AccountService';
import { Session, User } from '@supabase/supabase-js';
import { Quest } from '@/mock/dashboardData';
import { StatCategory } from '@/types/quest';
import QuestService from '@/services/QuestService';
import { Goal } from '@/mock/roadmapData';
import RoadmapService from '@/services/RoadmapService';
import { Stat } from '@/mock/statsData';
import StatService, { UserStats } from '@/services/StatService';
import TitleService, { UserTitle } from '@/services/TitleService';
import AchievementService, { UserAchievementStatus } from '@/services/AchievementService';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { getAchievementDefinition, TitleReward } from '@/data/achievementsData';
import UserService from '@/services/UserService';

// Define stat increment amount centrally if needed, or use the one in StatService
const DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE = 1;

// Remove OnboardingData import if only name is needed for profile update
// import { OnboardingData } from '@/app/onboarding'; 

// Type for raw profile data fetched from AccountService
interface RawUserProfileData {
  id: string;
  name: string | null;
  level: number;
  title_id: string | null; // We might still use this to know *if* a title is set, but fetch the current one
  completed_quests_count: number;
}

// UserProfile now reflects the structure fetched from DB + the title object
export interface UserProfile {
  id: string;
  name: string;
  level: number;
  title: UserTitle | null; // This is fetched separately and combined
  completed_quests_count: number; // Name matches DB column
}

// Matches updatable fields in AccountService.updateProfile
interface UserProfileUpdateData {
  name?: string;
  title_id?: string | null;
  completed_quests_count?: number; // Add completed_quests_count
  level?: number;
}

// Add state type for the title popup
interface NewTitlePopupState {
  visible: boolean;
  titleName: string | null;
}

interface UserContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  stats: UserStats | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isAchievementLoading: boolean;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateUserProfile: (profileData: UserProfileUpdateData) => Promise<{ error: Error | null }>;
  updateTitle: (titleId: string | null) => Promise<{ error: Error | null }>;
  achievementsStatus: UserAchievementStatus[];
  claimAchievement: (achievementId: string) => Promise<{ error: Error | null }>;
  availableTitles: UserTitle[];
  newTitlePopupState: NewTitlePopupState;
  closeNewTitlePopup: () => void;
  isWarningDismissedToday: boolean;
  dismissWarning: () => void;
  handleIncrementStatBonus: (statLabel: string, amount: number) => Promise<{ error: Error | null }>;
  handleIncrementDisciplineBonus: (amount: number) => Promise<{ error: Error | null }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  isAppReady?: boolean;
}

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return String(error);
}

export function UserProvider({ children, isAppReady }: UserProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [achievementsStatus, setAchievementsStatus] = useState<UserAchievementStatus[]>([]);
  const [availableTitles, setAvailableTitles] = useState<UserTitle[]>([]);
  const [isAchievementLoading, setIsAchievementLoading] = useState<boolean>(true);
  const [newTitlePopupState, setNewTitlePopupState] = useState<NewTitlePopupState>({ visible: false, titleName: null });
  const [isWarningDismissedToday, setIsWarningDismissedToday] = useState<boolean>(false);

  const { addStatNotification, addQuestNotification, addAchievementNotification } = useNotificationContext();

  const handleSignOut = useCallback(async () => {
    console.log('[UserContext] Initiating sign out...');
    setIsLoading(true);
    const { error } = await AccountService.signOut();
    if (error) {
      console.error('[UserContext] Sign Out failed:', error.message);
      setIsLoading(false);
    }
    return { error };
  }, []);

  // --- Fetch All User Data ---
  const fetchAllUserData = useCallback(async (userId: string, sessionUser: User | null) => {
    let isMounted = true;
    console.log(`[UserContext] Fetching all user data for: ${userId}, sessionUser ID: ${sessionUser?.id}`);
    setIsLoading(true);
    setIsProfileLoading(true);
    setIsAchievementLoading(true);

    try {
      const { data: rawProfileData, error: profileError } = await AccountService.getProfile(userId);
      console.log(`[UserContext] fetchAllUserData: AccountService.getProfile for ${userId} returned - rawProfileData:`, rawProfileData, "Error:", profileError);

      if (!isMounted) return;
      if (profileError) {
        console.error('[UserContext] Error fetching profile:', profileError.message);
        console.warn('[UserContext] Profile fetch failed, initiating sign out.');
        await handleSignOut();
        return;
      }
      if (!rawProfileData) {
        const userCreationTime = sessionUser?.created_at ? new Date(sessionUser.created_at).getTime() : 0;
        const now = new Date().getTime();
        const tenSeconds = 10 * 1000;

        if (sessionUser && userCreationTime > (now - tenSeconds)) {
          console.warn(`[UserContext] Profile for user ${userId} not found, but user was created recently. Retrying profile fetch shortly...`);
          let retries = 2;
          let tempRawProfileData = null;
          let tempProfileError = null;
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1)));
            if (!isMounted) return;
            console.log(`[UserContext] Retrying AccountService.getProfile for ${userId} (Attempt ${i + 1})`);
            const retryResult = await AccountService.getProfile(userId);
            tempRawProfileData = retryResult.data;
            tempProfileError = retryResult.error;
            console.log(`[UserContext] Retry ${i + 1} result - rawProfileData:`, tempRawProfileData, "Error:", tempProfileError);
            if (tempRawProfileData) break;
            if (tempProfileError) break;
          }

          if (tempProfileError) {
             console.error('[UserContext] Error fetching profile even after retries:', tempProfileError.message);
             console.warn('[UserContext] Profile fetch failed after retries, initiating sign out.');
             await handleSignOut();
             return;
          }
          if (!tempRawProfileData) {
            console.warn(`[UserContext] Profile for user ${userId} still not found after retries. Signing out.`);
            await handleSignOut();
            return;
          }
          (rawProfileData as any) = tempRawProfileData; 
        } else {
          console.warn(`[UserContext] Profile for user ${userId} not found (user not recent or already existed). Signing out.`);
          await handleSignOut();
          return;
        }
      }
      if (!rawProfileData) {
        console.error('[UserContext] CRITICAL: rawProfileData is null even after potential retries. Cannot proceed.');
        await handleSignOut();
        return;
      }

      const [titleResult, statsResult] = await Promise.all([
        TitleService.getCurrentTitle(userId),
        StatService.getStats(userId)
      ]);

      if (!isMounted) return;

      if (titleResult.error) {
        console.error('[UserContext] Error fetching current title:', titleResult.error.message);
      }
      if (statsResult.error) {
        console.error('[UserContext] Error fetching stats:', statsResult.error.message);
        throw statsResult.error;
      }

      const currentTitle: UserTitle | null = titleResult.data ?? null;
      const fetchedStatsData: UserStats | null = statsResult.data ?? null;

      if (!fetchedStatsData) {
        console.error('[UserContext] Stats data is null after fetch. Cannot proceed.');
        throw new Error('Failed to fetch user stats.');
      }

      const combinedProfile: UserProfile = {
        id: rawProfileData.id,
        name: rawProfileData.name ?? sessionUser?.user_metadata?.name ?? 'Adventurer',
        level: rawProfileData.level,
        title: currentTitle,
        completed_quests_count: rawProfileData.completed_quests_count,
      };
      console.log('[UserContext] Combined profile constructed:', combinedProfile);


      const questsCount = combinedProfile.completed_quests_count ?? 0;
      const [achStatusResult, unlockedTitlesResult] = await Promise.all([
        AchievementService.getAllAchievementsStatus(userId, combinedProfile, fetchedStatsData, questsCount),
        TitleService.getUnlockedTitles(userId)
      ]);

      if (isMounted) {
        if (achStatusResult.error) console.error('[UserContext] Error fetching achievement status:', achStatusResult.error.message);
        if (unlockedTitlesResult.error) console.error('[UserContext] Error fetching unlocked titles:', unlockedTitlesResult.error.message);

        setProfile(combinedProfile);
        console.log('[UserContext] Profile state updated:', combinedProfile);
        setStats(fetchedStatsData);
        console.log('[UserContext] Stats state updated:', fetchedStatsData);
        setAchievementsStatus(achStatusResult.data ?? []);
        setAvailableTitles(unlockedTitlesResult.data ?? []);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        console.log('[UserContext] All user data fetched and states updated.');
      }

    } catch (err: unknown) {
      console.error('[UserContext] Error during comprehensive user data fetch:', getErrorMessage(err));
      if (isMounted) {
        setProfile(null);
        setStats(null);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => { isMounted = false; };

  }, [handleSignOut]);

  // --- Auth State Change Listener ---
  useEffect(() => {
    console.log('[UserContext] Setting up auth listener.');
    let isMounted = true;
    let unsubscribeAuth: (() => void) | undefined;

    async function initialLoad() {
      console.log('[UserContext] Attempting initial session load...');
      const { session: initialSession, error: sessionError } = await AccountService.getSession();
      if (!isMounted) return;
      if (sessionError) console.error('[UserContext] Error checking session on initial load:', sessionError.message);

      const initialUser = initialSession?.user ?? null;
      console.log(`[UserContext] initialLoad: Determined initialUser as:`, initialUser);

      setSession(initialSession);
      setUser(initialUser);
      console.log(`[UserContext] initialLoad: Called setSession and setUser. User ID in context state should now be: ${initialUser?.id ?? 'null'}`);

      if (initialUser) {
        console.log(`[UserContext] initialLoad: User ${initialUser.id} found. Fetching all user data...`);
        const cleanupFetch = await fetchAllUserData(initialUser.id, initialUser);
        console.log(`[UserContext] initialLoad: Completed fetchAllUserData for user ${initialUser.id}.`);
        try {
          const dismissedStatus = await UserService.isWarningDismissedToday(initialUser.id);
          if (isMounted) setIsWarningDismissedToday(dismissedStatus);
        } catch (err) {
          console.error('[UserContext] Failed to check warning dismissal status:', err);
          if (isMounted) setIsWarningDismissedToday(false);
        }
        return cleanupFetch;
      } else {
        console.log('[UserContext] initialLoad: No initial user session found. Clearing states.');
        setProfile(null);
        setStats(null);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        setIsWarningDismissedToday(false);
      }
    }

    const initialLoadCleanupPromise = initialLoad();

    const { data: { subscription } } = AccountService.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      console.log(`[UserContext] Auth Event Received: ${event}, Session User ID: ${currentSession?.user?.id ?? 'null'}`);
      const currentUser = currentSession?.user ?? null;
      console.log(`[UserContext] onAuthStateChange: currentUser object determined as:`, currentUser);
      setSession(currentSession);
      setUser(currentUser);
      console.log(`[UserContext] onAuthStateChange: Called setSession and setUser. User ID in context state should now be: ${currentUser?.id ?? 'null'}`);

      if (event === 'SIGNED_IN' && currentUser) {
        console.log(`[UserContext] SIGNED_IN event for user: ${currentUser.id}. Starting fetchAllUserData...`);
        await fetchAllUserData(currentUser.id, currentUser);
        console.log(`[UserContext] SIGNED_IN event for user: ${currentUser.id}. Completed fetchAllUserData.`);
      } else if (event === 'SIGNED_OUT') {
        console.log('[UserContext] SIGNED_OUT event. Clearing user-specific states.');
        setProfile(null);
        setStats(null);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        setIsWarningDismissedToday(false);
      } else if (event === 'USER_UPDATED' && currentUser) {
        console.log(`[UserContext] USER_UPDATED event for user: ${currentUser.id}. Starting fetchAllUserData...`);
        await fetchAllUserData(currentUser.id, currentUser);
        console.log(`[UserContext] USER_UPDATED event for user: ${currentUser.id}. Completed fetchAllUserData.`);
      } else if (event === 'INITIAL_SESSION' && !currentUser) {
        console.log('[UserContext] INITIAL_SESSION event via onAuthStateChange with no user. Clearing states if not already cleared.');
        setProfile(null);
        setStats(null);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        setIsWarningDismissedToday(false);
      } else if (currentUser) {
        console.log(`[UserContext] onAuthStateChange: Event ${event} for user ${currentUser.id} occurred. No specific data fetch triggered.`);
      }
    });
    unsubscribeAuth = subscription?.unsubscribe;

    return () => {
      isMounted = false;
      if (unsubscribeAuth) {
        console.log('[UserContext] Unsubscribing from onAuthStateChange.');
        unsubscribeAuth();
      }
      initialLoadCleanupPromise.then(cleanup => { if (typeof cleanup === 'function') cleanup(); });
    };
  }, [fetchAllUserData, handleSignOut]);

  // --- Apple Sign In ---
  const handleSignInWithApple = useCallback(async () => {
    setIsLoading(true);
    const { error } = await AccountService.signInWithApple();
    if (error) {
        console.error('[UserContext] Apple Sign-In failed:', error.message);
        setIsLoading(false);
    }
    // Auth state change listener will trigger fetchAllUserData
    return { error };
  }, []);

  // handleSignOut defined earlier

  // --- Update User Profile ---
  const handleUpdateUserProfile = useCallback(async (profileData: UserProfileUpdateData): Promise<{ error: Error | null }> => {
    if (!user?.id) { // Check user.id directly from state, as it should be up-to-date
        const err = new Error("User not available for profile update.");
        console.error(`[UserContext] ${err.message}`);
        return { error: err };
    }
    const userId = user.id;
    console.log('[UserContext] Updating profile with:', profileData);
    setIsProfileLoading(true);
    let updateError: Error | null = null;

    try {
      const { data: updatedDbProfile, error: serviceError } = await AccountService.updateProfile(userId, profileData);
      if (serviceError) throw serviceError;
      if (!updatedDbProfile) throw new Error('Profile update failed to return data.');
      
      console.log('[UserContext] Profile updated in DB, refetching all user data with current user object...');
      // Pass the current 'user' state object to fetchAllUserData
      await fetchAllUserData(userId, user);

    } catch (err) {
        console.error('[UserContext] Error updating user profile:', err);
        updateError = new Error(getErrorMessage(err));
    } finally {
        setIsProfileLoading(false);
    }
    return { error: updateError };
  // Ensure dependencies are correct, user object itself is a dependency
  }, [user, fetchAllUserData]);

  // --- Update Title ---
  const handleUpdateTitle = useCallback(async (titleId: string | null) => {
    console.log(`[UserContext] Updating title to: ${titleId}`);
    // Just call the profile update service directly
    return handleUpdateUserProfile({ title_id: titleId });
  }, [handleUpdateUserProfile]);

  // --- Increment Stat Bonus ---
  const handleIncrementStatBonus = useCallback(async (statLabel: string, amount: number): Promise<{ error: Error | null }> => {
    if (!user?.id) return { error: new Error("User not available") };
    const userId = user.id;
    console.log(`[UserContext] Incrementing ${statLabel} bonus by ${amount}`);
    let incrementError: Error | null = null;
    try {
      const result = await StatService.incrementStatBonus(userId, statLabel, amount);
      if (result.error) throw result.error;

      console.log(`[UserContext] Stat ${statLabel} bonus updated, refetching all user data with current user object...`);
      await fetchAllUserData(userId, user);

    } catch (err) {
      console.error(`[UserContext] Error incrementing ${statLabel} bonus:`, err);
      incrementError = new Error(getErrorMessage(err));
    }
    return { error: incrementError };
  }, [user, fetchAllUserData]);

  // --- Increment Discipline Bonus ---
  const handleIncrementDisciplineBonus = useCallback(async (amount: number): Promise<{ error: Error | null }> => {
    if (!user?.id) return { error: new Error("User not available") };
    const userId = user.id;
    console.log(`[UserContext] Incrementing Discipline bonus by ${amount}`);
    let incrementError: Error | null = null;
     try {
      const result = await StatService.incrementDisciplineBonus(userId, amount);
      if (result.error) throw result.error;

      console.log(`[UserContext] Discipline bonus updated, refetching all user data with current user object...`);
      await fetchAllUserData(userId, user);

    } catch (err) {
      console.error(`[UserContext] Error incrementing Discipline bonus:`, err);
      incrementError = new Error(getErrorMessage(err));
    }
    return { error: incrementError };
  }, [user, fetchAllUserData]);

  // --- Claim Achievement ---
  const handleClaimAchievement = useCallback(async (achievementId: string): Promise<{ error: Error | null }> => {
    if (!user?.id || !profile || !stats) return { error: new Error("User, profile, or stats not available") };
    const userId = user.id;
    console.log(`[UserContext] Claiming achievement: ${achievementId}`);
    setIsAchievementLoading(true);
    let claimError: Error | null = null;

    try {
      const result = await AchievementService.claimAchievementReward(
          userId,
      achievementId,
      profile,
      stats,
          profile.completed_quests_count
      );

      if (result.error) throw result.error;
      if (!result.data) throw new Error('Claim achievement reward returned no data.');

      console.log(`[UserContext] Achievement ${achievementId} claimed, refetching all user data with current user object...`);
      await fetchAllUserData(userId, user);

      const claimedAchievementDef = getAchievementDefinition(achievementId);
      const titleReward = claimedAchievementDef?.rewards.find(r => r.type === 'title') as TitleReward | undefined;
      if (titleReward) {
          setNewTitlePopupState({ visible: true, titleName: titleReward.titleId });
      }

    } catch (err) {
      console.error(`[UserContext] Error claiming achievement:`, err);
      claimError = new Error(getErrorMessage(err));
    } finally {
      setIsAchievementLoading(false);
    }
    return { error: claimError };
  }, [user, profile, stats, fetchAllUserData]);

  // --- Close New Title Popup ---
  const handleCloseNewTitlePopup = useCallback(() => {
      setNewTitlePopupState({ visible: false, titleName: null });
  }, []);

  // --- Dismiss Daily Warning ---
  const handleDismissWarning = useCallback(async () => {
      if (!user?.id) return;
      try {
        await UserService.dismissWarningForToday(user.id);
        setIsWarningDismissedToday(true);
      } catch (err) {
        console.error('[UserContext] Failed to dismiss warning:', err);
      }
  }, [user?.id]);

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    stats,
    isLoading: isLoading || isProfileLoading || isAchievementLoading,
    isProfileLoading,
    isAchievementLoading,
    signInWithApple: handleSignInWithApple,
    signOut: handleSignOut,
    updateUserProfile: handleUpdateUserProfile,
    updateTitle: handleUpdateTitle,
    achievementsStatus,
    claimAchievement: handleClaimAchievement,
    availableTitles,
    newTitlePopupState,
    closeNewTitlePopup: handleCloseNewTitlePopup,
    isWarningDismissedToday,
    dismissWarning: handleDismissWarning,
    handleIncrementStatBonus,
    handleIncrementDisciplineBonus,
  }), [
    session, user, profile, stats, isLoading, isProfileLoading, isAchievementLoading,
    achievementsStatus, availableTitles, newTitlePopupState, isWarningDismissedToday,
    handleSignInWithApple, handleSignOut, handleUpdateUserProfile, handleUpdateTitle,
    handleClaimAchievement, handleCloseNewTitlePopup, handleDismissWarning,
    handleIncrementStatBonus, handleIncrementDisciplineBonus
  ]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// --- Custom Hook ---
export function useAuth() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  return context;
}
