import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import LevelHeader from '@/components/stats/LevelHeader';
import StatGrid from '@/components/stats/StatGrid';
// import { mockStats } from '@/mock/statsData'; // Use stats from context
import { verticalScale as vScale, scale as s, moderateScale as ms } from '@/constants/scaling';
import { useAuth } from '@/contexts/UserContext'; // Import useAuth hook
import { Stat } from '@/mock/statsData'; // Keep Stat type if needed

const FONT_FAMILY = 'PressStart2P'; // Define font family

export default function StatsTab() {
  const { profile, stats, isLoading } = useAuth(); // Get data from context

  // Handle loading state
  if (isLoading || !profile || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Convert UserStats map back to an array for StatGrid
  const statsArray: Stat[] = Object.values(stats);

  return (
    // <SoloPopup> // Removed for now
    <View style={styles.container}>
      {/* Pass dynamic data to LevelHeader */}
      <LevelHeader
        level={profile.level}
        username={profile.name}
        title={profile.title?.name ?? 'No Title'} // Use fetched title name
      />

      {/* Description Text */}
      <Text style={styles.descriptionText}>
        Complete daily quests to increase your skills. Staying consistent will increase your discipline stat.
      </Text>

      {/* Pass dynamic data to StatGrid */}
      <StatGrid data={statsArray} />
    </View>
    // </SoloPopup> // Removed for now
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: vScale(20), // Reduced paddingBottom as no scroll space needed
    flexGrow: 1,
    backgroundColor: '#0a192f', // Dark blue background matching image
    paddingHorizontal: s(10), // Add some horizontal padding
    paddingTop: vScale(20) // Add paddingTop to avoid content sticking to the top status bar/notch
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a192f', // Match background
  },
  descriptionText: {
    fontFamily: FONT_FAMILY, // Use PressStart2P font
    fontSize: ms(10), // Adjust font size as needed
    color: '#ccd6f6', // Light text color
    textAlign: 'center', // Center align text
    marginHorizontal: s(20),
    marginTop: vScale(20),
    lineHeight: ms(15), // Adjust line height for readability
    // Add text shadow for subtle glow
    textShadowColor: 'rgba(100, 255, 218, 0.5)', // Aqua glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
}); // Added flexGrow 