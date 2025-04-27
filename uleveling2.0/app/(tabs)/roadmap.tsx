import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import ProgressHeader from '@/components/roadmap/ProgressHeader';
import GoalRow from '@/components/roadmap/GoalRow';
import CategoryFilterNav, { StatCategory } from '@/components/roadmap/CategoryFilterNav'; // Import new component and type
import { mockGoals, Goal } from '@/mock/roadmapData'; // Import Goal type
import { verticalScale as vScale } from '@/constants/scaling'; // Import scaling

export default function RoadmapTab() {
  // Update state to use the new StatCategory type
  const [filter, setFilter] = useState<StatCategory>('ALL'); 

  // Update filtering logic
  const data = filter === 'ALL' 
    ? mockGoals 
    : mockGoals.filter((g: Goal) => g.category === filter);

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
      >
        {data.map((g: Goal) => <GoalRow key={g.id} goal={g} />)}
      </ScrollView>
    </View>
    // </SoloPopup> // Removed for now
  );
}

const styles = StyleSheet.create({
  container: {
    
    backgroundColor: '#002A35', // Assuming this is the background color
  },
  body: { 
    paddingHorizontal: vScale(20), // Add horizontal padding consistent with nav
    paddingBottom: vScale(120), 
    flexGrow: 1 
  } 
}); 