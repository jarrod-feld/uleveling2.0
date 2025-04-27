import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
  ScrollView
} from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(290);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

const OPTIONS = ["Social Media", "Friend", "App Store", "Advertisement", "Other"];
const OTHER_VALUE = "Other";

export default function Step11_FoundUs({ data, setData, setValid }: StepProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(data.foundUs);
  const [otherText, setOtherText] = useState<string>(data.foundUsOtherText || '');

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    setData(prev => ({
        ...prev,
        foundUs: option,
        // Clear other text if a non-other option is selected
        foundUsOtherText: option === OTHER_VALUE ? prev.foundUsOtherText : undefined,
    }));
    // If Other is selected, validity depends on text input
    if (option !== OTHER_VALUE) {
        setValid(true);
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    setData(prev => ({ ...prev, foundUsOtherText: text || undefined }));
  };

  // Validation: An option must be selected. If 'Other' is selected, text must be entered.
  useEffect(() => {
      let isValid = false;
      if (selectedOption) {
          if (selectedOption === OTHER_VALUE) {
              isValid = !!otherText.trim();
          } else {
              isValid = true;
          }
      }
      setValid(isValid);
  }, [selectedOption, otherText, setValid]);

  // Set initial state & validity
   useEffect(() => {
    const initialOption = data.foundUs;
    const initialOtherText = data.foundUsOtherText || '';
    setSelectedOption(initialOption);
    setOtherText(initialOtherText);

    let initiallyValid = false;
    if (initialOption) {
        if (initialOption === OTHER_VALUE) {
            initiallyValid = !!initialOtherText.trim();
        } else {
            initiallyValid = true;
        }
    }
    setValid(initiallyValid);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDonePress = () => {
    Keyboard.dismiss();
  };

  const renderRadioOption = (option: string) => {
    const isSelected = selectedOption === option;
    return (
      <TouchableOpacity
        key={option}
        style={[styles.radioButton, isSelected && styles.radioButtonSelected]}
        onPress={() => handleSelect(option)}
      >
        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
          {isSelected && <View style={styles.radioInnerCircle} />}
        </View>
        <Text style={[styles.buttonText, isSelected && styles.buttonTextSelected]}>
          {option}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    // Use ScrollView in case content overflows on small screens
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
            <Text style={styles.label}>How did you find us?</Text>
            <View style={styles.optionsContainer}>
                {OPTIONS.map(renderRadioOption)}
            </View>

            {selectedOption === OTHER_VALUE && (
                <View style={styles.otherInputContainer}>
                <Text style={styles.inputLabel}>Please Specify:</Text>
                <TextInput
                    style={styles.input}
                    value={otherText}
                    onChangeText={handleOtherTextChange}
                    placeholder="Where?"
                    placeholderTextColor="#555555"
                    returnKeyType="done"
                    onSubmitEditing={handleDonePress}
                    blurOnSubmit={false}
                    selectionColor="#00FF00"
                />
                </View>
            )}
        </View>
    </ScrollView>
  );
}

// --- Styles --- (Similar to Step 8)
const styles = StyleSheet.create({
  scrollContainer: {
      flexGrow: 1, // Allow content to grow
      justifyContent: 'center', // Center content vertically if it doesn't scroll
  },
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(15),
    width: '100%',
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(14, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  optionsContainer: {
    alignItems: 'flex-start',
    width: '90%',
    marginBottom: verticalScale(15),
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderColor: 'transparent', // Hide border until selected for cleaner look
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(10),
    marginBottom: verticalScale(8),
    width: '100%',
  },
  radioButtonSelected: {
    // Add a subtle background or border change if desired when selected
    // backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: moderateScale(2),
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    backgroundColor: '#000000',
  },
  radioCircleSelected: {
    borderColor: '#00FF00',
  },
  radioInnerCircle: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(4.5),
    backgroundColor: '#00FF00',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(10, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(6),
    textShadowOffset: { width: 0, height: 0 },
    flexShrink: 1,
  },
  buttonTextSelected: {
    color: '#00FF00',
    textShadowColor: '#00FF00',
  },
  otherInputContainer: {
      width: '90%',
      alignItems: 'center',
      marginTop: verticalScale(0),
      borderTopWidth: moderateScale(1),
      borderTopColor: '#555',
      paddingTop: verticalScale(10),
  },
   inputLabel: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#FFFFFF',
      marginBottom: verticalScale(8),
      textShadowColor: '#26c6ff',
      textShadowRadius: moderateScale(6),
      textShadowOffset: { width: 0, height: 0 },
      textAlign: 'center',
  },
  input: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(11, 0.5),
    color: '#00FF00',
    backgroundColor: '#000000',
    borderWidth: moderateScale(2),
    borderColor: '#00ffff',
    width: '100%',
    height: verticalScale(40),
    textAlign: 'left',
    paddingHorizontal: scale(8),
    paddingVertical: Platform.OS === 'ios' ? verticalScale(8) : verticalScale(4),
  },
}); 