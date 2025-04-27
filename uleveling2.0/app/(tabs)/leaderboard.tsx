import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import LeaderRow from '@/components/leaderboard/LeaderRow';
import { mockLeaderboard } from '@/mock/leaderboardData';
import { verticalScale as vScale } from '@/constants/scaling'; // Import scaling

// Define User type if not already globally defined
interface User {
  id: string;
  name: string;
  score: number;
}

export default function LeaderboardTab() {
  return (
    // <SoloPopup> // Removed for now
    <>
      <ScrollView
        contentContainerStyle={styles.c} // Note: Style key is 'c' here
        horizontal={false}
        alwaysBounceHorizontal={false}
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled
      >
        {mockLeaderboard.map((u: User) => <LeaderRow key={u.id} user={u} />)}
      </ScrollView>
    </>
    // </SoloPopup> // Removed for now
  );
}
const styles = StyleSheet.create({ c: { paddingBottom: vScale(120), flexGrow: 1 } }); // Added flexGrow 