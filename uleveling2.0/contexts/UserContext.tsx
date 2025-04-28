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
import { useNotificationContext } from '@/contexts/NotificationContext';

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
interface UserProfile {
  id: string;
  name: string;
  level: number;
  title: UserTitle | null;
  // Add other profile fields if necessary
}

interface UserProfileUpdateData {
  name?: string;
  // Add other fields as needed based on AccountService.updateProfile
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

  // Use the notification CONTEXT hook to get addNotification
  const { addStatNotification, addQuestNotification } = useNotificationContext();

  // --- Load Initial Session, Profile, Stats, Title, Quests & Goals ---
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsQuestLoading(true);
    setIsProfileLoading(true);

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
        // --- Fetch Profile, Stats, Title in Parallel ---
        try {
          const [profileResult, statsResult, titleResult] = await Promise.all([
            Promise.resolve({ data: { id: currentUserId, name: user?.user_metadata?.name || 'Username', level: 99 }, error: null }),
            StatService.getStats(currentUserId),
            TitleService.getCurrentTitle(currentUserId),
          ]);

          if (isMounted) {
             if (profileResult.error && 'message' in (profileResult.error as any)) console.error('[UserContext] Error fetching profile:', (profileResult.error as any).message);
             if (statsResult.error && 'message' in (statsResult.error as any)) console.error('[UserContext] Error fetching stats:', (statsResult.error as any).message);
             if (titleResult.error && 'message' in (titleResult.error as any)) console.error('[UserContext] Error fetching title:', (titleResult.error as any).message);

             const fetchedProfile: UserProfile = {
                 id: currentUserId,
                 name: profileResult.data?.name ?? user?.user_metadata?.name ?? 'Username',
                 level: profileResult.data?.level ?? 99,
                 title: titleResult.data ?? { id: 't1', name: 'Shadow Monarch' }
             };
             setProfile(fetchedProfile);
             setStats(statsResult.data ?? null);
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
      } else if (isMounted) {
          setIsProfileLoading(false);
          setIsQuestLoading(false);
          setProfile(null);
          setStats(null);
          setQuests([]);
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
        console.log(`[UserContext] Refetching data for user ${currentSession.user.id} after ${event}...`);
        setIsLoading(true);
        setIsProfileLoading(true);
        setIsQuestLoading(true);
        setProfile(null);
        setStats(null);
        setQuests([]);
        loadInitialData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setStats(null);
        setQuests([]);
        setOriginalQuestStates({});
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsQuestLoading(false);
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
          console.error('[UserContext] Cannot update title, user ID not available.');
          return { error: new Error("User not available") };
      }
      console.log(`[UserContext] Attempting to update title to ${titleId} for user ${profile.id}`);
      const originalProfile = { ...profile };

      const newTitleName = titleId === 't1' ? 'Shadow Monarch' : `Title ${titleId}`;
      setProfile(currentProfile => currentProfile ? { ...currentProfile, title: { id: titleId, name: newTitleName } } : null);

      const { error } = await TitleService.updateTitle(profile.id, titleId);
      if (error) {
          console.error(`[UserContext] Failed to update title for user ${profile.id}:`, error.message);
          setProfile(originalProfile);
      } else {
          console.log(`[UserContext] Title updated successfully for user ${profile.id}.`);
      }
      return { error };
  }, [profile]);

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

  // --- REFACTORED: Quest Handlers (Using QuestService) ---
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

  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification]);

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

  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification]);

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

  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification]);

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
  }, [quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification]); // Added stats dependencies


  // --- Context Value ---
  const value = useMemo(() => {
      return {
          session,
          user,
          profile,
          stats,
          isLoading: isLoading || isQuestLoading || isProfileLoading,
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
      };
  }, [
    session, user, profile, stats, isLoading, isQuestLoading, isProfileLoading, quests,
    handleSignInWithApple, handleSignOut, handleUpdateUserProfile, handleUpdateTitle,
    handleCompleteQuest, handleSkipQuest, handleIncrementQuestProgress, 
    handleDecrementQuestProgress, handleSetQuestProgress, handleUndoQuestStatus,
    addStatNotification, addQuestNotification
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
