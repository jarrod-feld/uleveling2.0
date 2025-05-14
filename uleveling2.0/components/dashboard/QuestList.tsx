import React from 'react';
import { StyleSheet, View } from 'react-native';
// import { FlatList } from 'react-native-gesture-handler'; // Remove this import
import Animated, { FadeOut, Layout } from 'react-native-reanimated'; // Import Animated components
import { verticalScale as vs, scale as s } from '@/constants/scaling';
import QuestCard from '@/components/dashboard/QuestCard';
import { Quest as QuestData } from '@/mock/dashboardData';

// Define an augmented type for the data passed to the list
interface QuestWithGoalTitle extends QuestData {
  goalTitle: string | null;
}

interface Props {
  data: QuestWithGoalTitle[]; // Expect data with goalTitle included
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSetCount: (id: string, count: number) => void;
  onUndoStatus?: (id: string) => void;
}

// Style for the wrapper around each QuestCard in the list
const questItemWrapperStyle = {
  width: s(300),             // Consistent width with dashboard's questWrapper
  paddingHorizontal: s(20),  // Consistent padding for QuestCard content placement
  alignSelf: 'center' as "center",       // Center this item within the FlatList and fix type error
  // QuestCard itself applies its own marginTop via its styles.card
};

function QuestListComponent({ // Renamed component for clarity
  data,
  onComplete,
  onSkip,
  onIncrement,
  onDecrement,
  onSetCount,
  onUndoStatus,
}: Props) {
  return (
    <Animated.FlatList // Use Animated.FlatList
      data={data}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Animated.View 
          style={questItemWrapperStyle} // Apply the consistent wrapper style
          exiting={FadeOut.duration(30)} // Reduced from 50ms
        >
          <QuestCard 
            item={item} 
            goalTitle={item.goalTitle} // Pass goalTitle down
            onComplete={onComplete}
            onSkip={onSkip}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onSetCount={onSetCount}
            onUndoStatus={onUndoStatus}
          />
        </Animated.View>
      )}
      scrollEnabled={false}
      contentContainerStyle={styles.listContentContainer} // Modified to remove horizontal padding
      itemLayoutAnimation={Layout.springify().delay(100)} // Animate layout changes
    />
  );
}

export default QuestListComponent; // Use the new name

const styles = StyleSheet.create({
  listContentContainer: {
    // paddingHorizontal: s(20), // Removed: Item wrappers now handle width and centering
    paddingBottom: vs(10),
  },
}); 