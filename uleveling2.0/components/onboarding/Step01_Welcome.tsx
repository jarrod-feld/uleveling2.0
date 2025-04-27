import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding'; // Assuming OnboardingData is exported or moved

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(180);

// Define StepProps locally or import if defined elsewhere
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export default function Step01_Welcome({ setValid }: StepProps) {
  // This step is always valid
  useEffect(() => {
    setValid(true);
  }, [setValid]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.txt}>
        You have acquired the qualifications{'\n'}
        to become the <Text style={styles.bold}>"Player"</Text>.{'\n'}
        Will you accept?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(30),
  },
  txt: {
    color: '#ffffff',
    fontSize: moderateScale(12, 0.5),
    textAlign: 'center',
    lineHeight: verticalScale(20),
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    fontFamily: 'PressStart2P',
  },
  bold: {
    color: '#00ffff',
    fontFamily: 'PressStart2P',
  },
});
