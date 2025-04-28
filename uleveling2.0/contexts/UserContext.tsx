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

// Define stat increment amount centrally if needed, or use the one in StatService
const DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE = 1;

// Remove OnboardingData import if only name is needed for profile update
// import { OnboardingData } from '@/app/onboarding'; 

// Added QuestWithGoalTitle interface
interface QuestWithGoalTitle extends Quest {
  goalTitle: string | null; // Goal title can be null if not found
  completedAt?: Date; // Add optional completedAt here too
}

// Add UserProfile type for clarity (can extend User if needed)
export interface UserProfile {
  id: string;
  name: string;
  level: number;
  title: UserTitle | null;
  completedQuestsCount: number;
}

interface UserProfileUpdateData {
  name?: string;
  // Add other fields as needed based on AccountService.updateProfile
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
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateUserProfile: (profileData: UserProfileUpdateData) => Promise<{ error: Error | null }>;
  updateTitle: (titleId: string) => Promise<{ error: Error | null }>;
  quests: QuestWithGoalTitle[];
  completeQuest: (id: string) => void;
  skipQuest: (id: string) => void;
  incrementQuestProgress: (id: string) => void;
  decrementQuestProgress: (id: string) => void;
  setQuestProgress: (id: string, count: number) => void;
  undoQuestStatus: (id: string) => void;
  achievementsStatus: UserAchievementStatus[];
  claimAchievement: (achievementId: string) => Promise<{ error: Error | null }>;
  availableTitles: UserTitle[];
  // Add state and closer for the title popup
  newTitlePopupState: NewTitlePopupState;
  closeNewTitlePopup: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

// Type guard to check for Error-like object with a message
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

export function UserProvider({ children }: UserProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quests, setQuests] = useState<QuestWithGoalTitle[]>([]);
  const [isQuestLoading, setIsQuestLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [originalQuestStates, setOriginalQuestStates] = useState<Record<string, QuestWithGoalTitle>>({});
  const [achievementsStatus, setAchievementsStatus] = useState<UserAchievementStatus[]>([]);
  const [availableTitles, setAvailableTitles] = useState<UserTitle[]>([]);
  const [isAchievementLoading, setIsAchievementLoading] = useState<boolean>(true);
  // Add state for the new title popup
  const [newTitlePopupState, setNewTitlePopupState] = useState<NewTitlePopupState>({ visible: false, titleName: null });

  const { addStatNotification, addQuestNotification, addAchievementNotification } = useNotificationContext();

  // --- Helper functions for quest counts (defined earlier) ---
  const incrementCompletedQuestCount = useCallback(() => {
      setProfile(currentProfile => {
          if (!currentProfile) return null;
          const newCount = (currentProfile.completedQuestsCount || 0) + 1;
          console.log(`[UserContext] Incrementing completed quest count to: ${newCount}`);
          return { ...currentProfile, completedQuestsCount: newCount };
      });
      // TODO: Persist this count via AccountService
  }, []);

  const decrementCompletedQuestCount = useCallback(() => {
      setProfile(currentProfile => {
          if (!currentProfile) return null;
          const newCount = Math.max(0, (currentProfile.completedQuestsCount || 0) - 1);
          console.log(`[UserContext] Decrementing completed quest count to: ${newCount}`);
          return { ...currentProfile, completedQuestsCount: newCount };
      });
       // TODO: Persist this count via AccountService
  }, []);

  // --- Load Initial Data Effect ---
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsQuestLoading(true);
    setIsProfileLoading(true);
    setIsAchievementLoading(true);

    async function loadInitialData() {
      let currentUserId: string | undefined;
      // Get Session
      try {
        const { session: initialSession, error: sessionError } = await AccountService.getSession();
        if (isMounted) {
          if (sessionError && 'message' in sessionError) console.error('[UserContext] Error checking session:', sessionError.message);
          setSession(initialSession);
          // --- Set Initial User --- 
          let initialUser = initialSession?.user;
          if (!initialUser) {
              console.warn('[UserContext] No initial user found, creating dummy user object for simulation.');
              initialUser = {
                  id: 'dummy-user-id', // Placeholder ID
                  aud: 'authenticated',
                  role: 'authenticated',
                  email: 'dummy@example.com',
                  email_confirmed_at: new Date().toISOString(),
                  phone: '',
                  confirmed_at: new Date().toISOString(),
                  last_sign_in_at: new Date().toISOString(),
                  app_metadata: { provider: 'dummy' },
                  user_metadata: { name: 'Username' }, // Default name from image
                  identities: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
              };
          }
          setUser(initialUser);
          currentUserId = initialUser.id; // Store user ID for subsequent fetches
          // ----------------------
        }
      } catch (err: unknown) {
        let errorMessage = "An unknown error occurred";
        if (isErrorWithMessage(err)) {
            errorMessage = err.message;
        }
        console.error('[UserContext] Unexpected error checking session:', errorMessage);
        if (isMounted) { setSession(null); setUser(null); }
      }

      if (currentUserId && isMounted) {
        let fetchedProfileData: UserProfile | null = null;
        let fetchedStatsData: UserStats | null = null;
        let initialCompletedQuestsCount = 0; // Use a temp variable

        // --- Fetch Profile, Stats, Current Title ---
        try {
          setIsProfileLoading(true);
          const [profileResult, statsResult, titleResult] = await Promise.all([
            // TODO: Replace Promise.resolve with actual AccountService.getProfile(currentUserId)
            Promise.resolve({ data: { id: currentUserId, name: user?.user_metadata?.name || 'Username', level: 99, completedQuestsCount: 0 /* TODO: Fetch real count */ }, error: null }),
            StatService.getStats(currentUserId),
            TitleService.getCurrentTitle(currentUserId),
          ]);

          if (isMounted) {
             if (profileResult.error && 'message' in (profileResult.error as any)) console.error('[UserContext] Error fetching profile:', (profileResult.error as any).message);
             if (statsResult.error && 'message' in (statsResult.error as any)) console.error('[UserContext] Error fetching stats:', (statsResult.error as any).message);
             if (titleResult.error && 'message' in (titleResult.error as any)) console.error('[UserContext] Error fetching title:', (titleResult.error as any).message);

             fetchedProfileData = {
                 id: currentUserId,
                 name: profileResult.data?.name ?? user?.user_metadata?.name ?? 'Username',
                 level: profileResult.data?.level ?? 99,
                 title: titleResult.data ?? { id: 't0', name: 'No Title' },
                 completedQuestsCount: profileResult.data?.completedQuestsCount ?? 0
             };
             fetchedStatsData = statsResult.data ?? null;
             initialCompletedQuestsCount = fetchedProfileData.completedQuestsCount; // Set temp variable

             setProfile(fetchedProfileData);
             setStats(fetchedStatsData);
          }
        } catch (err: unknown) {
          let errorMessage = "An unknown error occurred fetching profile/stats/title";
          if (isErrorWithMessage(err)) {
            errorMessage = err.message;
          }
          console.error('[UserContext] Unexpected error fetching profile/stats/title:', errorMessage);
          if (isMounted) { setProfile(null); setStats(null); }
        } finally {
          if (isMounted) setIsProfileLoading(false);
        }

        // --- Fetch Quests & Goals in Parallel ---
        try {
          const [questResult, goalResult] = await Promise.all([
            QuestService.getQuests(),
            RoadmapService.getGoals()
          ]);

          if (isMounted) {
             const fetchedQuests = questResult.data || [];
             const fetchedGoals = goalResult.data || [];

             if (questResult.error && 'message' in (questResult.error as any)) console.error('[UserContext] Error fetching quests:', (questResult.error as any).message);
             if (goalResult.error && 'message' in (goalResult.error as any)) console.error('[UserContext] Error fetching goals:', (goalResult.error as any).message);

             const goalTitleMap = new Map<string, string>();
             fetchedGoals.forEach(goal => goalTitleMap.set(goal.id, goal.title));

             const questsWithTitles: QuestWithGoalTitle[] = fetchedQuests.map(quest => ({
               ...quest,
               goalTitle: goalTitleMap.get(quest.goalId) || null
             }));

             setQuests(questsWithTitles);

             const initialStates: Record<string, QuestWithGoalTitle> = {};
             questsWithTitles.forEach(q => { initialStates[q.id] = { ...q }; });
             setOriginalQuestStates(initialStates);
           }
        } catch (err: unknown) {
          let errorMessage = "An unknown error occurred fetching quests/goals";
          if (isErrorWithMessage(err)) {
            errorMessage = err.message;
          }
          console.error('[UserContext] Unexpected error fetching quests or goals:', errorMessage);
          if (isMounted) setQuests([]);
        } finally {
          if (isMounted) setIsQuestLoading(false);
        }

        // --- Fetch Achievement Status & Available Titles --- (Now uses temp count)
        try {
          setIsAchievementLoading(true);
          const [achStatusResult, unlockedTitlesResult] = await Promise.all([
            // Pass the fetched profile/stats/count directly
            AchievementService.getAllAchievementsStatus(currentUserId, fetchedProfileData, fetchedStatsData, initialCompletedQuestsCount),
            TitleService.getUnlockedTitles(currentUserId)
          ]);

          if (isMounted) {
            if (achStatusResult.error && isErrorWithMessage(achStatusResult.error)) console.error('[UserContext] Error fetching achievement status:', achStatusResult.error.message);
            if (unlockedTitlesResult.error && isErrorWithMessage(unlockedTitlesResult.error)) console.error('[UserContext] Error fetching unlocked titles:', unlockedTitlesResult.error.message);

            setAchievementsStatus(achStatusResult.data ?? []);
            setAvailableTitles(unlockedTitlesResult.data ?? []);
          }
        } catch (err: unknown) {
          let errorMessage = "An unknown error occurred fetching achievements/titles";
          if (isErrorWithMessage(err)) errorMessage = err.message;
          console.error('[UserContext] Unexpected error fetching achievements/titles:', errorMessage);
          if (isMounted) { setAchievementsStatus([]); setAvailableTitles([]); }
        } finally {
           if (isMounted) setIsAchievementLoading(false);
        }

      } else if (isMounted) {
          setIsProfileLoading(false);
          setIsQuestLoading(false);
          setIsAchievementLoading(false);
          setProfile(null);
          setStats(null);
          setQuests([]);
          setAchievementsStatus([]);
          setAvailableTitles([]);
      }

      // Set global loading false only after all initial data loads finish
      if (isMounted) setIsLoading(false);
    }

    loadInitialData();

    // --- Auth Listener Setup ---
    const { data: { subscription } } = AccountService.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      console.log(`[UserContext] AccountService event: ${event}, Session:`, currentSession ? 'Exists' : 'Null', 'User:', currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && currentSession?.user) {
        console.log(`[UserContext] Refetching ALL data for user ${currentSession.user.id} after ${event}...`);
        setIsLoading(true);
        setIsProfileLoading(true);
        setIsQuestLoading(true);
        setIsAchievementLoading(true);
        setProfile(null);
        setStats(null);
        setQuests([]);
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setOriginalQuestStates({});
        loadInitialData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setStats(null);
        setQuests([]);
        setOriginalQuestStates({});
        setAchievementsStatus([]);
        setAvailableTitles([]);
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsQuestLoading(false);
        setIsAchievementLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);


  // --- Sign In/Out Handlers (Delegate to AccountService) ---
  const handleSignInWithApple = useCallback(async () => {
    setIsLoading(true);
    const { error } = await AccountService.signInWithApple();
    if (error) {
        console.error('[UserContext] Apple Sign-In failed:', error.message);
        setIsLoading(false);
    }
    return { error };
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    const { error } = await AccountService.signOut();
    if (error) {
        console.error('[UserContext] Sign Out failed:', error.message);
         setIsLoading(false);
    }
    return { error };
  }, []);

  // --- Profile Update Handler ---
  const handleUpdateUserProfile = useCallback(async (profileData: UserProfileUpdateData) => {
    if (!profile?.id) {
        console.error('[UserContext] Cannot update profile, user ID not available.');
        return { error: new Error("User not available") };
    }
    console.log('[UserContext] Updating profile with:', profileData);

    const error = null;
    setProfile(currentProfile => {
        if (!currentProfile) return null;
        return {
            ...currentProfile,
            ...profileData,
        };
    });
    setUser(currentUser => {
        if (!currentUser) return null;
        return {
            ...currentUser,
            user_metadata: {
                ...(currentUser.user_metadata || {}),
                ...profileData,
            },
             updated_at: new Date().toISOString(),
        };
    });
    console.log('[UserContext] Profile update simulated successfully.');
    return { error };
  }, [profile]);

  // --- Title Update Handler ---
  const handleUpdateTitle = useCallback(async (titleId: string) => {
      if (!profile?.id) {
          console.error('[UserContext] Cannot update equipped title, user ID not available.');
          return { error: new Error("User not available") };
      }
      console.log(`[UserContext] Attempting to update *equipped* title to ${titleId} for user ${profile.id}`);
      const originalProfile = profile ? { ...profile } : null;

      const newTitle = availableTitles.find(t => t.id === titleId);
      if (!newTitle) {
          console.error(`[UserContext] Cannot equip title ${titleId}: Not found in available titles.`);
          return { error: new Error("Title not available to equip") };
      }

      setProfile(currentProfile => currentProfile ? { ...currentProfile, title: newTitle } : null);

      const { error } = await TitleService.updateTitle(profile.id, titleId);
      if (error) {
          console.error(`[UserContext] Failed to update equipped title for user ${profile.id}:`, error.message);
          setProfile(originalProfile);
      } else {
          console.log(`[UserContext] Equipped title updated successfully for user ${profile.id}.`);
      }
      return { error };
  }, [profile, availableTitles]);

  // --- MODIFIED: Stat Bonus Increment Handlers ---
  const handleIncrementStatBonus = useCallback(async (statLabel: string, amount: number) => {
    if (!profile?.id || !stats) return { error: new Error("User or stats not available") };
    if (statLabel === 'DIS') return { error: null }; // Handled separately

    const originalStats = { ...stats };
    let error: Error | null = null;

    // Update local state
    setStats(currentStats => {
      if (!currentStats || !currentStats[statLabel]) return currentStats;
      const newBonus = currentStats[statLabel].bonus + amount;
      const newTotalValue = currentStats[statLabel].baseValue + newBonus;
      return {
        ...currentStats,
        [statLabel]: {
          ...currentStats[statLabel],
          bonus: newBonus,
          totalValue: newTotalValue,
        }
      };
    });

    // Trigger notification via service hook (now context hook)
    addStatNotification(statLabel, amount);

    // Call backend service
    ({ error } = await StatService.incrementStatBonus(profile.id, statLabel, amount));
    if (error) {
      console.error(`[UserContext] Failed backend update for ${statLabel} bonus:`, error.message);
      setStats(originalStats);
    }
    return { error };

  }, [profile, stats, addStatNotification]); // Keep addNotification dependency

  const handleIncrementDisciplineBonus = useCallback(async (amount: number) => {
      if (!profile?.id || !stats) return { error: new Error("User or stats not available") };
      const statLabel = 'DIS';
      const originalStats = { ...stats };
      let error: Error | null = null;

      // Update local state
      setStats(currentStats => {
        if (!currentStats || !currentStats[statLabel]) return currentStats;
         const newBonus = currentStats[statLabel].bonus + amount;
         const newTotalValue = currentStats[statLabel].baseValue + newBonus;
        return {
          ...currentStats,
          [statLabel]: {
            ...currentStats[statLabel],
            bonus: newBonus,
            totalValue: newTotalValue,
          }
        };
      });

      // Trigger notification via service hook (now context hook)
      addStatNotification(statLabel, amount);

      // Call backend service
      ({ error } = await StatService.incrementDisciplineBonus(profile.id, amount));
      if (error) {
        console.error(`[UserContext] Failed backend update for DIS bonus:`, error.message);
        setStats(originalStats);
      }
      return { error };
  }, [profile, stats, addStatNotification]); // Keep addNotification dependency

  // --- REFACTORED: Quest Handlers (Using helpers defined earlier) ---
  const handleCompleteQuest = useCallback(async (id: string) => {
    console.log(`[UserContext] Calling QuestService.completeQuest for ${id}`);
    // Pass only the base Quest objects to the service
    const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);

    const { updatedQuest, updatedOriginalStates, error } = await QuestService.completeQuest(
      id,
      baseQuests,
      originalQuestStates // Still pass original states (might need adjustment if service returns Quest only)
    );

    if (error || !updatedQuest) {
      console.error(`[UserContext] QuestService.completeQuest failed for ${id}:`, error?.message);
      // Handle error appropriately (e.g., show notification to user)
      return;
    }

    // Update local states
    setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
    // Map goalTitle back onto the original states returned by the service
    const updatedOriginalStatesWithTitle: Record<string, QuestWithGoalTitle> = {};
    for (const questId in updatedOriginalStates) {
      const originalQuest = updatedOriginalStates[questId];
      const currentQuest = quests.find(q => q.id === questId); // Find current quest to get title
      updatedOriginalStatesWithTitle[questId] = {
        ...originalQuest,
        goalTitle: currentQuest ? currentQuest.goalTitle : null, // Add goalTitle back
      };
    }
    setOriginalQuestStates(updatedOriginalStatesWithTitle);

    // --- Stat Update Logic ---
    console.log(`[UserContext] Quest ${id} completed via Service. Triggering stat updates.`);
    // Use the specific discipline amount if provided, otherwise default
    const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
    
    // Always increment Discipline
    console.log(` -> Always incrementing DIS by ${disciplineAmount}`);
    await handleIncrementDisciplineBonus(disciplineAmount);

    // Loop through EXPLICIT stat increments (already excludes DIS)
    for (const increment of updatedQuest.statIncrements) {
      const { category, amount } = increment;
      if (category === 'DIS') continue;
      
      console.log(` -> Incrementing explicit ${category} by ${amount}`);
      if (stats && stats[category]) {
        await handleIncrementStatBonus(category, amount);
      } else {
        console.warn(`[UserContext] Explicit stat category ${category} not found in user stats or is invalid.`);
      }
    }
    // --- End Stat Update Logic ---

    // --- Add Quest Notification --- 
    if (updatedQuest.title) { // Check if title exists
        addQuestNotification('Completed', updatedQuest.title);
    }
    // --------------------------- 

    incrementCompletedQuestCount();

    // TODO: Re-evaluate achievement status after quest completion? Or rely on screen refresh.
    // Example: Check achievements immediately (could be slightly delayed)
    // if (profile && stats && user) {
    //   AchievementService.getAllAchievementsStatus(user.id, profile, stats, profile.completedQuestsCount)
    //     .then(({ data }) => data && setAchievementsStatus(data));
    // }

  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, incrementCompletedQuestCount, profile, user]);

