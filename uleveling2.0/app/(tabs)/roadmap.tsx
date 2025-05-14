import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import ProgressHeader from '@/components/roadmap/ProgressHeader';
import GoalRow from '@/components/roadmap/GoalRow';
import CategoryFilterNav, { StatCategory } from '@/components/roadmap/CategoryFilterNav'; // Import new component and type
import { Goal } from '@/mock/roadmapData'; // Keep Goal type import
import { verticalScale as vScale } from '@/constants/scaling'; // Import scaling
import GoalDetailPopup from '@/components/roadmap/GoalDetailPopup'; // Import the new popup component
import { useAuth } from '@/contexts/UserContext'; // Import useAuth
import RoadmapService from '@/services/RoadmapService'; // Import RoadmapService

export default function RoadmapTab() {
  console.log("[RoadmapTab] Component rendered/re-rendered.");
  const { user, isLoading: isAuthLoading } = useAuth(); // Get user and auth loading status
  const userId = user?.id;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(false); // Default to true initially to show loader
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatCategory>('ALL'); 
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGoals = useCallback(async (id: string) => {
    console.log(`[RoadmapTab] fetchGoals called for user: ${id}`);
    setIsLoadingGoals(true);
    setError(null);
    try {
      const { data: fetchedGoals, error: fetchError } = await RoadmapService.getGoals(id);
      console.log("[RoadmapTab] fetchGoals - RoadmapService.getGoals response:", { fetchedGoals, fetchError });
      if (fetchError) throw fetchError;
      setGoals(fetchedGoals || []);
      console.log(`[RoadmapTab] fetchGoals - goals state updated with ${fetchedGoals?.length || 0} goals.`);
    } catch (err: any) {
      console.error("[RoadmapTab] Error fetching goals:", err);
      setError("Failed to load roadmap goals. Please try again.");
      setGoals([]); // Clear goals on error
    } finally {
      setIsLoadingGoals(false);
      setIsRefreshing(false); // Ensure refreshing indicator stops
    }
  }, []);

  useEffect(() => {
    console.log(`[RoadmapTab] useEffect for userId/isAuthLoading triggered. userId: ${userId}, isAuthLoading: ${isAuthLoading}`);
    if (userId) {
      console.log(`[RoadmapTab] useEffect: userId is present (${userId}), calling fetchGoals.`);
      fetchGoals(userId);
    } else if (!isAuthLoading && !userId) {
      console.log("[RoadmapTab] useEffect: Auth is not loading and no userId. Setting error.");
      setError("User not found. Cannot load goals.");
      setGoals([]);
      setIsLoadingGoals(false); // Ensure loader stops if no user
    }
    // Dependency: Trigger fetch when userId becomes available or changes, or when auth loading finishes
  }, [userId, isAuthLoading, fetchGoals]);

  const onRefresh = useCallback(() => {
    if (userId) {
      console.log("[RoadmapTab] onRefresh called.");
      setIsRefreshing(true);
      fetchGoals(userId);
    }
  }, [userId, fetchGoals]);

  const filteredGoals = useMemo(() => {
    const result = filter === 'ALL'
      ? goals
      : goals.filter((g: Goal) => g.category === filter);
    console.log("[RoadmapTab] Recalculated filteredGoals. Filter:", filter, "Original goals count:", goals.length, "Filtered count:", result.length);
    return result;
  }, [goals, filter]);

  const handleGoalPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsPopupVisible(true);
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  const handlePopupClosed = () => {
    setSelectedGoal(null);
  };

  console.log("[RoadmapTab] States before render - isLoadingGoals:", isLoadingGoals, "isRefreshing:", isRefreshing, "error:", error, "goals count:", goals.length, "filteredGoals count:", filteredGoals.length);

  // --- Loading and Error States ---
  if (isLoadingGoals && !isRefreshing) { 
    console.log("[RoadmapTab] Rendering: Full screen loading indicator.");
    return (
      <View style={[styles.container, styles.centered]}> {/* Removed temp bg */}
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Roadmap...</Text>
      </View>
    );
  }

  if (error && !isRefreshing && !isLoadingGoals) { 
    console.log("[RoadmapTab] Rendering: Error message.");
    return (
      <View style={[styles.container, styles.centered]}> {/* Removed temp bg */}
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  // --------------------------------
  console.log("[RoadmapTab] Rendering: Main content with goals list.");

  return (
    <View style={styles.container}> 
      <ProgressHeader /> 
      <CategoryFilterNav filter={filter} onChange={setFilter} />
      <ScrollView
        style={styles.scrollViewDebug} // Removed direct lime background
        contentContainerStyle={styles.body}
        alwaysBounceVertical={false} 
        showsVerticalScrollIndicator={false} 
        directionalLockEnabled
        refreshControl={ 
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff" 
          />
        }
      >
        {filteredGoals.length === 0 && !isLoadingGoals && (
          <Text style={styles.emptyText}>
            {filter === 'ALL' ? "No goals found. Complete onboarding to generate your roadmap!" : `No goals found for category: ${filter}`}
          </Text>
        )}
        {filteredGoals.map((g: Goal) => (
          <GoalRow key={g.id} goal={g} onPress={handleGoalPress} /> 
        ))}
      </ScrollView>

      <GoalDetailPopup
        visible={isPopupVisible}
        onClose={handleClosePopup}
        onClosed={handlePopupClosed}
        goal={selectedGoal}
      />
    </View>
    // </SoloPopup> // Removed for now
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#002A35', // Restored original background
  },
  centered: { 
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: vScale(10),
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#a8b2d1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: vScale(40),
    paddingHorizontal: 20,
  },
  scrollViewDebug: { 
    flex: 1, 
    // backgroundColor: 'lime', // Removed temp background
  },
  body: { // ScrollView contentContainerStyle
    paddingHorizontal: vScale(20), 
    paddingBottom: vScale(120), 
    flexGrow: 1, 
    // backgroundColor: 'orange', // Removed temp background
  } 
}); 