import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import QuestService from '@/services/QuestService';
import RoadmapService from '@/services/RoadmapService';
import { Quest } from '@/mock/dashboardData';
import { Goal } from '@/mock/roadmapData';
import { useAuth } from './UserContext'; // Import useAuth to access user, profile, stats, and update functions
import { useNotificationContext } from './NotificationContext'; // Import notification context

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
}

export function QuestGoalProvider({ children }: QuestGoalProviderProps) {
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
        handleUpdateUserProfile 
    } = useAuth(); // Get needed items from UserContext
    const { addQuestNotification } = useNotificationContext(); // Get notifications

    const userId = user?.id; // Get userId, will be null/undefined if not logged in

    // --- Data Fetching Logic ---
    const fetchData = useCallback(async () => {
        // Check for auth loading state IN ADDITION to userId
        if (!userId || isAuthLoading) {
            console.log(`[QuestGoalContext] Skipping fetch: User ID is ${userId ? 'present' : 'missing'}, Auth Loading is ${isAuthLoading}. Clearing data.`);
            setQuests([]);
            setGoals([]);
            setOriginalQuestStates({});
            setIsQuestLoading(false);
            setIsGoalLoading(false);
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
    }, [userId, isAuthLoading]); // <-- Add isAuthLoading to dependency array

    // Effect to fetch data when userId changes OR auth loading state changes
    useEffect(() => {
        fetchData();
    }, [fetchData]); // fetchData dependency array now includes isAuthLoading

    // --- Quest Action Handlers (moved from UserContext) ---
    const handleCompleteQuest = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot complete quest: User/Profile missing."); return; }
        const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);
        const { updatedQuest, updatedOriginalStates, error: questCompleteError } = await QuestService.completeQuest(
            userId, id, baseQuests, originalQuestStates
        );
        if (questCompleteError || !updatedQuest) {
            console.error(`[QuestGoalContext] QuestService.completeQuest failed for ${id}:`, questCompleteError?.message);
            return;
        }
        // Update local quest states
        setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
        const updatedOriginalStatesWithTitle: Record<string, QuestWithGoalTitle> = {};
        for (const questId in updatedOriginalStates) {
            const originalQuest = updatedOriginalStates[questId];
            const currentQuest = quests.find(q => q.id === questId);
            updatedOriginalStatesWithTitle[questId] = { ...originalQuest, goalTitle: currentQuest?.goalTitle ?? null };
        }
        setOriginalQuestStates(updatedOriginalStatesWithTitle);

        // Trigger side effects via UserContext handlers
        const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
        await handleIncrementDisciplineBonus(disciplineAmount);
        for (const increment of updatedQuest.statIncrements) {
            if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
        }
        const newCount = (profile.completed_quests_count || 0) + 1;
        await handleUpdateUserProfile({ completed_quests_count: newCount });

        if (updatedQuest.title) addQuestNotification('Completed', updatedQuest.title);

    }, [userId, profile, quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, handleUpdateUserProfile]);

    const handleSkipQuest = useCallback(async (id: string) => {
        if (!userId) { console.error("[QuestGoalContext] Cannot skip quest: User ID missing."); return; }
        const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);
        const { updatedQuest, updatedOriginalStates, error } = await QuestService.skipQuest(
            userId, id, baseQuests, originalQuestStates
        );
        if (error || !updatedQuest) {
            console.error(`[QuestGoalContext] QuestService.skipQuest failed for ${id}:`, error?.message);
            return;
        }
        setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
        const updatedOriginalStatesWithTitle_Skip: Record<string, QuestWithGoalTitle> = {};
        for (const questId in updatedOriginalStates) {
            const originalQuest = updatedOriginalStates[questId];
            const currentQuest = quests.find(q => q.id === questId);
            updatedOriginalStatesWithTitle_Skip[questId] = { ...originalQuest, goalTitle: currentQuest?.goalTitle ?? null };
        }
        setOriginalQuestStates(updatedOriginalStatesWithTitle_Skip);
        if (updatedQuest.title) addQuestNotification('Skipped', updatedQuest.title);
    }, [userId, quests, originalQuestStates, addQuestNotification]);

    const handleIncrementQuestProgress = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot increment quest progress: User/Profile missing."); return; }
        const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);
        const { updatedQuest, updatedOriginalStates, requiresStatUpdate, error } = await QuestService.incrementQuestProgress(
            userId, id, baseQuests, originalQuestStates
        );
        if (error || !updatedQuest) {
            console.error(`[QuestGoalContext] QuestService.incrementQuestProgress failed for ${id}:`, error?.message);
            return;
        }
        setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
        const updatedOriginalStatesWithTitle_Inc: Record<string, QuestWithGoalTitle> = {};
        for (const questId in updatedOriginalStates) {
            const originalQuest = updatedOriginalStates[questId];
            const currentQuest = quests.find(q => q.id === questId);
            updatedOriginalStatesWithTitle_Inc[questId] = { ...originalQuest, goalTitle: currentQuest?.goalTitle ?? null };
        }
        setOriginalQuestStates(updatedOriginalStatesWithTitle_Inc);

        if (requiresStatUpdate) {
            const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
            await handleIncrementDisciplineBonus(disciplineAmount);
            for (const increment of updatedQuest.statIncrements) {
                if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
            }
            const newCount = (profile.completed_quests_count || 0) + 1;
            await handleUpdateUserProfile({ completed_quests_count: newCount });
            if (updatedQuest.title) addQuestNotification('Completed', updatedQuest.title);
        }
    }, [userId, profile, quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, handleUpdateUserProfile]);

    const handleDecrementQuestProgress = useCallback(async (id: string) => {
        if (!userId) { console.error("[QuestGoalContext] Cannot decrement quest progress: User ID missing."); return; }
        const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);
        const { updatedQuest, error } = await QuestService.decrementQuestProgress(userId, id, baseQuests);
        if (error || !updatedQuest) {
            console.error(`[QuestGoalContext] QuestService.decrementQuestProgress failed for ${id}:`, error?.message);
            return;
        }
        setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
    }, [userId, quests]);

    const handleSetQuestProgress = useCallback(async (id: string, count: number) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot set quest progress: User/Profile missing."); return; }
        const baseQuests = quests.map(({ goalTitle, ...rest }) => rest);
        const { updatedQuest, updatedOriginalStates, requiresStatUpdate, error } = await QuestService.setQuestProgress(
            userId, id, count, baseQuests, originalQuestStates
        );
        if (error || !updatedQuest) {
            console.error(`[QuestGoalContext] QuestService.setQuestProgress failed for ${id}:`, error?.message);
            return;
        }
        setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: q.goalTitle } : q));
        const updatedOriginalStatesWithTitle_Set: Record<string, QuestWithGoalTitle> = {};
        for (const questId in updatedOriginalStates) {
            const originalQuest = updatedOriginalStates[questId];
            const currentQuest = quests.find(q => q.id === questId);
            updatedOriginalStatesWithTitle_Set[questId] = { ...originalQuest, goalTitle: currentQuest?.goalTitle ?? null };
        }
        setOriginalQuestStates(updatedOriginalStatesWithTitle_Set);

        if (requiresStatUpdate) {
            const disciplineAmount = updatedQuest.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE;
            await handleIncrementDisciplineBonus(disciplineAmount);
            for (const increment of updatedQuest.statIncrements) {
                if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, increment.amount);
            }
            const newCount = (profile.completed_quests_count || 0) + 1;
            await handleUpdateUserProfile({ completed_quests_count: newCount });
            if (updatedQuest.title) addQuestNotification('Completed', updatedQuest.title);
        }
    }, [userId, profile, quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, handleUpdateUserProfile]);

    const handleUndoQuestStatus = useCallback(async (id: string) => {
        if (!userId || !profile) { console.error("[QuestGoalContext] Cannot undo quest status: User/Profile missing."); return; }
        const { updatedQuest, requiresStatDecrement, error } = await QuestService.undoQuestStatus(
            userId, id, originalQuestStates
        );
        if (error || !updatedQuest) {
            console.error(`[QuestGoalContext] QuestService.undoQuestStatus failed for ${id}:`, error?.message);
            return;
        }
        const currentQuest = quests.find(q => q.id === id);
        const goalTitleToKeep = currentQuest ? currentQuest.goalTitle : null;
        setQuests(prevQuests => prevQuests.map(q => q.id === id ? { ...updatedQuest, goalTitle: goalTitleToKeep } : q));

        if (requiresStatDecrement) {
            const originalQuestForDecrement = originalQuestStates[id];
            if (originalQuestForDecrement && originalQuestForDecrement.statIncrements) {
                const disciplineDecrementAmount = -(originalQuestForDecrement.disciplineIncrementAmount ?? DEFAULT_STAT_INCREMENT_ON_QUEST_COMPLETE);
                await handleIncrementDisciplineBonus(disciplineDecrementAmount);
                for (const increment of originalQuestForDecrement.statIncrements) {
                    if (increment.category !== 'DIS') await handleIncrementStatBonus(increment.category, -increment.amount);
                }
                const newCount = Math.max(0, (profile.completed_quests_count || 0) - 1);
                await handleUpdateUserProfile({ completed_quests_count: newCount });
            } else {
                console.warn(`[QuestGoalContext] Could not find original state for quest ${id} to calc stat decrement.`);
            }
        }
        if (updatedQuest.title) addQuestNotification('Undone', updatedQuest.title);
    }, [userId, profile, quests, stats, originalQuestStates, handleIncrementDisciplineBonus, handleIncrementStatBonus, addQuestNotification, handleUpdateUserProfile]);

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