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

export function UserProvider({ children }: UserProviderProps) {
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

  // Define handleSignOut here, before fetchAllUserData uses it in its definition scope
  const handleSignOut = useCallback(async () => {
    console.log('[UserContext] Initiating sign out...');
    setIsLoading(true);
    const { error } = await AccountService.signOut();
    if (error) {
      console.error('[UserContext] Sign Out failed:', error.message);
      setIsLoading(false);
    }
    // Auth state change listener will handle clearing state
    return { error };
  }, []);

  // --- Fetch All User Data ---
  const fetchAllUserData = useCallback(async (userId: string) => {
    let isMounted = true;
    console.log(`[UserContext] Fetching all user data for: ${userId}`);
    setIsLoading(true);
    setIsProfileLoading(true);
    setIsAchievementLoading(true);

    try {
      const { data: rawProfileData, error: profileError } = await AccountService.getProfile(userId);
      if (!isMounted) return;
      if (profileError) {
        console.error('[UserContext] Error fetching profile:', profileError.message);
        console.warn('[UserContext] Profile fetch failed, initiating sign out.');
        await handleSignOut();
        return;
      }
      if (!rawProfileData) {
        console.warn(`[UserContext] Profile for user ${userId} not found. Initiating sign out.`);
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
        name: rawProfileData.name ?? user?.user_metadata?.name ?? 'Adventurer',
        level: rawProfileData.level,
        title: currentTitle,
        completed_quests_count: rawProfileData.completed_quests_count,
      };

      const questsCount = combinedProfile.completed_quests_count ?? 0;
          const [achStatusResult, unlockedTitlesResult] = await Promise.all([
        AchievementService.getAllAchievementsStatus(userId, combinedProfile, fetchedStatsData, questsCount),
        TitleService.getUnlockedTitles(userId)
          ]);

          if (isMounted) {
        if (achStatusResult.error) console.error('[UserContext] Error fetching achievement status:', achStatusResult.error.message);
        if (unlockedTitlesResult.error) console.error('[UserContext] Error fetching unlocked titles:', unlockedTitlesResult.error.message);

        setProfile(combinedProfile);
        setStats(fetchedStatsData);
            setAchievementsStatus(achStatusResult.data ?? []);
            setAvailableTitles(unlockedTitlesResult.data ?? []);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
      }

    } catch (err: unknown) {
      console.error('[UserContext] Error during comprehensive user data fetch:', err);
      if (isMounted) {
          setProfile(null);
          setStats(null);
          setAchievementsStatus([]);
          setAvailableTitles([]);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        // Optionally sign out if critical fetch fails
        // await handleSignOut();
      }
    } finally {
        if (isMounted) {
         setIsLoading(false);
      }
    }

    return () => { isMounted = false; };

  }, [user?.user_metadata?.name, handleSignOut]);

  // --- Auth State Change Listener ---
  useEffect(() => {
    let isMounted = true;
    async function initialLoad() {
      const { session: initialSession, error: sessionError } = await AccountService.getSession();
      if (!isMounted) return;
      if (sessionError) console.error('[UserContext] Error checking session:', sessionError.message);

      setSession(initialSession);
      const initialUser = initialSession?.user ?? null;
      setUser(initialUser);

      if (initialUser) {
        console.log(`[UserContext] Initial load for user: ${initialUser.id}`);
        const cleanupFetch = await fetchAllUserData(initialUser.id);

        // Check warning status only if user exists and component is mounted
        try {
          const dismissedStatus = await UserService.isWarningDismissedToday(initialUser.id);
          if (isMounted) setIsWarningDismissedToday(dismissedStatus);
        } catch (err) {
          console.error('[UserContext] Failed to check warning dismissal status:', err);
          if (isMounted) setIsWarningDismissedToday(false);
        }
        return cleanupFetch; // Return cleanup from fetchAllUserData

      } else {
        console.log('[UserContext] No initial user session found. Clearing state.');
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
      console.log(`[UserContext] Auth Event: ${event}, User: ${currentSession?.user?.id ?? 'null'}`);
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        console.log(`[UserContext] Triggering user data load on SIGNED_IN for ${currentUser.id}...`);
        await fetchAllUserData(currentUser.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('[UserContext] Clearing user data on SIGNED_OUT...');
        setProfile(null);
        setStats(null);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        setIsWarningDismissedToday(false);
      } else if (event === 'USER_UPDATED' && currentUser && profile) {
          // USER_UPDATED might mean metadata changes (e.g., name) or DB changes
          // Fetching all data ensures consistency
          console.log(`[UserContext] USER_UPDATED event for ${currentUser.id}. Refetching all user data...`);
          await fetchAllUserData(currentUser.id);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      initialLoadCleanupPromise.then(cleanup => { if (typeof cleanup === 'function') cleanup(); });
    };
  }, [fetchAllUserData]); // fetchAllUserData depends on handleSignOut, which is stable

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
    if (!profile?.id || !user?.id) {
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

      // Profile updated successfully in DB, refetch all user data to ensure context consistency
      // This simplifies state management as fetchAllUserData handles combining profile, titles, stats, achievements
      console.log('[UserContext] Profile updated in DB, refetching all user data...');
      await fetchAllUserData(userId);

    } catch (err) {
        console.error('[UserContext] Error updating user profile:', err);
        updateError = new Error(getErrorMessage(err));
    } finally {
        setIsProfileLoading(false);
    }
    return { error: updateError };
  }, [user?.id, fetchAllUserData]); // Depend on fetchAllUserData

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

      // Stat updated successfully in DB (cache invalidated by service), refetch all data
      console.log(`[UserContext] Stat ${statLabel} bonus updated, refetching all user data...`);
      await fetchAllUserData(userId);

    } catch (err) {
      console.error(`[UserContext] Error incrementing ${statLabel} bonus:`, err);
      incrementError = new Error(getErrorMessage(err));
    }
    return { error: incrementError };
  }, [user?.id, fetchAllUserData]); // Depend on fetchAllUserData

  // --- Increment Discipline Bonus ---
  const handleIncrementDisciplineBonus = useCallback(async (amount: number): Promise<{ error: Error | null }> => {
    if (!user?.id) return { error: new Error("User not available") };
    const userId = user.id;
    console.log(`[UserContext] Incrementing Discipline bonus by ${amount}`);
    let incrementError: Error | null = null;
     try {
      const result = await StatService.incrementDisciplineBonus(userId, amount);
      if (result.error) throw result.error;

      // Discipline updated successfully in DB (cache invalidated by service), refetch all data
      console.log(`[UserContext] Discipline bonus updated, refetching all user data...`);
      await fetchAllUserData(userId);

    } catch (err) {
      console.error(`[UserContext] Error incrementing Discipline bonus:`, err);
      incrementError = new Error(getErrorMessage(err));
    }
    return { error: incrementError };
  }, [user?.id, fetchAllUserData]); // Depend on fetchAllUserData

  // --- Claim Achievement ---
  const handleClaimAchievement = useCallback(async (achievementId: string): Promise<{ error: Error | null }> => {
    if (!user?.id || !profile || !stats) return { error: new Error("User, profile, or stats not available") };
    const userId = user.id;
    console.log(`[UserContext] Claiming achievement: ${achievementId}`);
    setIsAchievementLoading(true);
    let claimError: Error | null = null;

    try {
      // Call service with all required arguments
      const result = await AchievementService.claimAchievementReward(
          userId,
      achievementId,
      profile,
      stats,
          profile.completed_quests_count // Pass the current count
      );

      if (result.error) throw result.error;
      if (!result.data) throw new Error('Claim achievement reward returned no data.'); // Should have UserAchievementStatus

      // Rewards granted (e.g., title) & achievement marked claimed in DB
      // Refetch ALL user data to reflect potential profile changes (new title), updated achievement status list, etc.
      console.log(`[UserContext] Achievement ${achievementId} claimed, refetching all user data...`);
      await fetchAllUserData(userId);

      // Optionally show popup based on the *refetched* data or keep simple logic
      const claimedAchievementDef = getAchievementDefinition(achievementId);
      const titleReward = claimedAchievementDef?.rewards.find(r => r.type === 'title') as TitleReward | undefined;
      if (titleReward) {
          // Fetch the title details IF needed for the popup message, otherwise just show generic success
          // For simplicity, let's assume the title name isn't needed for the popup here
          // Or find the title from the *newly fetched* availableTitles state after fetchAllUserData finishes
          setNewTitlePopupState({ visible: true, titleName: titleReward.titleId }); // Using ID for now
      }

    } catch (err) {
      console.error(`[UserContext] Error claiming achievement:`, err);
      claimError = new Error(getErrorMessage(err));
    } finally {
      setIsAchievementLoading(false);
    }
    return { error: claimError };
  }, [user?.id, profile, stats, fetchAllUserData]); // Depend on fetchAllUserData

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

  // --- Context Value Memo ---
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
