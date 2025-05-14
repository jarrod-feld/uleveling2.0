import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import SoloPopup from '@/components/common/SoloPopup';
import { Quest as QuestData } from '@/mock/dashboardData'; // Assuming Quest type is here
import { verticalScale as vs, scale as s, moderateScale as ms } from '@/constants/scaling';
import { X, Plus, Minus, Check } from 'phosphor-react-native';

const FONT_FAMILY = 'PressStart2P';
const COLOR = {
  bg       : '#002A35',
  white    : '#ffffff',
  green    : '#26e07f',
  red      : '#ff3b3b',
  border   : '#ffffff',
  cyan     : '#00ffff',
  grey     : '#888888',
  disabled : '#555555',
  greenDone: '#29cc4d', // Add greenDone for completed status
};

interface QuestDetailPopupProps {
  quest: QuestData | null;
  goalTitle: string | null; // Pass goal title if available
  isVisible: boolean;
  onClose: () => void;
  onSetCount?: (id: string, count: number) => void;
  isQuestInactive: boolean;
}

// Adjust height for new controls
const POPUP_HEIGHT = vs(500); 

export default function QuestDetailPopup({ 
  quest, 
  goalTitle, 
  isVisible, 
  onClose,
  onSetCount,
  isQuestInactive
}: QuestDetailPopupProps) {

  // Local state for the input value being edited
  const [inputValue, setInputValue] = useState<string>('0'); 
  // State to store the initial value when popup opens
  const [initialValue, setInitialValue] = useState<number>(0);

  // Effect to update local state and store initial value when quest data changes
  useEffect(() => {
    if (quest) {
      const currentProgress = quest.progress.current;
      setInputValue(String(currentProgress));
      setInitialValue(currentProgress); // Store initial value
    }
  }, [quest]); // Depend on the whole quest object or specific relevant fields

  if (!quest) {
    return null; // Don't render if no quest data
  }

  // --- Progress Handlers (Modify local state ONLY) ---
  const handleIncrement = () => {
    console.log(`[QuestDetailPopup] handleIncrement called locally for quest ID: ${quest?.id}`);
    if (!isQuestInactive) {
      const currentNum = Number(inputValue.replace(/[^0-9]/g, '')) || 0; // Use current input value
      const newValue = Math.min(quest.progress.total, currentNum + 1);
      setInputValue(String(newValue));
    }
  };
  const handleDecrement = () => {
     console.log(`[QuestDetailPopup] handleDecrement called locally for quest ID: ${quest?.id}`);
     if (!isQuestInactive) {
       const currentNum = Number(inputValue.replace(/[^0-9]/g, '')) || 0; // Use current input value
       const newValue = Math.max(0, currentNum - 1);
       setInputValue(String(newValue));
     }
  };

  // Update local state on text change
  const handleInputChange = (text: string) => {
    console.log(`[QuestDetailPopup] handleInputChange called for quest ID: ${quest?.id} with text: ${text}`);
    setInputValue(text); // Only update local state
  };

  // Save progress and close
  const handleSaveAndClose = () => {
    console.log(`[QuestDetailPopup] handleSaveAndClose called for quest ID: ${quest?.id} with final value: ${inputValue}`);
    if (!isQuestInactive && onSetCount) {
       const newCount = Number(inputValue.replace(/[^0-9]/g, ''));
       if (!isNaN(newCount)) {
         const clampedCount = Math.max(0, Math.min(quest.progress.total, newCount));
          console.log(`[QuestDetailPopup] Calling onSetCount (onSave) for quest ID: ${quest?.id} with count: ${clampedCount}`);
         onSetCount(quest.id, clampedCount);
       } else {
         console.log(`[QuestDetailPopup] Invalid input on save, discarding.`);
       }
    } else if (isQuestInactive) {
        console.log(`[QuestDetailPopup] Quest is inactive, cannot save.`);
    }
    onClose(); // Close regardless of save success/failure/change status
  };

  // Close without saving pending changes
  const handleClose = () => {
    console.log(`[QuestDetailPopup] handleClose called, discarding changes for quest ID: ${quest?.id}`);
    // Reset local state to initial value before closing to discard changes
    setInputValue(String(initialValue)); 
    onClose();
  };
  // --- End Handlers ---


  // Updated formatCompletedAt function
  const formatCompletedAt = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';

    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } 
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } 
    else {
      console.warn("[QuestDetailPopup] Invalid completedAt value type:", typeof dateInput, dateInput);
      return 'Invalid Date Type';
    }

    if (isNaN(date.getTime())) {
      console.warn("[QuestDetailPopup] Could not parse completedAt value:", dateInput);
       return 'Invalid Date Value';
    }

    return date.toLocaleDateString(); // Use the validated/parsed date object
  };

  const progressControlStyle = isQuestInactive ? styles.disabledControl : {};
  const progressTextStyle = isQuestInactive ? styles.disabledText : {};
  const progressBorderStyle = isQuestInactive ? { borderColor: COLOR.disabled } : {};


  return (
    <SoloPopup 
      visible={isVisible} 
      onClose={handleClose} // Use handleClose to discard changes
      requiredHeight={POPUP_HEIGHT}
      disableBackdropClose={false} // Allow closing by tapping background
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{quest.title}</Text>
        
        {goalTitle && (
          <Text style={styles.goalTitle}>Goal: {goalTitle}</Text>
        )}

        <Text style={styles.description}>{quest.description}</Text>

        <View style={styles.separator} />

        {/* Progress Controls Section - Conditionally Rendered */}
        {!isQuestInactive && (
          <View style={styles.progressControlContainer}>
            <Text style={styles.detailLabel}>Log Progress:</Text>
            <View style={styles.progressControlRow}>
              <Pressable 
                style={[styles.iconBtn, progressBorderStyle]} 
                onPress={handleDecrement} 
                disabled={isQuestInactive}
              >
                <Minus size={s(14)} color={isQuestInactive ? COLOR.disabled : COLOR.red} weight="bold" />
              </Pressable>
              <TextInput
                style={[styles.input, progressTextStyle, progressBorderStyle]}
                keyboardType="numeric"
                value={inputValue}
                onChangeText={handleInputChange}
                selectTextOnFocus={true}
                editable={!isQuestInactive}
              />
              <Pressable 
                 style={[styles.iconBtn, progressBorderStyle]} 
                 onPress={handleIncrement} 
                 disabled={isQuestInactive}
              >
                <Plus size={s(14)} color={isQuestInactive ? COLOR.disabled : COLOR.green} weight="bold" />
              </Pressable>
              <Text style={[styles.progressTotalText, progressTextStyle]}>/ {quest.progress.total}</Text>
            </View>
             <View style={styles.separator} />
          </View>
        )}

        {/* Details Section */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, quest.status === 'completed' ? styles.statusCompleted : quest.status === 'skipped' ? styles.statusSkipped : {}]}>
              {quest.status.toUpperCase()}
           </Text>
        </View>

        {/* Only show numeric progress if not inactive */}
        {!isQuestInactive && (
           <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Progress:</Text>
              <Text style={styles.detailValue}>
                {/* Display initial progress, input state might differ */}
                {initialValue} / {quest.progress.total} 
              </Text>
           </View>
        )}
        
        {quest.completedAt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed:</Text>
            <Text style={styles.detailValue}>{formatCompletedAt(quest.completedAt)}</Text>
          </View>
        )}

        <View style={styles.separator} />

        {/* Rewards Section */}
        <Text style={styles.detailLabel}>Rewards:</Text>
        <Text style={styles.statValue}>
          - DIS: +{quest.disciplineIncrementAmount ?? 1}
        </Text>
        {quest.statIncrements.map(inc => (
          <Text key={inc.category} style={styles.statValue}>
            - {inc.category}: +{inc.amount}
          </Text>
        ))}

        {/* Spacer to push button down */}
        <View style={{flex: 1}} /> 

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={[styles.bottomButton, styles.closeButton]} onPress={handleClose}>
            <X size={ms(18)} color={COLOR.cyan} weight="bold" />
          </Pressable>
          {/* Conditionally render Save button only if quest is active */}
          {!isQuestInactive && (
             <Pressable style={[styles.bottomButton, styles.saveButton]} onPress={handleSaveAndClose}>
                 <Check size={ms(18)} color={COLOR.green} weight="bold" />
             </Pressable>
          )}
        </View>
      </View>
    </SoloPopup>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: s(10), // Add horizontal padding
    paddingVertical: vs(15),
    paddingBottom: vs(5), // Reduce bottom padding to make space
    width: '100%',
    alignItems: 'flex-start', // Align text left
    flex: 1, // Make container fill popup height
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(14),
    color: COLOR.white,
    marginBottom: vs(5),
    textAlign: 'center',
    width: '100%', // Center title within container
  },
  goalTitle: {
     fontFamily: FONT_FAMILY,
     fontSize: ms(10),
     color: COLOR.green, // Green color
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
     paddingHorizontal: s(5), // Slight indent for description
  },
  separator: {
    height: 1,
    backgroundColor: `${COLOR.cyan}40`, // Faint cyan
    width: '100%',
    marginVertical: vs(12), // Increased vertical margin
  },
  // --- Progress Control Styles ---
  progressControlContainer: {
     width: '100%',
     marginBottom: vs(0), // Reduced margin below controls before separator
  },
  progressControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center controls horizontally
    width: '100%',
    marginTop: vs(8),
    marginBottom: vs(12), // Add margin below the row
  },
  iconBtn: {
    width: s(32), // Adjusted size
    height: vs(30),
    borderWidth: 2,
    borderColor: COLOR.border,
    justifyContent:'center',
    alignItems:'center',
    marginHorizontal: s(10), // Add horizontal margin
  },
  input: {
    fontFamily: FONT_FAMILY,
    color: COLOR.white,
    fontSize: s(11), // Slightly larger font
    width: s(45), // Wider input
    height: vs(30),
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLOR.border,
    padding: 0,
    marginHorizontal: s(5),
  },
  progressTotalText: {
    fontFamily: FONT_FAMILY,
    color: COLOR.white,
    fontSize: s(11),
    marginLeft: s(5), // Space before total
  },
  disabledControl: {
     // Styles for disabled buttons/input container (optional, e.g., opacity)
     opacity: 0.5,
  },
  disabledText: {
     color: COLOR.disabled, // Grey out text
  },
  // --- End Progress Control Styles ---
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: vs(8), // Increased spacing
    paddingHorizontal: s(5), // Indent detail rows slightly
  },
  detailLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#ccc',
    // marginBottom: vs(5), // Removed bottom margin here
  },
  detailValue: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: COLOR.white,
  },
  statusCompleted: {
     color: COLOR.greenDone,
     fontWeight: 'bold', // Optional: make completed status bold
  },
  statusSkipped: {
     color: COLOR.red,
     fontWeight: 'bold', // Optional: make skipped status bold
  },
   statValue: {
     fontFamily: FONT_FAMILY,
     fontSize: ms(9),
     color: COLOR.white,
     marginLeft: s(15), // Indent stat list further
     marginTop: vs(4), // Increased top margin
   },
   buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    alignItems: 'center',
    width: '100%',
    marginTop: vs(15), // Space above buttons
    marginBottom: vs(5), // Space below buttons
    paddingHorizontal: s(40), // Add padding to constrain button positions if needed
  },
  bottomButton: {
    padding: s(10), // Increase padding for bigger touch area
    borderWidth: 2,
    borderRadius: s(8), // More rounded corners
  },
  closeButton: {
    borderColor: COLOR.cyan, // Keep cyan border for close
  },
  saveButton: {
    borderColor: COLOR.green, // Green border for save
  },
}); 