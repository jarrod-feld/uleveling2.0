import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import AchievementCard from '@/components/achievements/AchievementCard';
import { mockAchievements } from '@/mock/achievementsData';
import { verticalScale as vScale } from '@/constants/scaling'; // Import scaling

// Define Achievement type if not already globally defined
interface Achievement {
  id: string;
  title: string;
}

export default function AchievementsTab() {
  return (
    // <SoloPopup> // Removed for now
    <>
      <ScrollView
        contentContainerStyle={styles.body}
        horizontal={false}
        alwaysBounceHorizontal={false}
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled
      >
        {mockAchievements.map((a: Achievement) => <AchievementCard key={a.id} data={a} />)}
      </ScrollView>
    </>
    // </SoloPopup> // Removed for now
  );
}
const styles = StyleSheet.create({ body: { paddingBottom: vScale(120), flexGrow: 1 } }); // Added flexGrow 