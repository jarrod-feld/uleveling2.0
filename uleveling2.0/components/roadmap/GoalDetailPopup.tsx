import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'phosphor-react-native';
import SoloPopup from '@/components/common/SoloPopup';
import { Goal } from '@/mock/roadmapData';
import { useQuestGoals, QuestWithGoalTitle } from '@/contexts/QuestGoalContext';
import { verticalScale as vS, scale as s } from '@/constants/scaling';

// Define a fixed height for the popup
const POPUP_HEIGHT = vS(450); // Adjust this value as needed

interface GoalDetailPopupProps {
  visible: boolean;
  onClose: () => void;
  onClosed?: () => void;
  goal: Goal | null;
}

// Simple Quest item renderer for the popup
function QuestItem({ quest }: { quest: QuestWithGoalTitle }) {
  return (
    <View style={styles.questItem}>
      <Text style={styles.questText}>- {quest.title}</Text>
      {/* Add more quest details if needed, e.g., progress */}
    </View>
  );
}

export default function GoalDetailPopup({ visible, onClose, onClosed, goal }: GoalDetailPopupProps) {
  const { quests } = useQuestGoals();

  const relatedQuests = useMemo(() => {
    if (!goal || !quests) return [];
    return quests.filter(q => q.goalId === goal.id && q.status !== 'completed' && q.status !== 'skipped');
  }, [quests, goal]);

  if (!goal) return null;

  return (
    <SoloPopup
      visible={visible}
      onClose={onClose}
      onClosed={onClosed}
      requiredHeight={POPUP_HEIGHT} // Use fixed height
    >
      <View style={styles.contentWrapper}>
        {/* Top Section (non-scrollable) */}
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <Text style={styles.goalDescription}>{goal.description}</Text>
        <View style={styles.separator} />
        <Text style={styles.sectionTitle}>Active Quests:</Text>

        {/* Scrollable Quest List Area */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {relatedQuests.length > 0 ? (
            relatedQuests.map(quest => <QuestItem key={quest.id} quest={quest} />)
          ) : (
            <Text style={styles.noQuestsText}>No active quests for this goal.</Text>
          )}
        </ScrollView>

        {/* Bottom Section (non-scrollable) */}
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <View>
            <X size={s(20)} color="#00ffff" weight="bold" />
          </View>
        </TouchableOpacity>
      </View>
    </SoloPopup>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    width: '100%',
    paddingTop: vS(15),
    paddingBottom: vS(10),
    alignItems: 'center',
    justifyContent: 'flex-start', // Align items to top, let ScrollView handle space
  },
  goalTitle: {
    fontFamily: 'PressStart2P',
    fontSize: s(12),
    color: '#fff',
    marginBottom: vS(10), // Reduced margin a bit
    textAlign: 'center',
    paddingHorizontal: s(15),
  },
  goalDescription: {
    fontFamily: 'PressStart2P',
    fontSize: s(9),
    color: '#ccc',
    marginBottom: vS(12),
    textAlign: 'center',
    paddingHorizontal: s(20),
    lineHeight: vS(14),
  },
  separator: {
    height: 1,
    backgroundColor: '#00ffff40',
    width: '80%',
    alignSelf: 'center',
    marginVertical: vS(12),
  },
  sectionTitle: {
    fontFamily: 'PressStart2P',
    fontSize: s(10),
    color: '#00ffff',
    marginBottom: vS(10),
    alignSelf: 'flex-start',
    marginLeft: s(10),
    width: '100%', // Ensure it takes full width for alignment
  },
  // Styles for the ScrollView itself
  scrollView: {
    width: '100%',
    flex: 1, // Allow ScrollView to take available vertical space
    marginBottom: vS(10), // Space between scroll area and close button
  },
  // Styles for the content inside the ScrollView
  scrollViewContent: {
     paddingHorizontal: s(15), // Indent quest items within scroll view
     paddingBottom: vS(10), // Padding at the bottom of the scroll content
  },
  questItem: {
    marginBottom: vS(8),
    width: '100%',
    // Removed paddingLeft, handled by scrollViewContent
  },
  questText: {
    fontFamily: 'PressStart2P',
    fontSize: s(9),
    color: '#eee',
  },
  noQuestsText: {
    fontFamily: 'PressStart2P',
    fontSize: s(9),
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: vS(10),
    // Removed paddingLeft, handled by scrollViewContent
  },
  closeButton: {
    padding: s(8),
    marginTop: 'auto', // Push button to the very bottom
  },
}); 