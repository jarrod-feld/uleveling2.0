import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, TextInput, ScrollView, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { OnboardingData, Goal } from '../../app/onboarding';
import { scale, verticalScale, moderateScale } from '../../constants/scaling';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const NEXT_BUTTON_GREEN = '#39ff14'; // Define green color locally if needed

interface Step9GoalsOrTemplateProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  addGoal: (description: string, timeframe: string) => void;
  removeGoal: (id: string) => void;
  handleNext: () => void;
}

const Step9GoalsOrTemplate: React.FC<Step9GoalsOrTemplateProps> = ({
  onboardingData,
  setOnboardingData,
  addGoal,
  removeGoal,
  handleNext,
}) => {
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const timeframeInputRef = useRef<TextInput>(null);

  // Local state for inputs
  const [localDescription, setLocalDescription] = useState('');
  const [localTimeframe, setLocalTimeframe] = useState('');

  const handleAddGoalPress = () => {
    if (!localDescription.trim()) {
        setDescriptionError('Please enter a goal description.');
        return;
    }
    setDescriptionError(null);
    addGoal(localDescription, localTimeframe);
    setLocalDescription('');
    setLocalTimeframe('');
  };

  // --- Create Goals View --- (No longer uses BorderedBackground)
  const CreateGoalsView = () => {
    const isButtonDisabled = !localDescription.trim() || !localTimeframe.trim();
    const buttonStyleArray = [
      styles.buttonStyle,
      styles.addGoalButton,
      isButtonDisabled ? styles.buttonDisabled : null
    ].filter(Boolean);

    return (
       <View style={styles.contentWrapper}>
          <View style={styles.labelContainer}>
            <FontAwesome name="bullseye" size={moderateScale(20)} color="#fff" style={styles.labelIcon} />
            <Text style={styles.labelText}>Create Your Goals</Text>
          </View>
          {/* Input Row */}
          <View style={styles.goalInputRow}>
            <View style={{ flex: 2, marginRight: scale(10) }}>
              <TextInput
                style={[
                  styles.input,
                  descriptionError ? styles.inputError : null
                ]}
                value={localDescription}
                onChangeText={(text) => {
                    setLocalDescription(text);
                    if (descriptionError && text.trim()) {
                        setDescriptionError(null);
                    }
                }}
                placeholder="Goal Description"
                placeholderTextColor="#888888" // Darker grey placeholder
                returnKeyType="next"
                onSubmitEditing={() => timeframeInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              {descriptionError && <Text style={styles.errorText}>{descriptionError}</Text>}
            </View>

             <View style={{ flex: 1 }}>
                <TextInput
                  ref={timeframeInputRef}
                  style={[styles.input]}
                  value={localTimeframe}
                  onChangeText={(text) => {
                      setLocalTimeframe(text);
                  }}
                  placeholder="Target Date"
                  placeholderTextColor="#888888" // Darker grey placeholder
                  returnKeyType="done"
                  onSubmitEditing={handleAddGoalPress}
                />
             </View>
          </View>

           {/* Add Goal Button */}
          <View style={styles.addGoalButtonContainer}>
            <TouchableOpacity
              style={buttonStyleArray}
              onPress={handleAddGoalPress}
              disabled={isButtonDisabled}
            >
              <Text style={styles.addGoalButtonText}>Add Goal</Text>
            </TouchableOpacity>
          </View>

          {/* Goals List - Uncommented */}
          
          <View style={styles.scrollViewGoalsContainer}>
             <ScrollView style={styles.scrollViewGoals}>
               {onboardingData.goals.length === 0 ? (
                 <Text style={styles.placeholderText}>Your goals will appear here.</Text>
               ) : (
                 onboardingData.goals.map((goal) => {
                   return (
                     <View key={goal.id} style={styles.goalItem}>
                       <View style={styles.goalTextContainer}>
                         <Text style={styles.goalTextDesc}>{goal.description}</Text>
                         <Text style={styles.goalTextTime}>{goal.timeframe}</Text>
                       </View>
                       <TouchableOpacity onPress={() => removeGoal(goal.id)} style={styles.removeGoalButton}>
                         <FontAwesome name="times-circle" size={moderateScale(20)} color="#ff6666" />
                       </TouchableOpacity>
                     </View>
                   );
                 })
               )}
             </ScrollView>
          </View>
          
       </View>
    );
  };

  // --- Select Template View --- (No longer uses BorderedBackground)
   const SelectTemplateView = () => (
      <View style={styles.contentWrapper}>
        <View style={styles.labelContainer}>
          <FontAwesome name="cogs" size={moderateScale(20)} color="#fff" style={styles.labelIcon} />
          <Text style={styles.labelText}>Select a Template</Text>
        </View>
        <View style={styles.buttonColumn}>
          <TouchableOpacity
            style={[styles.buttonStyle, onboardingData.templateChoice === 'Balanced Growth' && styles.buttonSelected]}
            onPress={() => setOnboardingData({ ...onboardingData, templateChoice: 'Balanced Growth' })}
          >
            <Text style={styles.buttonText}>Balanced Growth</Text>
          </TouchableOpacity>
          <View style={{ height: verticalScale(15) }} />
          <TouchableOpacity
            style={[styles.buttonStyle, onboardingData.templateChoice === 'Fitness Focus' && styles.buttonSelected]}
            onPress={() => setOnboardingData({ ...onboardingData, templateChoice: 'Fitness Focus' })}
          >
            <Text style={styles.buttonText}>Fitness Focus</Text>
          </TouchableOpacity>
        </View>

        {onboardingData.templateChoice && (
          <>
            <Text style={[styles.labelText, { marginTop: verticalScale(20), marginBottom: verticalScale(10) }]}>Select Intensity</Text>
            <View style={styles.buttonRow}>
               <TouchableOpacity
                style={[styles.buttonStyleSmall, onboardingData.templateIntensity === 'low' && styles.buttonSelected]}
                onPress={() => setOnboardingData({ ...onboardingData, templateIntensity: 'low' })}
              >
                <Text style={styles.buttonTextSmall}>Low</Text>
              </TouchableOpacity>
               <TouchableOpacity
                style={[styles.buttonStyleSmall, onboardingData.templateIntensity === 'medium' && styles.buttonSelected]}
                onPress={() => setOnboardingData({ ...onboardingData, templateIntensity: 'medium' })}
              >
                <Text style={styles.buttonTextSmall}>Medium</Text>
              </TouchableOpacity>
               <TouchableOpacity
                style={[styles.buttonStyleSmall, onboardingData.templateIntensity === 'high' && styles.buttonSelected]}
                onPress={() => setOnboardingData({ ...onboardingData, templateIntensity: 'high' })}
              >
                <Text style={styles.buttonTextSmall}>High</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
   );


  // --- Render Logic --- (No longer uses BorderedBackground for fallback)
  if (onboardingData.roadmapChoice === 'create') {
    return <CreateGoalsView />;
  } else if (onboardingData.roadmapChoice === 'template') {
    return <SelectTemplateView />;
  } else {
    // Fallback view if no choice is made yet
    return (
        <View style={styles.contentWrapper}>
          <Text style={styles.popupText}>Select a roadmap option first.</Text>
        </View>
    );
  }
};

export default Step9GoalsOrTemplate;

const styles = StyleSheet.create({
    contentWrapper: { // Main container style for this component now
      minHeight: verticalScale(300),
      width: '100%', 
      alignItems: 'center',
      paddingVertical: verticalScale(10), // Keep some vertical padding
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: verticalScale(10),
    },
    labelIcon: {
      marginRight: scale(10),
      textShadowColor: '#fff',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    labelText: {
      color: '#cccccc', // Lighter grey
      fontSize: moderateScale(16, 0.3), // Smaller font size
      marginBottom: 0, // Keep 0 margin here
      fontWeight: 'normal', // Normal weight
      textAlign: 'center',
      textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6, // Reduced radius
    },
    goalInputRow: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: verticalScale(10),
        alignItems: 'stretch',
    },
    input: {
        backgroundColor: 'rgba(30, 30, 30, 0.8)', // Darker input background
        color: '#fff',
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(18),
        fontSize: moderateScale(16, 0.4),
        borderRadius: moderateScale(5),
        textAlign: 'left',
        borderWidth: moderateScale(0.5),
        borderColor: 'rgba(255, 255, 255, 0.2)', // Faint white border
    },
    inputError: {
       borderColor: '#ff4444',
    },
    errorText: {
      color: '#ff4444',
      fontSize: moderateScale(13, 0.3),
      marginTop: verticalScale(6),
      textAlign: 'left',
      textShadowColor: '#ff4444',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 4,
      position: 'absolute',
      bottom: verticalScale(-22),
      left: scale(5),
    },
    addGoalButtonContainer: {
      width: '100%',
      marginTop: verticalScale(30),
      marginBottom: verticalScale(25),
      alignItems: 'center',
    },
    scrollViewGoalsContainer: {
      width: '100%',
     
     marginBottom: verticalScale(25),
      marginTop: verticalScale(25),
      backgroundColor: 'rgba(30, 30, 30, 0.6)', // Darker scroll view background
      borderRadius: moderateScale(5),
      borderColor: 'rgba(255, 255, 255, 0.1)', // Very faint white border
      borderWidth: 1,
    },
    scrollViewGoals: {
        width: '100%',
        padding: scale(10),
    },
    placeholderText: {
        color: '#888888', // Darker grey
        textAlign: 'center',
        marginTop: verticalScale(30),
        fontStyle: 'italic',
        fontSize: moderateScale(15, 0.3),
        textShadowColor: 'rgba(136, 136, 136, 0.6)', // Grey shadow
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2,
    },
    goalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 50, 50, 0.5)', // Darker grey item background
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(15),
        borderRadius: moderateScale(4),
        marginBottom: verticalScale(10),
    },
    goalTextContainer: {
        marginRight: scale(10),
    },
    goalTextDesc: {
        color: '#fff',
        fontSize: moderateScale(14, 0.3),
        fontFamily: 'PublicSans-Regular',
    },
    goalTextTime: {
        color: '#aaa',
        fontSize: moderateScale(12, 0.3),
        marginTop: verticalScale(2),
        fontFamily: 'PublicSans-Regular',
    },
    removeGoalButton: {
        padding: scale(5),
        marginLeft: scale(5),
        backgroundColor: 'transparent',
    },
    removeGoalText: {
        color: '#ff4444',
        fontWeight: 'bold',
        fontSize: moderateScale(16, 0.4),
        fontFamily: 'PublicSans-Bold',
    },
    buttonColumn: {
        width: '90%',
        alignItems: 'stretch',
        marginTop: verticalScale(25),
        marginBottom: verticalScale(25),
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      marginTop: verticalScale(15),
      marginBottom: verticalScale(15),
    },
     buttonStyle: { // Style for Template/Intensity buttons
       paddingVertical: verticalScale(14),
       paddingHorizontal: scale(20),
       backgroundColor: 'transparent', // Removed background
       borderRadius: moderateScale(6),
       borderWidth: moderateScale(1),
       borderColor: '#aaaaaa', // Grey border
       alignItems: 'center',
       justifyContent: 'center',
       shadowColor: '#ffffff', // White shadow
       shadowOffset: { width: 0, height: 0 },
       shadowOpacity: 0.8, // Increased opacity
       shadowRadius: 8, // Increased radius
       elevation: 10, // Increased elevation
     },
     addGoalButton: { // Specific style for Add Goal button
        backgroundColor: 'rgba(0, 20, 10, 0.3)', // Very subtle dark green background
        borderColor: NEXT_BUTTON_GREEN, // Green border
        shadowColor: NEXT_BUTTON_GREEN, // Green shadow
        shadowOpacity: 0.9, // Increased opacity
        shadowRadius: 10, // Increased radius
        elevation: 12, // Increased elevation
     },
     buttonStyleSmall: { // Style for Intensity buttons
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(18),
        backgroundColor: 'transparent', // Removed background
        borderRadius: moderateScale(5),
        borderWidth: moderateScale(1),
        borderColor: '#aaaaaa', // Grey border
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ffffff', // White shadow
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, // Increased opacity
        shadowRadius: 7, // Increased radius
        elevation: 8, // Increased elevation
     },
     buttonSelected: { // Style for selected Template/Intensity buttons
       backgroundColor: 'rgba(255, 255, 255, 0.15)', // Very subtle white highlight
       borderColor: '#ffffff', // White border
       shadowColor: '#ffffff', // White shadow
       shadowOpacity: 1.0, // Increased opacity
       shadowRadius: 12, // Increased radius
       elevation: 15, // Increased elevation
     },
     buttonDisabled: {
       backgroundColor: 'transparent', // Removed background
       borderColor: '#555555',
       shadowOpacity: 0,
       elevation: 0,
     },
     buttonText: { // Text for Template buttons
       color: '#ffffff', // White text
       fontSize: moderateScale(17, 0.4),
       fontWeight: 'bold',
       textShadowColor: '#ffffff', // White shadow
       textShadowOffset: { width: 0, height: 0 },
       textShadowRadius: 8, // Increased radius
     },
     addGoalButtonText: { // Text for Add Goal button
        color: NEXT_BUTTON_GREEN, // Green text
        fontSize: moderateScale(17, 0.4),
        fontWeight: 'bold',
        textShadowColor: NEXT_BUTTON_GREEN, // Green shadow
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8, // Increased radius
     },
      buttonTextSmall: { // Text for Intensity buttons
       color: '#ffffff', // White text
       fontSize: moderateScale(15, 0.4),
       fontWeight: 'bold',
       textShadowColor: '#ffffff', // White shadow
       textShadowOffset: { width: 0, height: 0 },
       textShadowRadius: 7, // Increased radius
     },
    popupText: { // Fallback text
      color: '#e0e0e0', // Light grey
      fontSize: moderateScale(18, 0.4),
      textAlign: 'center',
      marginHorizontal: scale(20),
      lineHeight: verticalScale(26),
      textShadowColor: '#ffffff', // White shadow
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 5, // Increased radius
    },
});