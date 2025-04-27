import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
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
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
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
      )}
      scrollEnabled={false}
      contentContainerStyle={styles.listContentContainer}
    />
  );
}

export default QuestListComponent; // Use the new name

const styles = StyleSheet.create({
  listContentContainer: {
    paddingHorizontal: s(20),
    paddingBottom: vs(10),
  },
}); 