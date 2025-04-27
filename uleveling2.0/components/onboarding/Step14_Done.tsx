import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export const STEP_CONTENT_HEIGHT = verticalScale(250);

export default function Step14_Done({ data, setData, setValid }: StepProps) {

  // This step is always valid
  useEffect(() => {
    console.log('[Step14_Done] useEffect running, calling setValid(true)');
    setValid(true); // Mark step as valid immediately
  }, [setValid]);

  // Log the final data when this step is reached
  useEffect(() => {
    console.log("Onboarding Complete. Final Data:", JSON.stringify(data, null, 2));
  }, [data]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Welcome Player!</Text>
      <Text style={styles.infoText}>
        Your profile is set up. Get ready to level up your life!
      </Text>
      <Text style={styles.infoText}>
        Press NEXT to enter the dashboard.
      </Text>
      {/* The actual navigation is handled by the Next button in the parent screen */}
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    width: '100%',
    minHeight: verticalScale(150), // Ensure some minimum height
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(16, 0.5),
    color: '#00FF00', // Green title
    textShadowColor: '#00FF00',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(25),
    textAlign: 'center',
    textTransform: 'uppercase',
  },
   infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#cccccc',
      textAlign: 'center',
      lineHeight: verticalScale(16),
      marginBottom: verticalScale(15),
      paddingHorizontal: moderateScale(10),
  },
}); 