  const handleSkipQuest = useCallback(async (id: string) => {
    console.log(`[UserContext] Calling QuestService.skipQuest for ${id}`);
    const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);

    const { updatedQuest, updatedOriginalStates, error } = await QuestService.skipQuest(
      id,
      baseQuests,
      originalQuestStates
    );

    if (error || !updatedQuest) {
      console.error(`[UserContext] QuestService.skipQuest failed for ${id}:`, error?.message);
      return;
    }

    setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
    // Map goalTitle back onto the original states returned by the service
    const updatedOriginalStatesWithTitle_Skip: Record<string, QuestWithGoalTitle> = {};
    for (const questId in updatedOriginalStates) {
      const originalQuest = updatedOriginalStates[questId];
      const currentQuest = quests.find(q => q.id === questId);
      updatedOriginalStatesWithTitle_Skip[questId] = {
        ...originalQuest,
        goalTitle: currentQuest ? currentQuest.goalTitle : null,
      };
    }
    setOriginalQuestStates(updatedOriginalStatesWithTitle_Skip);

    // --- Add Quest Notification --- 
    if (updatedQuest.title) { // Check if title exists
        addQuestNotification('Skipped', updatedQuest.title);
    }
    // --------------------------- 

    // Note: Skipping usually doesn't count towards completion achievements

  }, [quests, originalQuestStates, addQuestNotification]);

  const handleIncrementQuestProgress = useCallback(async (id: string) => {
    console.log(`[UserContext] Calling QuestService.incrementQuestProgress for ${id}`);
    const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);

    const { updatedQuest, updatedOriginalStates, requiresStatUpdate, error } = await QuestService.incrementQuestProgress(
      id,
      baseQuests,
      originalQuestStates
    );

    if (error || !updatedQuest) {
      console.error(`[UserContext] QuestService.incrementQuestProgress failed for ${id}:`, error?.message);
      return;
    }

    setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
    // Map goalTitle back onto the original states returned by the service
    const updatedOriginalStatesWithTitle_Inc: Record<string, QuestWithGoalTitle> = {};
    for (const questId in updatedOriginalStates) {
      const originalQuest = updatedOriginalStates[questId];
      const currentQuest = quests.find(q => q.id === questId);
      updatedOriginalStatesWithTitle_Inc[questId] = {
        ...originalQuest,
        goalTitle: currentQuest ? currentQuest.goalTitle : null,
      };
    }
    setOriginalQuestStates(updatedOriginalStatesWithTitle_Inc);

    if (requiresStatUpdate) {
        console.log(`[UserContext] Quest ${id} completed via Service increment. Triggering stat updates.`);
        // Use the specific discipline amount if provided, otherwise default
        const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
        
        // Always increment Discipline
        console.log(` -> Always incrementing DIS by ${disciplineAmount}`);
        await handleIncrementDisciplineBonus(disciplineAmount);

        // Loop through EXPLICIT stat increments (already excludes DIS)
        for (const increment of updatedQuest.statIncrements) {
          const { category, amount } = increment;
          if (category === 'DIS') continue;
          
          console.log(` -> Incrementing explicit ${category} by ${amount}`);
          if (stats && stats[category]) {
            await handleIncrementStatBonus(category, amount);
          } else {
            console.warn(`[UserContext] Explicit stat category ${category} not found in user stats or is invalid.`);
          }
        }
    }

    // --- Add Quest Notification for Auto-Completion --- 
    if (requiresStatUpdate && updatedQuest.title) { // Check if title exists
        addQuestNotification('Completed', updatedQuest.title);
    }
    // -------------------------------------------- 

    incrementCompletedQuestCount();

  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, incrementCompletedQuestCount, profile, user]);

  const handleDecrementQuestProgress = useCallback(async (id: string) => {
     console.log(`[UserContext] Calling QuestService.decrementQuestProgress for ${id}`);
     const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);

     const { updatedQuest, error } = await QuestService.decrementQuestProgress(id, baseQuests);

     if (error || !updatedQuest) {
       console.error(`[UserContext] QuestService.decrementQuestProgress failed for ${id}:`, error?.message);
       return;
     }

     setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));

  }, [quests]);

  const handleSetQuestProgress = useCallback(async (id: string, count: number) => {
      console.log(`[UserContext] Calling QuestService.setQuestProgress for ${id} to ${count}`);
      const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);

      const { updatedQuest, updatedOriginalStates, requiresStatUpdate, error } = await QuestService.setQuestProgress(
        id,
        count,
        baseQuests,
        originalQuestStates
      );

      if (error || !updatedQuest) {
          console.error(`[UserContext] QuestService.setQuestProgress failed for ${id}:`, error?.message);
          return;
      }

      setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
      // Map goalTitle back onto the original states returned by the service
      const updatedOriginalStatesWithTitle_Set: Record<string, QuestWithGoalTitle> = {};
      for (const questId in updatedOriginalStates) {
        const originalQuest = updatedOriginalStates[questId];
        const currentQuest = quests.find(q => q.id === questId);
        updatedOriginalStatesWithTitle_Set[questId] = {
          ...originalQuest,
          goalTitle: currentQuest ? currentQuest.goalTitle : null,
        };
      }
      setOriginalQuestStates(updatedOriginalStatesWithTitle_Set);

      if (requiresStatUpdate) {
          console.log(`[UserContext] Quest ${id} completed via Service set progress. Triggering stat updates.`);
          // Use the specific discipline amount if provided, otherwise default
          const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
          
          // Always increment Discipline
          console.log(` -> Always incrementing DIS by ${disciplineAmount}`);
          await handleIncrementDisciplineBonus(disciplineAmount);

          // Loop through EXPLICIT stat increments (already excludes DIS)
          for (const increment of updatedQuest.statIncrements) {
            const { category, amount } = increment;
            if (category === 'DIS') continue;
            
            console.log(` -> Incrementing explicit ${category} by ${amount}`);
            if (stats && stats[category]) {
              await handleIncrementStatBonus(category, amount);
            } else {
              console.warn(`[UserContext] Explicit stat category ${category} not found in user stats or is invalid.`);
            }
          }
      }

      // --- Add Quest Notification --- 
      if (updatedQuest.title) { // Check if title exists
          addQuestNotification('Undone', updatedQuest.title);
      }
      // --------------------------- 

      incrementCompletedQuestCount();

  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, incrementCompletedQuestCount, profile, user]);

  const handleUndoQuestStatus = useCallback(async (id: string) => {
    console.log(`[UserContext] Calling QuestService.undoQuestStatus for ${id}`);

    const { updatedQuest, requiresStatDecrement, error } = await QuestService.undoQuestStatus(
      id,
      originalQuestStates
    );

    if (error || !updatedQuest) {
        console.error(`[UserContext] QuestService.undoQuestStatus failed for ${id}:`, error?.message);
        return;
    }

    // Find the corresponding quest in the current state to get the goalTitle
    const currentQuest = quests.find(q => q.id === id);
    const goalTitleToKeep = currentQuest ? currentQuest.goalTitle : null;

    setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: goalTitleToKeep } : q));

    // Note: originalQuestStates doesn't need updating on undo, it holds the pre-complete state.

    if (requiresStatDecrement) {
        const originalQuestForDecrement = originalQuestStates[id];
        if (originalQuestForDecrement && originalQuestForDecrement.statIncrements) {
            console.log(`[UserContext] Quest ${id} status undone via Service. Triggering stat decrements.`);
            // Use the specific discipline amount (negated) if provided, otherwise default
            const disciplineDecrementAmount = -(originalQuestForDecrement.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE);
            
            // Always decrement Discipline
            console.log(` -> Always decrementing DIS by ${disciplineDecrementAmount}`);
            await handleIncrementDisciplineBonus(disciplineDecrementAmount); 

            // Loop through EXPLICIT stat increments (excluding DIS) for decrement
            for (const increment of originalQuestForDecrement.statIncrements) {
              const { category, amount } = increment;
              if (category === 'DIS') continue; // Skip DIS

              const decrementAmount = -amount; // Negate the original amount
              console.log(` -> Decrementing explicit ${category} by ${amount} (applying ${decrementAmount})`);
              if (stats && stats[category]) {
                await handleIncrementStatBonus(category, decrementAmount); 
              } else {
                 console.warn(`[UserContext] Explicit stat category ${category} not found in user stats or is invalid during undo.`);
              }
            }
        } else {
             console.warn(`[UserContext] Could not find original state or explicit statIncrements for quest ${id} to calculate stat decrement.`);
        }
    }

    decrementCompletedQuestCount();
  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, decrementCompletedQuestCount, profile, user]);

  // --- NEW: Achievement Claim Handler ---
  const handleClaimAchievement = useCallback(async (achievementId: string) => {
    if (!profile || !stats || !user) {
      console.error("[UserContext] Cannot claim achievement: User data not loaded.");
      return { error: new Error("User data not loaded") };
    }

    // Optimistically find the current status
    const currentStatus = achievementsStatus.find(s => s.id === achievementId);
    if (!currentStatus || !currentStatus.canClaim) {
      console.warn(`[UserContext] Cannot claim achievement ${achievementId}: Not claimable.`);
      return { error: new Error("Achievement not claimable") };
    }

    const originalStatus = { ...currentStatus };
    const originalAvailableTitles = [...availableTitles];

    // Optimistically update UI state
    setAchievementsStatus(prev =>
      prev.map(s => s.id === achievementId ? { ...s, isClaimed: true, canClaim: false } : s)
    );

    // Call the service to perform the claim and grant rewards
    const { data: updatedStatus, error } = await AchievementService.claimAchievementReward(
      user.id,
      achievementId,
      profile,
      stats,
      profile.completedQuestsCount
    );

    if (error || !updatedStatus) {
      console.error(`[UserContext] Failed to claim achievement ${achievementId}:`, error?.message);
      // Revert optimistic update
      setAchievementsStatus(prev =>
          prev.map(s => s.id === achievementId ? originalStatus : s)
      );
      return { error: error || new Error("Claim failed") };
    } else {
      console.log(`[UserContext] Achievement ${achievementId} claimed successfully.`);
      const definition = getAchievementDefinition(achievementId);
      const newTitleReward = definition?.rewards.find(r => r.type === 'title') as TitleReward | undefined;

      // Add achievement notification regardless of reward type
      if (definition) {
          addAchievementNotification(definition.title);
      }

      // Handle title reward specifically
      if (newTitleReward) {
        console.log(`[UserContext] Achievement ${achievementId} included a title reward. Refetching available titles and showing popup...`);
        const { data: newTitles, error: titleError } = await TitleService.getUnlockedTitles(user.id);
        if (titleError) {
          console.error("[UserContext] Failed to refetch titles after claim:", titleError.message);
          setAvailableTitles(originalAvailableTitles); // Revert title list on error
        } else {
          const newlyGrantedTitle = newTitles?.find(t => t.id === newTitleReward.titleId);
          setAvailableTitles(newTitles ?? []); // Update available titles
          // Show the popup
          if (newlyGrantedTitle) {
              setNewTitlePopupState({ visible: true, titleName: newlyGrantedTitle.name });
          }
        }
      } else {
          // If no title reward, ensure the popup isn't triggered/remains closed
          // (This check might be redundant if state defaults to non-visible, but good for clarity)
          if (newTitlePopupState.visible) {
              setNewTitlePopupState({ visible: false, titleName: null });
          }
      }
      return { error: null };
    }
  }, [profile, stats, user, achievementsStatus, availableTitles, addAchievementNotification, newTitlePopupState.visible]); // Added newTitlePopupState.visible dependency

  // --- Function to close the title popup ---
  const closeNewTitlePopup = useCallback(() => {
      setNewTitlePopupState({ visible: false, titleName: null });
  }, []);

  // --- Context Value ---
  const value = useMemo(() => {
      // Determine overall loading state
      const combinedLoading = isLoading || isQuestLoading || isProfileLoading || isAchievementLoading;
      return {
          session,
          user,
          profile,
          stats,
          isLoading: combinedLoading, // Use combined loading state
          signInWithApple: handleSignInWithApple,
          signOut: handleSignOut,
          updateUserProfile: handleUpdateUserProfile,
          updateTitle: handleUpdateTitle,
          quests,
          completeQuest: handleCompleteQuest,
          skipQuest: handleSkipQuest,
          incrementQuestProgress: handleIncrementQuestProgress,
          decrementQuestProgress: handleDecrementQuestProgress,
          setQuestProgress: handleSetQuestProgress,
          undoQuestStatus: handleUndoQuestStatus,
          // Achievement values
          achievementsStatus,
          claimAchievement: handleClaimAchievement,
          availableTitles,
          // Add popup state and closer function
          newTitlePopupState,
          closeNewTitlePopup,
      };
  }, [
    session, user, profile, stats, isLoading, isQuestLoading, isProfileLoading, isAchievementLoading,
    quests, achievementsStatus, availableTitles,
    handleSignInWithApple, handleSignOut, handleUpdateUserProfile, handleUpdateTitle,
    handleCompleteQuest, handleSkipQuest, handleIncrementQuestProgress,
    handleDecrementQuestProgress, handleSetQuestProgress, handleUndoQuestStatus,
    handleClaimAchievement,
    addStatNotification, addQuestNotification, addAchievementNotification,
    // Add popup state and closer function to dependencies
    newTitlePopupState,
    closeNewTitlePopup
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use the UserContext
export function useAuth() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  return context;
}
