import React, { useState, useEffect, useCallback } from 'react';
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
  const { user, isLoading: isAuthLoading } = useAuth(); // Get user and auth loading status
  const userId = user?.id;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatCategory>('ALL'); 
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGoals = useCallback(async (id: string) => {
    console.log(`[RoadmapTab] Fetching goals for user: ${id}`);
    setIsLoadingGoals(true);
    setError(null);
    try {
      const { data: fetchedGoals, error: fetchError } = await RoadmapService.getGoals(id);
      if (fetchError) throw fetchError;
      setGoals(fetchedGoals || []);
      console.log(`[RoadmapTab] Fetched ${fetchedGoals?.length || 0} goals.`);
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
    if (userId) {
      fetchGoals(userId);
    } else if (!isAuthLoading) {
      // If auth is not loading and there's still no userId, handle appropriately
      setError("User not found. Cannot load goals.");
      setGoals([]);
    }
    // Dependency: Trigger fetch when userId becomes available or changes, or when auth loading finishes
  }, [userId, isAuthLoading, fetchGoals]);

  const onRefresh = useCallback(() => {
    if (userId) {
      setIsRefreshing(true);
      fetchGoals(userId);
    }
  }, [userId, fetchGoals]);

  const filteredGoals = filter === 'ALL'
    ? goals
    : goals.filter((g: Goal) => g.category === filter);

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

  // --- Loading and Error States ---
  if (isLoadingGoals && !isRefreshing) { // Show full screen loader only on initial load
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Roadmap...</Text>
      </View>
    );
  }

  if (error && !isRefreshing) { // Show error only if not refreshing
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        {/* Optionally add a retry button */}
      </View>
    );
  }
  // --------------------------------

  return (
    // Use a View wrapper if needed, or SafeAreaView
    <View style={styles.container}> 
      {/* Remove filter props from ProgressHeader */}
      <ProgressHeader /> 
      {/* Add the new CategoryFilterNav */}
      <CategoryFilterNav filter={filter} onChange={setFilter} />
      <ScrollView
        contentContainerStyle={styles.body}
        alwaysBounceVertical={false} // Prefer this over alwaysBounceHorizontal={false}
        showsVerticalScrollIndicator={false} // Use vertical indicator
        directionalLockEnabled
        refreshControl={ // Add pull-to-refresh
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff" // Color of the spinner
          />
        }
      >
        {filteredGoals.length === 0 && !isLoadingGoals && (
          <Text style={styles.emptyText}>
            {filter === 'ALL' ? "No goals found. Complete onboarding to generate your roadmap!" : `No goals found for category: ${filter}`}
          </Text>
        )}
        {filteredGoals.map((g: Goal) => (
          <GoalRow key={g.id} goal={g} onPress={handleGoalPress} /> // Pass onPress handler
        ))}
      </ScrollView>

      {/* Render the popup */}
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
    flex: 1, // Ensure container takes full height
    backgroundColor: '#002A35', // Assuming this is the background color
  },
  centered: { // Style for loading/error states
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: vScale(10),
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b', // Red color for errors
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#a8b2d1', // Lighter text for empty state
    fontSize: 14,
    textAlign: 'center',
    marginTop: vScale(40),
    paddingHorizontal: 20,
  },
  body: { 
    paddingHorizontal: vScale(20), // Add horizontal padding consistent with nav
    paddingBottom: vScale(120), 
    flexGrow: 1 
  } 
}); 