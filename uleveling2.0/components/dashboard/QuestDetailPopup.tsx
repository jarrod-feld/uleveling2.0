import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import SoloPopup from '@/components/common/SoloPopup';
import { Quest as QuestData } from '@/mock/dashboardData'; // Assuming Quest type is here
import { verticalScale as vs, scale as s, moderateScale as ms } from '@/constants/scaling';
import { X } from 'phosphor-react-native';

const FONT_FAMILY = 'PressStart2P';

interface QuestDetailPopupProps {
  quest: QuestData | null;
  goalTitle: string | null; // Pass goal title if available
  isVisible: boolean;
  onClose: () => void;
}

// Increase height slightly for button
const POPUP_HEIGHT = vs(370); 

export default function QuestDetailPopup({ 
  quest, 
  goalTitle, 
  isVisible, 
  onClose 
}: QuestDetailPopupProps) {

  if (!quest) {
    return null; // Don't render if no quest data
  }

  // Updated formatCompletedAt function
  const formatCompletedAt = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';

    let date: Date;
    // Check if it's already a Date object
    if (dateInput instanceof Date) {
      date = dateInput;
    } 
    // Check if it's a string and try to parse it
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } 
    // If it's neither or parsing failed, return an indicator
    else {
      console.warn("[QuestDetailPopup] Invalid completedAt value type:", typeof dateInput, dateInput);
      return 'Invalid Date Type';
    }

    // Check if the resulting date is valid before formatting
    if (isNaN(date.getTime())) {
      console.warn("[QuestDetailPopup] Could not parse completedAt value:", dateInput);
       return 'Invalid Date Value';
    }

    return date.toLocaleDateString(); // Use the validated/parsed date object
  };

  return (
    <SoloPopup 
      visible={isVisible} 
      onClose={onClose} 
      requiredHeight={POPUP_HEIGHT}
      disableBackdropClose={false} // Allow closing by tapping background
    >
      {/* Content goes inside SoloPopup's children */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{quest.title}</Text>
        
        {goalTitle && (
          <Text style={styles.goalTitle}>Goal: {goalTitle}</Text>
        )}

        <Text style={styles.description}>{quest.description}</Text>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={styles.detailValue}>{quest.status}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Progress:</Text>
          <Text style={styles.detailValue}>
            {quest.progress.current} / {quest.progress.total}
          </Text>
        </View>
        
        {quest.completedAt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed:</Text>
            <Text style={styles.detailValue}>{formatCompletedAt(quest.completedAt)}</Text>
          </View>
        )}

        <View style={styles.separator} />

        <Text style={styles.detailLabel}>Rewards:</Text>
        {/* Always list Discipline */}
        <Text style={styles.statValue}>
          - DIS: +{quest.disciplineIncrementAmount ?? 1}
        </Text>
        {/* List other explicit stats */}
        {quest.statIncrements.map(inc => (
          <Text key={inc.category} style={styles.statValue}>
            - {inc.category}: +{inc.amount}
          </Text>
        ))}

        {/* Spacer to push button down */}
        <View style={{flex: 1}} /> 

        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X size={ms(18)} color="#00ffff" weight="bold" />
        </Pressable>
      </View>
    </SoloPopup>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: vs(15),
    paddingBottom: vs(5), // Reduce bottom padding to make space
    width: '100%',
    alignItems: 'flex-start', // Align text left
    flex: 1, // Make container fill popup height
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(14),
    color: '#fff',
    marginBottom: vs(5),
    textAlign: 'center',
    width: '100%', // Center title within container
  },
  goalTitle: {
     fontFamily: FONT_FAMILY,
     fontSize: ms(10),
     color: '#26e07f', // Green color
     marginBottom: vs(10),
     textAlign: 'center',
     width: '100%',
  },
  description: {
     fontFamily: FONT_FAMILY,
     fontSize: ms(9),
     color: '#ccc',
     marginBottom: vs(15),
     lineHeight: vs(14),
  },
  separator: {
    height: 1,
    backgroundColor: '#00ffff40', // Faint cyan
    width: '100%',
    marginVertical: vs(10),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: vs(5),
  },
  detailLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#ccc',
    marginBottom: vs(5),
  },
  detailValue: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#fff',
  },
   statValue: {
     fontFamily: FONT_FAMILY,
     fontSize: ms(9),
     color: '#fff',
     marginLeft: s(10), // Indent stat list
     marginTop: vs(3),
   },
   closeButton: {
    alignSelf: 'center', // Center the button
    marginTop: vs(15), // Space above button
    marginBottom: vs(5), // Space below button
    padding: s(8), 
    borderWidth: 2,
    borderColor: '#00ffff', // Cyan border
    borderRadius: s(5), // Slightly rounded corners
  },
}); 