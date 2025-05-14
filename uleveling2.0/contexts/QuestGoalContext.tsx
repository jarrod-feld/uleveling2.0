import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import QuestService from '@/services/QuestService';
import RoadmapService from '@/services/RoadmapService';
import { Quest } from '@/mock/dashboardData';
import { Goal } from '@/mock/roadmapData';
import { useAuth } from './UserContext'; // Import useAuth to access user, profile, stats, and update functions
import { useNotificationContext } from './NotificationContext'; // Import notification context
import CacheService from '@/services/CacheService'; // Import CacheService

// Define stat increment amount centrally
const DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE = 1;
const QUEST_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days for quest cache

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
    const fetchData = useCallback(async (forceRefreshCache: boolean = false) => {
        if (!userId) {
            console.log(`[QuestGoalContext] Skipping fetch: No user ID available yet.`);
            // If no user, ensure loading states are false if they were true
            setIsQuestLoading(false);
            setIsGoalLoading(false);
            return;
        }
        
        console.log(`[QuestGoalContext] Fetching quests and goals for user ${userId} (forceRefreshCache: ${forceRefreshCache})...`);
        
        // Only set isQuestLoading to true if it's an initial load (not a forced refresh)
        if (!forceRefreshCache) {
            setIsQuestLoading(true);
        }
        // isGoalLoading can still be set true for both initial and refresh if goals are also refreshed.
        // For now, assuming refreshQuestGoalData is primarily for quests.
        // If goals also need a separate refresh loading indicator, that can be added.
        setIsGoalLoading(true); // Let's assume goals are always re-fetched or checked on refresh for simplicity here

        try {
            const [questResult, goalResult] = await Promise.all([
                QuestService.getQuests(userId, forceRefreshCache), // Pass forceRefreshCache to QuestService
                RoadmapService.getGoals(userId) // RoadmapService.getGoals also uses cache, pass forceRefreshCache if desired
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
        if (!isAppReady || !userId) return; // Ensure app is ready and userId exists
        fetchData(); // Initial fetch does not force cache refresh
    }, [fetchData, isAppReady, userId]);

    // --- Quest Action Handlers (moved from UserContext) ---
    const handleCompleteQuest = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot complete quest: User/Profile missing."); return; }

        const originalQuestsForRollback = [...quests];
        const questToComplete = quests.find(q => q.id === id);
        if (!questToComplete) {
            console.error(`[QuestGoalContext] Could not find quest ${id} to complete.`);
            return;
        }

        const optimisticallyCompletedQuest: QuestWithGoalTitle = { 
            ...questToComplete, 
            status: 'completed', 
            completedAt: new Date() 
        };
        const newQuestsOptimistic = quests.map(q => q.id === id ? optimisticallyCompletedQuest : q);
        setQuests(newQuestsOptimistic);
        await CacheService.set(`quests_${userId}`, newQuestsOptimistic, QUEST_CACHE_TTL);

        try {
            const { error: questCompleteError } = await QuestService.completeQuest(userId, id);
            if (questCompleteError) {
                console.error(`[QuestGoalContext] QuestService.completeQuest failed for ${id}:`, questCompleteError.message);
                setQuests(originalQuestsForRollback); 
                await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL); 
                return;
            }

            const disciplineAmount = questToComplete.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
            await handleIncrementDisciplineBonus(disciplineAmount);
            for (const increment of questToComplete.statIncrements) {
                if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
            }
            const newCount = (profile.completed_quests_count || 0) + 1;
            await updateUserProfile({ completed_quests_count: newCount });
            if (questToComplete.title) addQuestNotification('Completed', questToComplete.title);
        } catch (serviceError) { 
            console.error(`[QuestGoalContext] Unexpected error during completeQuest side effects for ${id}:`, serviceError);
            setQuests(originalQuestsForRollback); 
            await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL); 
        }
    }, [userId, profile, quests, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, QUEST_CACHE_TTL]);

    const handleSkipQuest = useCallback(async (id: string) => {
        if (!userId) { console.error("[QuestGoalContext] Cannot skip quest: User ID missing."); return; }
        
        const originalQuestsForRollback = [...quests];
        const questToSkip = quests.find(q => q.id === id);
        if (!questToSkip) {
            console.error(`[QuestGoalContext] Could not find quest ${id} to skip.`);
            return;
        }

        const optimisticallySkippedQuest: QuestWithGoalTitle = { ...questToSkip, status: 'skipped' };
        const newQuestsOptimistic = quests.map(q => q.id === id ? optimisticallySkippedQuest : q);
        setQuests(newQuestsOptimistic);
        await CacheService.set(`quests_${userId}`, newQuestsOptimistic, QUEST_CACHE_TTL);

        try {
            const { error } = await QuestService.skipQuest(userId, id);
            if (error) {
                console.error(`[QuestGoalContext] QuestService.skipQuest failed for ${id}:`, error.message);
                setQuests(originalQuestsForRollback);
                await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
                return;
            }
            if (questToSkip.title) addQuestNotification('Skipped', questToSkip.title);
        } catch (serviceError) {
            console.error(`[QuestGoalContext] Unexpected error during skipQuest for ${id}:`, serviceError);
            setQuests(originalQuestsForRollback);
            await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
        }
    }, [userId, quests, addQuestNotification, QUEST_CACHE_TTL]);

    const handleIncrementQuestProgress = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot increment quest progress: User/Profile missing."); return; }

        const originalQuestsForRollback = [...quests];
        const questToIncrement = quests.find(q => q.id === id);
        if (!questToIncrement || questToIncrement.status !== 'active') {
            console.error(`[QuestGoalContext] Quest ${id} not found or not active for increment.`);
            return;
        }

        const newCurrentProgress = Math.min(questToIncrement.progress.total, questToIncrement.progress.current + 1);
        const isNowCompleted = newCurrentProgress === questToIncrement.progress.total;

        const optimisticallyUpdatedQuest: QuestWithGoalTitle = {
            ...questToIncrement,
            progress: { ...questToIncrement.progress, current: newCurrentProgress },
            status: isNowCompleted ? 'completed' : 'active',
            completedAt: isNowCompleted ? new Date() : undefined,
        };
        const newQuestsOptimistic = quests.map(q => q.id === id ? optimisticallyUpdatedQuest : q);
        setQuests(newQuestsOptimistic);
        await CacheService.set(`quests_${userId}`, newQuestsOptimistic, QUEST_CACHE_TTL);

        try {
            const { error, requiresStatUpdate } = await QuestService.incrementQuestProgress(userId, id);
            if (error) {
                console.error(`[QuestGoalContext] QuestService.incrementQuestProgress failed for ${id}:`, error.message);
                setQuests(originalQuestsForRollback);
                await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
                return;
            }

            if (requiresStatUpdate) { 
                const disciplineAmount = questToIncrement.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
                await handleIncrementDisciplineBonus(disciplineAmount);
                for (const increment of questToIncrement.statIncrements) {
                    if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
                }
                const newCount = (profile.completed_quests_count || 0) + 1;
                await updateUserProfile({ completed_quests_count: newCount });
                if (questToIncrement.title) addQuestNotification('Completed', questToIncrement.title);
            }
        } catch (serviceError) {
            console.error(`[QuestGoalContext] Unexpected error during incrementQuestProgress for ${id}:`, serviceError);
            setQuests(originalQuestsForRollback);
            await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
        }
    }, [userId, profile, quests, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, QUEST_CACHE_TTL]);

    const handleDecrementQuestProgress = useCallback(async (id: string) => {
        if (!userId) { console.error("[QuestGoalContext] Cannot decrement quest progress: User ID missing."); return; }
        
        const originalQuestsForRollback = [...quests];
        const questToDecrement = quests.find(q => q.id === id);
        if (!questToDecrement || questToDecrement.status !== 'active') {
            console.error(`[QuestGoalContext] Quest ${id} not found or not active for decrement.`);
            return;
        }

        const newCurrentProgress = Math.max(0, questToDecrement.progress.current - 1);
        const optimisticallyUpdatedQuest: QuestWithGoalTitle = {
            ...questToDecrement,
            progress: { ...questToDecrement.progress, current: newCurrentProgress },
        };
        const newQuestsOptimistic = quests.map(q => q.id === id ? optimisticallyUpdatedQuest : q);
        setQuests(newQuestsOptimistic);
        await CacheService.set(`quests_${userId}`, newQuestsOptimistic, QUEST_CACHE_TTL);

        try {
            const { error } = await QuestService.decrementQuestProgress(userId, id);
            if (error) {
                console.error(`[QuestGoalContext] QuestService.decrementQuestProgress failed for ${id}:`, error.message);
                setQuests(originalQuestsForRollback);
                await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
                return;
            }
        } catch (serviceError) {
            console.error(`[QuestGoalContext] Unexpected error during decrementQuestProgress for ${id}:`, serviceError);
            setQuests(originalQuestsForRollback);
            await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
        }
    }, [userId, quests, QUEST_CACHE_TTL]);

    const handleSetQuestProgress = useCallback(async (id: string, count: number) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot set quest progress: User/Profile missing."); return; }
        
        const originalQuestsForRollback = [...quests];
        const questToSet = quests.find(q => q.id === id);
        if (!questToSet || questToSet.status !== 'active') {
            console.error(`[QuestGoalContext] Quest ${id} not found or not active for set progress.`);
            return;
        }

        const newCurrentProgress = Math.max(0, Math.min(questToSet.progress.total, count));
        const isNowCompleted = newCurrentProgress === questToSet.progress.total;

        const optimisticallyUpdatedQuest: QuestWithGoalTitle = {
            ...questToSet,
            progress: { ...questToSet.progress, current: newCurrentProgress },
            status: isNowCompleted ? 'completed' : 'active',
            completedAt: isNowCompleted ? new Date() : undefined,
        };
        const newQuestsOptimistic = quests.map(q => q.id === id ? optimisticallyUpdatedQuest : q);
        setQuests(newQuestsOptimistic);
        await CacheService.set(`quests_${userId}`, newQuestsOptimistic, QUEST_CACHE_TTL);

        try {
            const { error, requiresStatUpdate } = await QuestService.setQuestProgress(userId, id, count); 
            if (error) {
                console.error(`[QuestGoalContext] QuestService.setQuestProgress failed for ${id}:`, error.message);
                setQuests(originalQuestsForRollback);
                await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
                return;
            }

            if (requiresStatUpdate) {
                 const disciplineAmount = questToSet.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
                await handleIncrementDisciplineBonus(disciplineAmount);
                for (const increment of questToSet.statIncrements) {
                    if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
                }
                const newCount = (profile.completed_quests_count || 0) + 1;
                await updateUserProfile({ completed_quests_count: newCount });
                if (questToSet.title) addQuestNotification('Completed', questToSet.title);
            }
        } catch (serviceError) {
            console.error(`[QuestGoalContext] Unexpected error during setQuestProgress for ${id}:`, serviceError);
            setQuests(originalQuestsForRollback);
            await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
        }
    }, [userId, profile, quests, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, QUEST_CACHE_TTL]);

    const handleUndoQuestStatus = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot undo quest status: User/Profile missing."); return; }

        const originalQuestsForRollback = [...quests];
        const questToUndo = quests.find(q => q.id === id);
        if (!questToUndo) {
            console.error(`[QuestGoalContext] Could not find quest ${id} to undo.`);
            return;
        }

        const optimisticallyUndoneQuest: QuestWithGoalTitle = {
            ...questToUndo,
            status: 'active',
            completedAt: undefined,
        };
        const newQuestsOptimistic = quests.map(q =>
            q.id === id ? optimisticallyUndoneQuest : q
        );
        setQuests(newQuestsOptimistic);
        await CacheService.set(`quests_${userId}`, newQuestsOptimistic, QUEST_CACHE_TTL);

        try {
            const { error: undoServiceError, requiresStatDecrement } = await QuestService.undoQuestStatus(userId, id);
            if (undoServiceError) {
                console.error(`[QuestGoalContext] QuestService.undoQuestStatus failed for ${id}:`, undoServiceError.message);
                setQuests(originalQuestsForRollback);
                await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
                return;
            }

            const originalQuestForDecrement = originalQuestStates[id]; 
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
                 console.warn(`[QuestGoalContext] Could not find original state for quest ${id} for stat decrement during undo.`);
            }
            
            const undoneQuestTitleForNotification = questToUndo.title; 
            if (undoneQuestTitleForNotification) addQuestNotification('Undone', undoneQuestTitleForNotification);
        } catch (serviceAndSideEffectError) { 
            console.error(`[QuestGoalContext] Unexpected error during undoQuestStatus for ${id}:`, serviceAndSideEffectError);
            setQuests(originalQuestsForRollback);
            await CacheService.set(`quests_${userId}`, originalQuestsForRollback, QUEST_CACHE_TTL);
        }
    }, [userId, profile, quests, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, updateUserProfile, QUEST_CACHE_TTL]);

    // --- Combined Refresh Function ---
    const handleRefreshQuestGoalData = useCallback(async () => {
        console.log("[QuestGoalContext] Refresh triggered.");
        await fetchData(true); // Re-run the main data fetching logic, forcing cache refresh for quests
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