import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { verticalScale, moderateScale, scale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding'; // Import the exported interface

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(130);

// Define StepProps locally or import if defined elsewhere
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

type GenderOption = 'Male' | 'Female' | 'Other';
const GENDER_OPTIONS: GenderOption[] = ['Male', 'Female', 'Other'];

export default function Step03_Gender({ data, setData, setValid }: StepProps) {

  const handleSelect = (gender: GenderOption) => {
    setData(prev => ({ ...prev, gender }));
    setValid(true); // Selecting any option makes the step valid
  };

  // Set initial validity based on whether data.gender exists
  useEffect(() => {
    setValid(!!data.gender);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Gender:</Text>
      <View style={styles.optionsContainer}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.button,
              data.gender === option && styles.buttonSelected, // Highlight if selected
            ]}
            onPress={() => handleSelect(option)}
          >
            <Text style={[
              styles.buttonText,
              data.gender === option && styles.buttonTextSelected,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    width: '100%',
    justifyContent: 'center',
    flex: 1
  },
  label: {
    fontFamily: 'PressStart2P', // 8-bit font
    fontSize: moderateScale(14, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(25),
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    borderWidth: moderateScale(2),
    borderColor: '#FFFFFF', // White border
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(80), // Ensure buttons have some minimum width
    backgroundColor: '#000000', // Black background
  },
  buttonSelected: {
    borderColor: '#00FF00', // Neon green border when selected
    backgroundColor: 'rgba(0, 255, 0, 0.1)', // Slight green tint background
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(12, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(6),
    textShadowOffset: { width: 0, height: 0 },
  },
  buttonTextSelected: {
    color: '#00FF00', // Neon green text when selected
    textShadowColor: '#00FF00',
    textShadowRadius: moderateScale(6),
  },
}); 