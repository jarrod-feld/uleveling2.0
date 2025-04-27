import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { moderateScale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding'; // Adjust path if necessary

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(150);

// Define StepProps locally or import if defined elsewhere
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export default function Step00_Username({ data, setData, setValid }: StepProps) {
  const [name, setName] = useState(data.name || '');

  // Update validation whenever name changes
  useEffect(() => {
    const isValid = name.trim().length > 0;
    setValid(isValid);
  }, [name, setValid]);

  // Update parent state on name change
  const handleNameChange = (text: string) => {
    setName(text);
    setData(prev => ({ ...prev, name: text.trim() }));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>What is your name, Player?</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={handleNameChange}
        placeholder="Enter your name"
        placeholderTextColor="#555"
        maxLength={50} // Optional: limit name length
        autoCapitalize="words"
        returnKeyType="done"
        autoFocus // Focus on mount
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
  },
  label: {
    color: '#ffffff',
    fontSize: moderateScale(12, 0.5),
    textAlign: 'center',
    marginBottom: verticalScale(15),
    fontFamily: 'PressStart2P', // Consistent font
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
  },
  input: {
    width: '100%',
    backgroundColor: '#1e2a3a', // Slightly lighter than bg
    color: '#ffffff',
    fontSize: moderateScale(14, 0.5),
    paddingHorizontal: moderateScale(12),
    paddingVertical: Platform.OS === 'ios' ? verticalScale(12) : verticalScale(8), // Adjust padding for platform
    borderWidth: moderateScale(2),
    borderColor: '#00ffff', // Cyan border like popup
    borderRadius: moderateScale(5),
    textAlign: 'center',
    fontFamily: 'PressStart2P', // Use the video game font
  },
});
