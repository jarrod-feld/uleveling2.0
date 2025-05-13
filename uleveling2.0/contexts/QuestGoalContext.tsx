import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import QuestService from '@/services/QuestService';
import RoadmapService from '@/services/RoadmapService';
import { Quest } from '@/mock/dashboardData';
import { Goal } from '@/mock/roadmapData';
import { useAuth } from './UserContext'; // Import useAuth to access user, profile, stats, and update functions
import { useNotificationContext } from './NotificationContext'; // Import notification context

// Define stat increment amount centrally
const DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE = 1;

// Re-define QuestWithGoalTitle if not imported from elsewhere
export interface QuestWithGoalTitle extends Quest {
    goalTitle: string | null;
    completedAt?: Date;
}

interface QuestGoalContextType {
    quests: QuestWithGoalTitle[];
    goals: Goal[]; // Add goals state
    originalQuestStates: Record<string, QuestWithGoalTitle>;
    isQuestLoading: boolean;
    isGoalLoading: boolean; // Add goal loading state
    completeQuest: (id: string) => Promise<void>; // Make async
    skipQuest: (id: string) => Promise<void>; // Make async
    incrementQuestProgress: (id: string) => Promise<void>; // Make async
    decrementQuestProgress: (id: string) => Promise<void>; // Make async
    setQuestProgress: (id: string, count: number) => Promise<void>; // Make async
    undoQuestStatus: (id: string) => Promise<void>; // Make async
    refreshQuestGoalData: () => Promise<void>; // Combined refresh function
}

const QuestGoalContext = createContext<QuestGoalContextType | undefined>(undefined);

interface QuestGoalProviderProps {
    children: ReactNode;
    isAppReady: boolean; // No longer optional, no default
}

