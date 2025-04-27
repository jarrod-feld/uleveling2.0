import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(200);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

type RoadmapChoiceOption = 'Create' | 'Template';
const ROADMAP_OPTIONS: { value: RoadmapChoiceOption; label: string }[] = [
  { value: 'Create', label: 'Create my own goals' },
  { value: 'Template', label: 'Use a template' },
];

export default function Step08_RoadmapChoice({ data, setData, setValid }: StepProps) {

  const handleSelect = (choice: RoadmapChoiceOption) => {
    setData(prev => ({ ...prev, roadmapChoice: choice }));
    setValid(true); // Selecting any option makes the step valid
  };

  // Set initial validity based on whether data.roadmapChoice exists
  useEffect(() => {
    setValid(!!data.roadmapChoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Create Your Roadmap:</Text>
      <View style={styles.optionsContainer}>
        {ROADMAP_OPTIONS.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.button,
              data.roadmapChoice === value && styles.buttonSelected,
            ]}
            onPress={() => handleSelect(value)}
          >
            {/* Use a View for the radio circle */}
            <View style={[styles.radioCircle, data.roadmapChoice === value && styles.radioCircleSelected]}>
              {data.roadmapChoice === value && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={[
              styles.buttonText,
              data.roadmapChoice === value && styles.buttonTextSelected,
            ]}>
              {label}
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
    flex: 1,
    
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(14, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(25),
    textAlign: 'center',
  },
  optionsContainer: {
    alignItems: 'flex-start', // Align options to the left
    width: '90%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: '#000000', // Invisible border initially (or match background)
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    marginBottom: verticalScale(10),
    width: '100%',
    backgroundColor: '#000000', // Black background
  },
  buttonSelected: {
    borderColor: '#00FF00', // Neon green border when selected
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  radioCircle: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10), // Make it a circle
    borderWidth: moderateScale(2),
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    backgroundColor: '#000000',
  },
  radioCircleSelected: {
    borderColor: '#00FF00',
  },
  radioInnerCircle: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#00FF00',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(11, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(6),
    textShadowOffset: { width: 0, height: 0 },
    flexShrink: 1, // Allow text to wrap or shrink if needed
  },
  buttonTextSelected: {
    color: '#00FF00',
    textShadowColor: '#00FF00',
  },
}); 