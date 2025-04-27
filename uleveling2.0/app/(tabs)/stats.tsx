import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import LevelHeader from '@/components/stats/LevelHeader';
import StatGrid from '@/components/stats/StatGrid';
import { mockStats } from '@/mock/statsData';
import { verticalScale as vScale } from '@/constants/scaling';

export default function StatsTab() {
  return (
    // <SoloPopup> // Removed for now
    <>
      <ScrollView
        contentContainerStyle={styles.c}
        horizontal={false}
        alwaysBounceHorizontal={false}
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled
      >
        <LevelHeader level={99} title="Shadow Monarch" />
        <StatGrid data={mockStats} />
      </ScrollView>
    </>
    // </SoloPopup> // Removed for now
  );
}

const styles = StyleSheet.create({ c: { paddingBottom: vScale(120), flexGrow: 1 } }); // Added flexGrow 