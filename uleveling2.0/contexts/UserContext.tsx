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
import OnboardingService from '@/services/OnboardingService';

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
        const onboardingPreviouslyCompleted = await OnboardingService.isCompleted();

        if (onboardingPreviouslyCompleted) {
          const userCreationTime = sessionUser?.created_at ? new Date(sessionUser.created_at).getTime() : 0;
          const now = new Date().getTime();
          const tenSeconds = 10 * 1000;

          if (sessionUser && userCreationTime > (now - tenSeconds)) {
            console.warn(`[UserContext] Profile for user ${userId} not found, but user was created recently (and onboarding was complete). Retrying profile fetch shortly...`);
            let retries = 2;
            let tempRawProfileData = null;
            let tempProfileError = null;
            for (let i = 0; i < retries; i++) {
              await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1)));
              if (!isMounted) return;
              const retryResult = await AccountService.getProfile(userId);
              tempRawProfileData = retryResult.data;
              tempProfileError = retryResult.error;
              if (tempRawProfileData) break;
              if (tempProfileError && tempProfileError.message.includes('PGRST116')) continue; 
              if (tempProfileError) break; 
            }

            if (tempProfileError && !tempRawProfileData) {
               console.error('[UserContext] Error fetching profile even after retries (onboarding complete):', tempProfileError.message);
               console.warn('[UserContext] Profile fetch failed after retries (onboarding complete), initiating sign out.');
               await handleSignOut();
               return;
            }
            if (!tempRawProfileData) {
              console.warn(`[UserContext] Profile for user ${userId} still not found after retries (onboarding complete). Signing out.`);
              await handleSignOut();
              return;
            }
            (rawProfileData as any) = tempRawProfileData; 
          } else {
            console.warn(`[UserContext] Profile for user ${userId} not found (user not recent or already existed, and onboarding was complete). Signing out.`);
            await handleSignOut();
            return;
          }
        } else {
          console.warn(`[UserContext] Profile for user ${userId} not found, but onboarding is not yet complete. Proceeding with null profile for now. Onboarding flow should handle profile creation.`);
        }
      }
      if (!rawProfileData) {
        setProfile(null);
        setStats(null);
        const questsCount = 0; 
        const [achStatusResult, unlockedTitlesResult] = await Promise.all([
            AchievementService.getAllAchievementsStatus(userId, null, null, questsCount),
            TitleService.getUnlockedTitles(userId)
        ]);
        if (isMounted) {
            if (achStatusResult.error) console.error('[UserContext] Error fetching achievement status (profile null):', achStatusResult.error.message);
            if (unlockedTitlesResult.error) console.error('[UserContext] Error fetching unlocked titles (profile null):', unlockedTitlesResult.error.message);
            setAchievementsStatus(achStatusResult.data ?? []);
            setAvailableTitles(unlockedTitlesResult.data ?? []);
            setIsProfileLoading(false);
            setIsAchievementLoading(false);
        }
        return () => { isMounted = false; }; 
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
    let isMounted = true;
    let unsubscribeAuth: (() => void) | undefined;

    async function initialLoad() {
      const { session: initialSession, error: sessionError } = await AccountService.getSession();
      if (!isMounted) return;
      if (sessionError) console.error('[UserContext] Error checking session on initial load:', sessionError.message);

      const initialUser = initialSession?.user ?? null;

      setSession(initialSession);
      setUser(initialUser);

      if (initialUser) {
        const cleanupFetch = await fetchAllUserData(initialUser.id, initialUser);
        try {
          const dismissedStatus = await UserService.isWarningDismissedToday(initialUser.id);
          if (isMounted) setIsWarningDismissedToday(dismissedStatus);
        } catch (err) {
          console.error('[UserContext] Failed to check warning dismissal status:', err);
          if (isMounted) setIsWarningDismissedToday(false);
        }
        return cleanupFetch;
      } else {
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
      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        await fetchAllUserData(currentUser.id, currentUser);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setStats(null);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        setIsWarningDismissedToday(false);
      } else if (event === 'USER_UPDATED' && currentUser) {
        await fetchAllUserData(currentUser.id, currentUser);
      } else if (event === 'INITIAL_SESSION' && !currentUser) {
        setProfile(null);
        setStats(null);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsAchievementLoading(false);
        setIsWarningDismissedToday(false);
      } 
    });
    unsubscribeAuth = subscription?.unsubscribe;

    return () => {
      isMounted = false;
      if (unsubscribeAuth) {
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
    if (!user?.id) { 
        const err = new Error("User not available for profile update.");
        console.error(`[UserContext] ${err.message}`);
        return { error: err };
    }
    const userId = user.id;
    let updateError: Error | null = null;

    try {
      const { data: updatedDbProfile, error: serviceError } = await AccountService.updateProfile(userId, profileData);
      if (serviceError) throw serviceError;
      if (!updatedDbProfile) throw new Error('Profile update failed to return data.');
      
      setProfile(prevProfile => {
        if (!prevProfile) return null; 

        const newCoreProfile: UserProfile = {
          ...prevProfile,
          name: updatedDbProfile.name ?? prevProfile.name,
          level: updatedDbProfile.level ?? prevProfile.level,
          completed_quests_count: updatedDbProfile.completed_quests_count ?? prevProfile.completed_quests_count,
          title: profileData.title_id !== undefined 
                 ? (profileData.title_id === null ? null : prevProfile.title?.id === profileData.title_id ? prevProfile.title : availableTitles.find(t => t.id === profileData.title_id) || null) 
                 : prevProfile.title,
        };
        return newCoreProfile;
      });

    } catch (err) {
        console.error('[UserContext] Error updating user profile:', getErrorMessage(err));
        updateError = new Error(getErrorMessage(err));
    }
    return { error: updateError };
  }, [user, availableTitles]); 

  // --- Update Title ---
  const handleUpdateTitle = useCallback(async (titleId: string | null) => {
    return handleUpdateUserProfile({ title_id: titleId });
  }, [handleUpdateUserProfile]);

  // --- Increment Stat Bonus ---
  const handleIncrementStatBonus = useCallback(async (statLabel: string, amount: number): Promise<{ error: Error | null }> => {
    if (!user?.id) return { error: new Error("User not available") };
    const userId = user.id;
    let incrementError: Error | null = null;
    try {
      const { data: freshStatsFromService, error: serviceError } = await StatService.incrementStatBonus(userId, statLabel, amount);
      
      if (serviceError) {
        throw serviceError;
      }

      if (freshStatsFromService) {
        setStats(freshStatsFromService);
        await StatService.updateCachedStats(userId, freshStatsFromService);
        addStatNotification(statLabel, amount); 
      } else {
        console.warn("[UserContext] incrementStatBonus service call did not return fresh stats data, local/cache update skipped.");
      }

    } catch (err) {
      console.error(`[UserContext] Error incrementing ${statLabel} bonus:`, getErrorMessage(err));
      incrementError = new Error(getErrorMessage(err));
    }
    return { error: incrementError };
  }, [user, addStatNotification]); 

  // --- Increment Discipline Bonus ---
  const handleIncrementDisciplineBonus = useCallback(async (amount: number): Promise<{ error: Error | null }> => {
    if (!user?.id) return { error: new Error("User not available") };
    const userId = user.id;
    let incrementError: Error | null = null;
     try {
      const { data: freshStatsFromService, error: serviceError } = await StatService.incrementDisciplineBonus(userId, amount);

      if (serviceError) {
        throw serviceError;
      }

      if (freshStatsFromService) {
        setStats(freshStatsFromService);
        await StatService.updateCachedStats(userId, freshStatsFromService);
        addStatNotification('DIS', amount); 
      } else {
        console.warn("[UserContext] incrementDisciplineBonus service call did not return fresh stats data, local/cache update skipped.");
      }

    } catch (err) {
      console.error(`[UserContext] Error incrementing Discipline bonus:`, getErrorMessage(err));
      incrementError = new Error(getErrorMessage(err));
    }
    return { error: incrementError };
  }, [user, addStatNotification]); 

  // --- Claim Achievement ---
  const handleClaimAchievement = useCallback(async (achievementId: string): Promise<{ error: Error | null }> => {
    if (!user?.id || !profile || !stats) return { error: new Error("User, profile, or stats not available") };
    const userId = user.id;
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

      await fetchAllUserData(userId, user);

      const claimedAchievementDef = getAchievementDefinition(achievementId);
      const titleReward = claimedAchievementDef?.rewards.find(r => r.type === 'title') as TitleReward | undefined;
      if (titleReward) {
          setNewTitlePopupState({ visible: true, titleName: titleReward.titleId });
      }

    } catch (err) {
      console.error(`[UserContext] Error claiming achievement:`, getErrorMessage(err));
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
        console.error('[UserContext] Failed to dismiss warning:', getErrorMessage(err));
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
