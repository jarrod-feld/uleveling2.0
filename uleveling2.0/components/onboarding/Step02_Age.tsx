import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Keyboard } from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding'; // Import the exported interface

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(120);

// Define StepProps locally or import if defined elsewhere
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

const MIN_AGE = 13;
const MAX_AGE = 100;

export default function Step02_Age({ data, setData, setValid }: StepProps) {
  const [ageInput, setAgeInput] = useState<string>(data.age?.toString() || '');

  const validateAndSetAge = (text: string) => {
    setAgeInput(text);
    const num = parseInt(text, 10);
    const isValid = !isNaN(num) && num >= MIN_AGE && num <= MAX_AGE;

    if (isValid) {
      setData(prev => ({ ...prev, age: num }));
    } else {
      // Clear age in data if input becomes invalid
      setData(prev => ({ ...prev, age: undefined }));
    }
    setValid(isValid);
  };

  // Set initial validity
  useEffect(() => {
    const initialAge = data.age;
    const isValid = typeof initialAge === 'number' && initialAge >= MIN_AGE && initialAge <= MAX_AGE;
    setValid(isValid);
    // If there's valid initial data, ensure input reflects it
    if (isValid && ageInput !== initialAge.toString()) {
        setAgeInput(initialAge.toString());
    }
    // Only run on initial mount for this step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDonePress = () => {
    Keyboard.dismiss(); // Dismiss keyboard on pressing Done/Return
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Player Age:</Text>
      <TextInput
        style={styles.input}
        value={ageInput}
        onChangeText={validateAndSetAge}
        keyboardType="number-pad"
        maxLength={3}
        placeholder="??"
        placeholderTextColor="#555555"
        selectionColor="#00FF00" // Neon green cursor
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    width: '100%',
    justifyContent: 'center', // Center content vertically
    flex: 1 // Allow content to fill space given by parent
  },
  label: {
    fontFamily: 'PressStart2P', // 8-bit font
    fontSize: moderateScale(14, 0.5), // Adjusted size for 8-bit
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  input: {
    fontFamily: 'PressStart2P', // 8-bit font
    fontSize: moderateScale(16, 0.5), // Adjusted size for 8-bit
    color: '#00FF00', // Neon green text like selection
    backgroundColor: '#000000', // Simple black background
    borderWidth: moderateScale(2),
    borderColor: '#00ffff', // Bright cyan border
    // Removed borderRadius for blocky look
    width: scale(80), // Adjust width as needed
    height: verticalScale(40), // Adjust height as needed
    textAlign: 'center',
    paddingHorizontal: scale(5),
    // Remove textShadow for input clarity
    // Adjust vertical alignment if needed
    paddingVertical: Platform.OS === 'ios' ? verticalScale(8) : verticalScale(4),
  },
}); 