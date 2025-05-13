import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView
} from 'react-native';
import Picker from 'react-native-wheel-picker-expo';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';
import uuid from 'react-native-uuid'; // Need to install this package

// Exported height for this step's content
// Note: Allows for list + add/edit form area
export const STEP_CONTENT_HEIGHT = verticalScale(300);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

interface Goal {
    id: string;
    description: string;
    timeframe: string; // Store the label like "1 Month"
}

interface TimeframeOption {
    label: string;
    value: string; // Can be same as label for simplicity
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
    { label: "1 Week", value: "1 Week" },
    { label: "1 Month", value: "1 Month" },
    { label: "3 Months", value: "3 Months" },
    { label: "6 Months", value: "6 Months" },
    { label: "1 Year", value: "1 Year" },
];

const DEFAULT_TIMEFRAME = TIMEFRAME_OPTIONS[1].value; // Default to "1 Month"

export default function Step09_GoalList({ data, setData, setValid }: StepProps) {
  const [goals, setGoals] = useState<Goal[]>([]); // Initialize empty and populate in useEffect
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null); // Track which goal is being edited/added
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [currentTimeframeIndex, setCurrentTimeframeIndex] = useState<number>(1); // Default index for "1 Month"

  // Update parent state whenever local goals change
  useEffect(() => {
    console.log(`[Step09_GoalList] Goals changed, updating parent state with ${goals.length} goals`);
    if (goals.length > 0) {
      console.log(`[Step09_GoalList] Goals data:`, JSON.stringify(goals));
    }
    
    setData(prev => ({ ...prev, goals: goals.length > 0 ? goals : undefined }));
    setValid(goals.length > 0); // Valid if at least one goal exists
  }, [goals, setData, setValid]);

  // Initialize
  useEffect(() => {
    // Ensure goals from data have IDs
    const initialGoalsWithIds = (data.goals || []).map(g => ({
        ...g,
        id: uuid.v4() as string // Assign a new ID directly
    }));
    setGoals(initialGoalsWithIds);
    setValid(initialGoalsWithIds.length > 0);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleAddGoal = () => {
    setCurrentDescription('');
    setCurrentTimeframeIndex(TIMEFRAME_OPTIONS.findIndex(opt => opt.value === DEFAULT_TIMEFRAME) || 1);
    setEditingGoal({ id: uuid.v4() as string, description: '', timeframe: DEFAULT_TIMEFRAME });
  };

  const handleEditGoal = (goal: Goal) => {
    setCurrentDescription(goal.description);
    const tfIndex = TIMEFRAME_OPTIONS.findIndex(opt => opt.value === goal.timeframe);
    setCurrentTimeframeIndex(tfIndex >= 0 ? tfIndex : 1);
    setEditingGoal(goal);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prevGoals => prevGoals.filter(g => g.id !== id));
    if (editingGoal?.id === id) {
        setEditingGoal(null); // Stop editing if the deleted goal was being edited
    }
  };

  const handleSaveGoal = () => {
    if (!editingGoal || !currentDescription.trim()) return; // Need description

    const newGoal: Goal = {
        ...editingGoal,
        description: currentDescription.trim(),
        timeframe: TIMEFRAME_OPTIONS[currentTimeframeIndex].value,
    };

    setGoals(prevGoals => {
        const existingIndex = prevGoals.findIndex(g => g.id === newGoal.id);
        if (existingIndex >= 0) {
            // Update existing goal
            console.log(`[Step09_GoalList] Updating existing goal: "${newGoal.description}" (${newGoal.timeframe})`);
            const updatedGoals = [...prevGoals];
            updatedGoals[existingIndex] = newGoal;
            return updatedGoals;
        } else {
            // Add new goal
            console.log(`[Step09_GoalList] Adding new goal: "${newGoal.description}" (${newGoal.timeframe})`);
            return [...prevGoals, newGoal];
        }
    });

    setEditingGoal(null); // Exit editing mode
    Keyboard.dismiss();
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    Keyboard.dismiss();
  };

  const renderTimeframePickerItem = (props: any): React.ReactElement => {
      const label = props?.label ?? '??';
      const isSelected = props?.isSelected;
      return (
          <Text style={[styles.pickerItemText, isSelected && styles.pickerItemSelectedText]}>
              {label}
          </Text>
      );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
         <Text style={styles.label}>Define Your Goals:</Text>

          {/* --- Add/Edit Form --- */}
          {editingGoal && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingContainer}
            >
              <View style={styles.editFormContainer}>
                  <Text style={styles.editLabel}>{editingGoal.description ? 'Edit Goal' : 'Add New Goal'}</Text>
                  <TextInput
                      style={styles.input}
                      value={currentDescription}
                      onChangeText={setCurrentDescription}
                      placeholder="Goal Description..."
                      placeholderTextColor="#555555"
                      returnKeyType="go"
                      blurOnSubmit={true}
                      selectionColor="#00FF00"
                      multiline
                  />
                  <View style={styles.timeframePickerContainer}>
                      <Text style={styles.timeframeLabel}>Timeframe:</Text>
                      <Picker
                          items={TIMEFRAME_OPTIONS}
                          initialSelectedIndex={currentTimeframeIndex}
                          onChange={({ index }) => setCurrentTimeframeIndex(index)}
                          height={verticalScale(80)} // Smaller height for timeframe
                          width={scale(150)}
                          backgroundColor="#0d1b2a"
                          selectedStyle={styles.pickerSelectedStyle}
                          renderItem={renderTimeframePickerItem}
                          haptics
                      />
                  </View>
                  <View style={styles.editButtonsRow}>
                      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                          <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                          style={[styles.saveButton, !currentDescription.trim() && styles.buttonDisabled]}
                          onPress={handleSaveGoal}
                          disabled={!currentDescription.trim()}
                      >
                          <Text style={[styles.buttonText, !currentDescription.trim() && styles.buttonTextDisabled]}>Save Goal</Text>
                      </TouchableOpacity>
                  </View>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* --- Goal List --- */}
          {!editingGoal && (
              <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContentContainer}>
                  {goals.map((goal) => (
                      <View key={goal.id} style={styles.goalItemContainer}>
                          <View style={styles.goalTextContainer}>
                             <Text style={styles.goalDescription}>{goal.description}</Text>
                             <Text style={styles.goalTimeframe}>Timeframe: {goal.timeframe}</Text>
                          </View>
                          <View style={styles.goalButtonsContainer}>
                              <TouchableOpacity style={styles.editButton} onPress={() => handleEditGoal(goal)}>
                                  <Text style={styles.buttonTextSmall}>EDIT</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGoal(goal.id)}>
                                   <Text style={styles.buttonTextSmall}>DEL</Text>
                              </TouchableOpacity>
                          </View>
                      </View>
                  ))}

                  {/* Add Goal Button - Only show when not editing */}
                  <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
                      <Text style={styles.addButtonText}>+ ADD GOAL</Text>
                  </TouchableOpacity>
                   {goals.length === 0 && (
                      <Text style={styles.infoText}>Add at least one goal to continue.</Text>
                  )}
              </ScrollView>
          )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// --- Styles --- (Combine and adapt styles from previous steps)
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(5),
    width: '100%',
    flex: 1,
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(14, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  listContainer: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  listContentContainer: {
      alignItems: 'center',
      paddingBottom: verticalScale(10), // Space for Add button
  },
  goalItemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderWidth: moderateScale(1),
      borderColor: '#00ffff',
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(10),
      marginBottom: verticalScale(8),
      width: '95%',
  },
   goalTextContainer: {
      flex: 1,
      marginRight: scale(10),
  },
  goalDescription: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#FFFFFF',
      marginBottom: verticalScale(3),
  },
  goalTimeframe: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(8, 0.5),
      color: '#cccccc',
  },
  goalButtonsContainer: {
     flexDirection: 'row',
  },
  editButton: {
      backgroundColor: '#0000AA', // Dark Blue
      paddingVertical: verticalScale(4),
      paddingHorizontal: scale(6),
      marginRight: scale(5),
      borderWidth: moderateScale(1),
      borderColor: '#FFFFFF',
  },
  deleteButton: {
      backgroundColor: '#AA0000', // Dark Red
      paddingVertical: verticalScale(4),
      paddingHorizontal: scale(6),
      borderWidth: moderateScale(1),
      borderColor: '#FFFFFF',
  },
  buttonTextSmall: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(8, 0.5),
    color: '#FFFFFF',
  },
  addButton: {
    marginTop: verticalScale(10),
    borderWidth: moderateScale(2),
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(15),
    alignSelf: 'center',
  },
  addButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(12, 0.5),
    color: '#00FF00',
  },
  infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#888888',
      textAlign: 'center',
      marginTop: verticalScale(10),
  },

  // --- Edit Form Styles ---
  keyboardAvoidingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  editFormContainer: {
      width: '95%',
      borderWidth: moderateScale(1),
      borderColor: '#00FF00',
      padding: moderateScale(10),
      marginBottom: verticalScale(10),
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  editLabel: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(12, 0.5),
      color: '#00FF00',
      textAlign: 'center',
      marginBottom: verticalScale(10),
  },
  input: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(10, 0.5),
    color: '#FFFFFF',
    backgroundColor: '#000000',
    borderWidth: moderateScale(1),
    borderColor: '#00ffff',
    width: '100%',
    minHeight: verticalScale(60),
    textAlignVertical: 'top', // Align text top for multiline
    padding: scale(8),
    marginBottom: verticalScale(10),
  },
  timeframePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center picker row
    marginBottom: verticalScale(10),
    width: '100%',
  },
  timeframeLabel: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(9, 0.5),
      color: '#FFFFFF',
      marginRight: scale(10),
  },
  pickerSelectedStyle: {
      borderColor: '#00FF00',
      borderWidth: moderateScale(1), // Thinner border for timeframe picker
  },
  pickerItemText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#FFFFFF',
      paddingVertical: verticalScale(1),
  },
  pickerItemSelectedText: {
      color: '#00FF00',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: verticalScale(5),
  },
  saveButton: {
    backgroundColor: '#00AA00', // Dark Green
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderWidth: moderateScale(1),
    borderColor: '#FFFFFF',
    minWidth: scale(80),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555555', // Grey
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderWidth: moderateScale(1) ,
    borderColor: '#FFFFFF',
    minWidth: scale(80),
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(10, 0.5),
    color: '#FFFFFF',
  },
  buttonDisabled: {
      backgroundColor: '#333333',
      borderColor: '#555555',
  },
   buttonTextDisabled: {
      color: '#888888',
  },
}); 