export function QuestGoalProvider({ children, isAppReady }: QuestGoalProviderProps) {
    const [quests, setQuests] = useState<QuestWithGoalTitle[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]); // State for goals
    const [originalQuestStates, setOriginalQuestStates] = useState<Record<string, QuestWithGoalTitle>>({});
    const [isQuestLoading, setIsQuestLoading] = useState<boolean>(true);
    const [isGoalLoading, setIsGoalLoading] = useState<boolean>(true); // Loading state for goals

    const { 
        user, 
        profile, 
        stats, 
        isLoading: isAuthLoading, // <-- Get auth loading state
        handleIncrementStatBonus, 
        handleIncrementDisciplineBonus, 
        updateUserProfile // Corrected: Use updateUserProfile from UserContextType
    } = useAuth(); // Get needed items from UserContext
    const { addQuestNotification } = useNotificationContext(); // Get notifications

    const userId = user?.id; // Get userId, will be null/undefined if not logged in

    // --- Data Fetching Logic ---
    const fetchData = useCallback(async () => {
        // Only fetch when userId is available
        if (!userId) {
            console.log(`[QuestGoalContext] Skipping fetch: No user ID available yet.`);
            return;
        }
        
        console.log(`[QuestGoalContext] Fetching quests and goals for user ${userId}...`);
        setIsQuestLoading(true);
        setIsGoalLoading(true);

        try {
            const [questResult, goalResult] = await Promise.all([
                QuestService.getQuests(userId),
                RoadmapService.getGoals(userId) // Pass userId here
            ]);

            // Process Quests
            if (questResult.error) {
                console.error('[QuestGoalContext] Error fetching quests:', questResult.error.message);
                setQuests([]); // Clear quests on error
            } else {
                const fetchedQuests = questResult.data || [];
                // Need goals to map goal titles
                const fetchedGoals = goalResult.data || []; // Use goals fetched below
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

            // Process Goals
            if (goalResult.error) {
                console.error('[QuestGoalContext] Error fetching goals:', goalResult.error.message);
                setGoals([]); // Clear goals on error
            } else {
                setGoals(goalResult.data || []);
            }

        } catch (err: any) {
            console.error('[QuestGoalContext] Unexpected error fetching data:', err);
            setQuests([]);
            setGoals([]);
        } finally {
            setIsQuestLoading(false);
            setIsGoalLoading(false);
        }
    }, [userId]);

    // Effect to fetch data when userId changes OR auth loading state changes
    useEffect(() => {
        if (!isAppReady) return;
        fetchData();
    }, [fetchData, isAppReady]); // fetchData dependency array now includes isAuthLoading

    // --- Quest Action Handlers (moved from UserContext) ---
    const handleCompleteQuest = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot complete quest: User/Profile missing."); return; }
        
        // Assume QuestService.completeQuest now only takes userId and questId
        // and returns a simple success/error status.
        const { error: questCompleteError } = await QuestService.completeQuest(userId, id);

        if (questCompleteError) {
            console.error(`[QuestGoalContext] QuestService.completeQuest failed for ${id}:`, questCompleteError.message);
            return;
        }

        // Since QuestService doesn't return the updated quest directly,
        // we need to find the original quest details for stat increments, etc.
        const completedQuest = quests.find(q => q.id === id); // Get the quest from current state before re-fetch
        if (!completedQuest) {
            console.error(`[QuestGoalContext] Could not find completed quest ${id} in local state.`);
            await fetchData(); // Refresh data as a fallback
            return;
        }

        // Trigger side effects via UserContext handlers
        const disciplineAmount = completedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
        await handleIncrementDisciplineBonus(disciplineAmount);
        for (const increment of completedQuest.statIncrements) {
            if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
        }
        const newCount = (profile.completed_quests_count || 0) + 1;
        await updateUserProfile({ completed_quests_count: newCount });

        if (completedQuest.title) addQuestNotification('Completed', completedQuest.title);

        // Refresh all quest data to get the latest state including the completed quest
        await fetchData();

    }, [userId, profile, quests, stats, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, fetchData]);

    const handleSkipQuest = useCallback(async (id: string) => {
        if (!userId) { console.error("[QuestGoalContext] Cannot skip quest: User ID missing."); return; }
        
        // Assume QuestService.skipQuest takes userId and questId
        const { error } = await QuestService.skipQuest(userId, id);

        if (error) {
            console.error(`[QuestGoalContext] QuestService.skipQuest failed for ${id}:`, error.message);
            return;
        }
        const skippedQuest = quests.find(q => q.id === id);
        if (skippedQuest?.title) addQuestNotification('Skipped', skippedQuest.title);
        
        // Refresh data
        await fetchData();

    }, [userId, quests, addQuestNotification, fetchData]);

    const handleIncrementQuestProgress = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot increment quest progress: User/Profile missing."); return; }

        // Assume QuestService.incrementQuestProgress takes userId and questId
        // and returns { error, requiresStatUpdate (boolean to indicate if it was completed) }
        const { error, requiresStatUpdate } = await QuestService.incrementQuestProgress(userId, id);
        
        if (error) {
            console.error(`[QuestGoalContext] QuestService.incrementQuestProgress failed for ${id}:`, error.message);
            return;
        }

        if (requiresStatUpdate) {
            const updatedQuest = quests.find(q => q.id === id); // Quest should be in state, about to be completed
            if (!updatedQuest) {
                console.error(`[QuestGoalContext] Could not find quest ${id} for stat update post-increment.`);
                await fetchData(); // Refresh data as a fallback
                return;
            }
            const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
            await handleIncrementDisciplineBonus(disciplineAmount);
            for (const increment of updatedQuest.statIncrements) {
                if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
            }
            const newCount = (profile.completed_quests_count || 0) + 1;
            await updateUserProfile({ completed_quests_count: newCount });
            if (updatedQuest.title) addQuestNotification('Completed', updatedQuest.title);
        }
        
        // Refresh data
        await fetchData();

    }, [userId, profile, quests, stats, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, fetchData]);

    const handleDecrementQuestProgress = useCallback(async (id: string) => {
        if (!userId) { console.error("[QuestGoalContext] Cannot decrement quest progress: User ID missing."); return; }
        
        // Assume QuestService.decrementQuestProgress takes userId and questId
        const { error } = await QuestService.decrementQuestProgress(userId, id);

        if (error) {
            console.error(`[QuestGoalContext] QuestService.decrementQuestProgress failed for ${id}:`, error.message);
            return;
        }
        // Refresh data
        await fetchData();

    }, [userId, fetchData]);

    const handleSetQuestProgress = useCallback(async (id: string, count: number) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot set quest progress: User/Profile missing."); return; }
        
        // Assume QuestService.setQuestProgress takes userId, questId, and count
        // and returns { error, requiresStatUpdate }
        const { error, requiresStatUpdate } = await QuestService.setQuestProgress(userId, id, count);

        if (error) {
            console.error(`[QuestGoalContext] QuestService.setQuestProgress failed for ${id}:`, error.message);
            return;
        }

        if (requiresStatUpdate) {
             const updatedQuest = quests.find(q => q.id === id); // Quest should be in state, about to be completed
            if (!updatedQuest) {
                console.error(`[QuestGoalContext] Could not find quest ${id} for stat update post-set progress.`);
                await fetchData(); // Refresh data as a fallback
                return;
            }
            const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
            await handleIncrementDisciplineBonus(disciplineAmount);
            for (const increment of updatedQuest.statIncrements) {
                if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
            }
            const newCount = (profile.completed_quests_count || 0) + 1;
            await updateUserProfile({ completed_quests_count: newCount });
            if (updatedQuest.title) addQuestNotification('Completed', updatedQuest.title);
        }
        
        // Refresh data
        await fetchData();
        
    }, [userId, profile, quests, stats, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, fetchData]);

    const handleUndoQuestStatus = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot undo quest status: User/Profile missing."); return; }
        
        // Assume QuestService.undoQuestStatus takes userId and questId
        // and returns { error, requiresStatDecrement }
        const { error, requiresStatDecrement } = await QuestService.undoQuestStatus(userId, id);

        if (error) {
            console.error(`[QuestGoalContext] QuestService.undoQuestStatus failed for ${id}:`, error.message);
            return;
        }
        
        const originalQuestForDecrement = originalQuestStates[id]; // Get original for stat calculation
        if (requiresStatDecrement && originalQuestForDecrement) {
            if (originalQuestForDecrement.statIncrements) {
                const disciplineDecrementAmount = -(originalQuestForDecrement.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE);
                await handleIncrementDisciplineBonus(disciplineDecrementAmount);
                for (const increment of originalQuestForDecrement.statIncrements) {
                    if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, -increment.amount);
                }
                const newCount = Math.max(0, (profile.completed_quests_count || 0) - 1);
                await updateUserProfile({ completed_quests_count: newCount });
            } else {
                console.warn(`[QuestGoalContext] Original quest ${id} missing stat increments for undo.`);
            }
        } else if (requiresStatDecrement) {
             console.warn(`[QuestGoalContext] Could not find original state for quest ${id} to calc stat decrement during undo.`);
        }
        
        const undoneQuest = originalQuestStates[id]; // Get from original state for notification title
        if (undoneQuest?.title) addQuestNotification('Undone', undoneQuest.title);

        // Refresh data
        await fetchData();

    }, [userId, profile, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, fetchData]);

    // --- Combined Refresh Function ---
    const handleRefreshQuestGoalData = useCallback(async () => {
        console.log("[QuestGoalContext] Refresh triggered.");
        await fetchData(); // Re-run the main data fetching logic
    }, [fetchData]);

    // --- Context Value ---
    const value = useMemo(() => ({
        quests,
        goals,
        originalQuestStates,
        isQuestLoading,
        isGoalLoading,
        completeQuest: handleCompleteQuest,
        skipQuest: handleSkipQuest,
        incrementQuestProgress: handleIncrementQuestProgress,
        decrementQuestProgress: handleDecrementQuestProgress,
        setQuestProgress: handleSetQuestProgress,
        undoQuestStatus: handleUndoQuestStatus,
        refreshQuestGoalData: handleRefreshQuestGoalData,
    }), [
        quests, goals, originalQuestStates, isQuestLoading, isGoalLoading,
        handleCompleteQuest, handleSkipQuest, handleIncrementQuestProgress,
        handleDecrementQuestProgress, handleSetQuestProgress, handleUndoQuestStatus,
        handleRefreshQuestGoalData
    ]);

    return <QuestGoalContext.Provider value={value}>{children}</QuestGoalContext.Provider>;
}

// Custom hook to use the QuestGoalContext
export function useQuestGoals() {
    const context = useContext(QuestGoalContext);
    if (context === undefined) {
        throw new Error('useQuestGoals must be used within a QuestGoalProvider');
    }
    return context;
} 