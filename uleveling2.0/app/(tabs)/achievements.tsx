import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import AchievementCard from '@/components/achievements/AchievementCard';
import { verticalScale as vScale, scale as s } from '@/constants/scaling'; // Import scaling
import { useAuth } from '@/contexts/UserContext'; // Import useAuth hook
import { achievements as achievementDefinitions } from '@/data/achievementsData'; // Import the definitions
import AchievementService from '@/services/AchievementService'; // For potential refresh

const FONT_FAMILY = 'PressStart2P';

// Define Achievement type if not already globally defined
interface Achievement {
  id: string;
  title: string;
}

export default function AchievementsTab() {
  const {
    user,
    profile,
    stats,
    achievementsStatus,
    claimAchievement,
    isLoading,
    // Need a way to refresh achievement status, ideally add to context
    // For now, simulate a manual refresh concept
  } = useAuth();

  // Simple state for pull-to-refresh simulation
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Combine definitions with status
  const combinedAchievements = React.useMemo(() => {
    return achievementDefinitions.map(def => {
      const status = achievementsStatus.find(s => s.id === def.id) || {
        id: def.id,
        isUnlocked: false,
        isClaimed: false,
        canClaim: false,
      };
      return { definition: def, status };
    });
  }, [achievementsStatus]); // Recompute when status changes

  // Handle claim action passed down to the card
  const handleClaim = useCallback(async (achievementId: string) => {
    try {
      await claimAchievement(achievementId);
      // Optionally show success feedback
    } catch (error: any) {
      console.error("Claim failed in UI:", error.message);
      // Optionally show error feedback
    }
  }, [claimAchievement]);

  // Simulate refresh by refetching status (ideally context handles this better)
  const onRefresh = useCallback(async () => {
    if (!user || !profile || !stats) return;
    setIsRefreshing(true);
    console.log("[AchievementsTab] Refreshing achievement status...");
    try {
      // This is inefficient - context should ideally expose a refresh function
      // that updates the achievementsStatus state internally.
      const { data: refreshedStatus } = await AchievementService.getAllAchievementsStatus(
        user.id,
        profile,
        stats,
        profile.completedQuestsCount
      );
      // Manually update state here - THIS IS NOT IDEAL
      // setAchievementsStatus(refreshedStatus || []); // Need setAchievementsStatus from context
      console.warn("[AchievementsTab] Cannot directly set context state from here. Status might be stale until next context update.");
    } catch (error) {
      console.error("Error refreshing achievements:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, profile, stats]);

  // Handle initial loading state
  if (isLoading && achievementsStatus.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    // <SoloPopup> // Removed for now
    <>
      <ScrollView
        contentContainerStyle={styles.body}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
            // Add pull-to-refresh (note: requires better refresh logic in context ideally)
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#64ffda" />
        }
      >
        {combinedAchievements.length === 0 ? (
          <Text style={styles.emptyText}>No achievements defined yet.</Text>
        ) : (
          combinedAchievements.map(({ definition, status }) => (
            <AchievementCard
              key={definition.id}
              definition={definition}
              status={status}
              onClaim={handleClaim}
            />
          ))
        )}
      </ScrollView>
    </>
    // </SoloPopup> // Removed for now
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: vScale(120),
    flexGrow: 1,
    backgroundColor: '#001a22', // Match other tabs
    paddingTop: vScale(20), // Add top padding
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001a22',
  },
  emptyText: {
      fontFamily: FONT_FAMILY,
      color: '#a8b2d1',
      fontSize: s(12),
      textAlign: 'center',
      marginTop: vScale(50),
  }
}); 