import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import AccountService from '@/services/AccountService';
import { Session, User } from '@supabase/supabase-js';
import { Quest } from '@/mock/dashboardData';
import QuestService from '@/services/QuestService';
import { Goal } from '@/mock/roadmapData';
import RoadmapService from '@/services/RoadmapService';

// Remove OnboardingData import if only name is needed for profile update
// import { OnboardingData } from '@/app/onboarding'; 

// Added QuestWithGoalTitle interface
interface QuestWithGoalTitle extends Quest {
  goalTitle: string | null; // Goal title can be null if not found
}

interface UserProfileUpdateData {
  name?: string;
  // Add other fields as needed based on AccountService.updateProfile
}

interface UserContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateUserProfile: (profileData: UserProfileUpdateData) => Promise<{ error: Error | null }>; 
  quests: QuestWithGoalTitle[]; // Updated type
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

export function UserProvider({ children }: UserProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quests, setQuests] = useState<QuestWithGoalTitle[]>([]); // Updated type
  const [isQuestLoading, setIsQuestLoading] = useState<boolean>(true);
  const [originalQuestStates, setOriginalQuestStates] = useState<Record<string, QuestWithGoalTitle>>({}); // For undo functionality

  // --- Load Initial Session, Quests & Goals ---
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); // Combined loading state
    setIsQuestLoading(true);

    async function loadInitialData() {
      // Get Session
      try {
        const { session: initialSession, error: sessionError } = await AccountService.getSession();
        if (isMounted) {
          if (sessionError) console.error('[UserContext] Error checking session:', sessionError.message);
          setSession(initialSession);
          // --- Set Initial User --- 
          if (initialSession?.user) {
              setUser(initialSession.user);
          } else {
              // If no user from session (likely due to disabled auth), create a dummy user
              console.warn('[UserContext] No initial user found, creating dummy user object for simulation.');
              const dummyUser: User = {
                  id: 'dummy-user-id', // Placeholder ID
                  aud: 'authenticated',
                  role: 'authenticated',
                  email: 'dummy@example.com',
                  email_confirmed_at: new Date().toISOString(),
                  phone: '',
                  confirmed_at: new Date().toISOString(),
                  last_sign_in_at: new Date().toISOString(),
                  app_metadata: { provider: 'dummy' },
                  user_metadata: { name: 'Player' }, // Default name
                  identities: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
              };
              setUser(dummyUser);
          }
          // ----------------------
        }
      } catch (err) {
        console.error('[UserContext] Unexpected error checking session:', err);
        if (isMounted) setSession(null); setUser(null);
      }

      // --- Fetch Quests & Goals in Parallel ---
      try {
        // Use Promise.all to fetch quests and goals concurrently
        const [questResult, goalResult] = await Promise.all([
          QuestService.getQuests(),
          RoadmapService.getGoals()
        ]);

        if (isMounted) {
          const fetchedQuests = questResult.data || [];
          const fetchedGoals = goalResult.data || [];

          if (questResult.error) console.error('[UserContext] Error fetching quests:', questResult.error.message);
          if (goalResult.error) console.error('[UserContext] Error fetching goals:', goalResult.error.message);

          // Create a map for quick goal title lookup
          const goalTitleMap = new Map<string, string>();
          fetchedGoals.forEach(goal => {
            goalTitleMap.set(goal.id, goal.title);
          });

          // Combine quests with goal titles
          const questsWithTitles: QuestWithGoalTitle[] = fetchedQuests.map(quest => ({
            ...quest,
            goalTitle: goalTitleMap.get(quest.goalId) || null // Get title or null if not found
          }));

          setQuests(questsWithTitles);

          // Store initial states for potential undo operations
           const initialStates: Record<string, QuestWithGoalTitle> = {};
           questsWithTitles.forEach(q => {
             initialStates[q.id] = { ...q };
           });
           setOriginalQuestStates(initialStates);
        }
      } catch (err) {
        console.error('[UserContext] Unexpected error fetching quests or goals:', err);
        if (isMounted) setQuests([]);
      } finally {
        if (isMounted) setIsQuestLoading(false);
      }

      // Only set global loading false after all initial data loads finish
      if (isMounted) setIsLoading(false);
    }

    loadInitialData();

    // --- Auth Listener Setup ---
    const { data: { subscription } } = AccountService.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      console.log(`[UserContext] AccountService event: ${event}, Session:`, currentSession ? 'Exists' : 'Null', 'User:', currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      // Consider setting isLoading based on event type (e.g., SIGNED_IN)
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
    if (error) console.error('[UserContext] Apple Sign-In failed:', error.message);
    setIsLoading(false); // Might be handled by auth listener too
    return { error };
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    const { error } = await AccountService.signOut();
    if (error) console.error('[UserContext] Sign Out failed:', error.message);
    // State updates (session=null, user=null) should be handled by the auth listener
    setIsLoading(false);
    return { error };
  }, []);

  // --- Profile Update Handler (Simulated Locally) ---
  const handleUpdateUserProfile = useCallback(async (profileData: UserProfileUpdateData) => {
    console.log('[UserContext] Simulating local profile update with:', profileData);
    
    // --- Commented out AccountService call ---
    // console.log('[UserContext] Calling AccountService.updateProfile with:', profileData);
    // const { user: updatedUser, error } = await AccountService.updateProfile(profileData); 
    // --- End Commented out ---

    // Simulate success and update local state directly
    const error = null;
    
    if (error) {
        // This block won't be reached in the simulation
        console.error('[UserContext] Failed to update user profile (simulated error).');
    } else {
        console.log('[UserContext] User profile update simulated successfully. Updating local state.');
        // Manually update local user state's metadata 
        setUser(currentUser => {
            if (!currentUser) {
                 console.warn('[UserContext] Cannot update profile, currentUser is null.');
                 return null;
            }
            console.log('[UserContext] Updating local user state...');
            const updatedUser = {
                ...currentUser,
                user_metadata: {
                    ...(currentUser.user_metadata || {}),
                    ...profileData, // Merge the new data
                },
                 updated_at: new Date().toISOString(), 
            };
            console.log('[UserContext] New local user state:', updatedUser);
            return updatedUser;
        });
    }
    return { error }; // Return simulated result
  }, []); // No external dependencies needed for local simulation

  // --- Quest Handlers (Updated to preserve goalTitle) ---
  const handleCompleteQuest = useCallback(async (id: string) => {
    const originalQuests = [...quests];
    const questToUpdate = originalQuests.find(q => q.id === id);
    // Preserve goalTitle from the existing state
    if (!questToUpdate || questToUpdate.status === 'completed') return; 

    const updatedQuestData: QuestWithGoalTitle = { 
        ...questToUpdate, 
        status: 'completed' as const,
        progress: { ...questToUpdate.progress, current: questToUpdate.progress.total },
        goalTitle: questToUpdate.goalTitle // Keep existing goalTitle
    };

    setQuests(prevQuests => prevQuests.map(q => q.id === id ? updatedQuestData : q));

    // Send only necessary data to backend (exclude goalTitle if backend doesn't need it)
    const { goalTitle, ...updatePayload } = updatedQuestData; 
    const { error } = await QuestService.updateQuest(updatePayload);
    if (error) {
      console.error(`[UserContext] Failed to complete quest ${id}:`, error.message);
      setQuests(originalQuests); // Revert UI on error
    }
  }, [quests]);

  const handleSkipQuest = useCallback(async (id: string) => {
    const originalQuests = [...quests];
    const questToUpdate = originalQuests.find(q => q.id === id);
    if (!questToUpdate || questToUpdate.status === 'skipped') return;

    const updatedQuestData: QuestWithGoalTitle = { 
        ...questToUpdate, 
        status: 'skipped' as const,
        goalTitle: questToUpdate.goalTitle // Keep existing goalTitle
    };

    setQuests(prevQuests => prevQuests.map(q => q.id === id ? updatedQuestData : q));

    // Send only necessary data to backend
    const { goalTitle, ...updatePayload } = updatedQuestData;
    const { error } = await QuestService.updateQuest(updatePayload); 
    if (error) {
      console.error(`[UserContext] Failed to skip quest ${id}:`, error.message);
      setQuests(originalQuests);
    }
  }, [quests]);

  const handleIncrementQuestProgress = useCallback(async (id: string) => {
    const originalQuests = [...quests];
    const questToUpdate = originalQuests.find(q => q.id === id);
    if (!questToUpdate || questToUpdate.status !== 'active') return; // Only increment active quests

    const newCurrent = Math.min(questToUpdate.progress.total, questToUpdate.progress.current + 1);
    // Only update if progress actually changed
    if (newCurrent === questToUpdate.progress.current) return; 

    const newStatus = (newCurrent === questToUpdate.progress.total) ? 'completed' as const : 'active' as const;

    const updatedQuestData: QuestWithGoalTitle = { 
        ...questToUpdate, 
        status: newStatus, 
        progress: { ...questToUpdate.progress, current: newCurrent },
        goalTitle: questToUpdate.goalTitle // Keep existing goalTitle
    };

    setQuests(prevQuests => prevQuests.map(q => q.id === id ? updatedQuestData : q));

    // Send only necessary data to backend
    const { goalTitle, ...updatePayload } = updatedQuestData;
    const { error } = await QuestService.updateQuest(updatePayload);
    if (error) {
      console.error(`[UserContext] Failed to increment quest ${id}:`, error.message);
      setQuests(originalQuests);
    }
  }, [quests]);

  const handleDecrementQuestProgress = useCallback(async (id: string) => {
     const originalQuests = [...quests];
     const questToUpdate = originalQuests.find(q => q.id === id);
     if (!questToUpdate || questToUpdate.status !== 'active') return; // Only decrement active quests

     const newCurrent = Math.max(0, questToUpdate.progress.current - 1);
      // Only update if progress actually changed
     if (newCurrent === questToUpdate.progress.current) return; 

     const updatedQuestData: QuestWithGoalTitle = { 
         ...questToUpdate, 
         progress: { ...questToUpdate.progress, current: newCurrent },
         goalTitle: questToUpdate.goalTitle // Keep existing goalTitle
     };

     setQuests(prevQuests => prevQuests.map(q => q.id === id ? updatedQuestData : q));

    // Send only necessary data to backend
    const { goalTitle, ...updatePayload } = updatedQuestData;
    const { error } = await QuestService.updateQuest(updatePayload);
     if (error) {
       console.error(`[UserContext] Failed to decrement quest ${id}:`, error.message);
       setQuests(originalQuests);
     }
  }, [quests]);

  const handleSetQuestProgress = useCallback(async (id: string, count: number) => {
      const originalQuests = [...quests];
      const questToUpdate = originalQuests.find(q => q.id === id);
      if (!questToUpdate || questToUpdate.status !== 'active') return; // Only set progress for active quests

      // Ensure count is within bounds [0, total]
      const newCurrent = Math.max(0, Math.min(questToUpdate.progress.total, count)); 
      // Only update if progress actually changed
      if (newCurrent === questToUpdate.progress.current) return;

      const newStatus = (newCurrent === questToUpdate.progress.total) ? 'completed' as const : 'active' as const;

      const updatedQuestData: QuestWithGoalTitle = {
          ...questToUpdate,
          status: newStatus,
          progress: { ...questToUpdate.progress, current: newCurrent },
          goalTitle: questToUpdate.goalTitle // Keep existing goalTitle
      };

      setQuests(prevQuests => prevQuests.map(q => q.id === id ? updatedQuestData : q));

      // Send only necessary data to backend
      const { goalTitle, ...updatePayload } = updatedQuestData;
      const { error } = await QuestService.updateQuest(updatePayload);
      if (error) {
          console.error(`[UserContext] Failed to set quest progress for ${id}:`, error.message);
          setQuests(originalQuests);
      }
  }, [quests]);

  const handleUndoQuestStatus = useCallback(async (id: string) => {
    const originalQuests = [...quests]; // Current state before undo
    const questToRestore = originalQuestStates[id];

    if (!questToRestore) {
      console.warn(`[UserContext] Cannot undo quest ${id}: Original state not found.`);
      return;
    }

    console.log(`[UserContext] Undoing status for quest ${id}. Restoring to:`, questToRestore);
    
    // Optimistically update UI
    setQuests(prevQuests => prevQuests.map(q => (q.id === id ? { ...questToRestore } : q)));

    // Update backend with restored data (exclude goalTitle if needed)
    const { goalTitle, ...updatePayload } = questToRestore;
    const { error } = await QuestService.updateQuest(updatePayload);

    if (error) {
        console.error(`[UserContext] Failed to undo quest ${id} on backend:`, error.message);
        // Revert UI back to the state before attempting undo
        setQuests(originalQuests); 
    } else {
       console.log(`[UserContext] Quest ${id} status successfully restored on backend.`);
       // Optionally, you might remove the entry from originalQuestStates if undo is final
       // Or keep it if multiple undos are possible (though current logic resets to initial load state)
    }
  }, [quests, originalQuestStates]); // Add originalQuestStates dependency


  // --- Context Value ---
  const value = useMemo(() => ({
    session,
    user,
    isLoading: isLoading || isQuestLoading, // Consider quest loading in global loading state
    signInWithApple: handleSignInWithApple,
    signOut: handleSignOut,
    updateUserProfile: handleUpdateUserProfile,
    quests, // Already updated type
    completeQuest: handleCompleteQuest,
    skipQuest: handleSkipQuest,
    incrementQuestProgress: handleIncrementQuestProgress,
    decrementQuestProgress: handleDecrementQuestProgress,
    setQuestProgress: handleSetQuestProgress,
    undoQuestStatus: handleUndoQuestStatus,
  }), [
    session, user, isLoading, isQuestLoading, quests, 
    handleSignInWithApple, handleSignOut, handleUpdateUserProfile,
    handleCompleteQuest, handleSkipQuest, handleIncrementQuestProgress, 
    handleDecrementQuestProgress, handleSetQuestProgress, handleUndoQuestStatus
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
