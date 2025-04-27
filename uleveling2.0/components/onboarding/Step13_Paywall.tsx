import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export const STEP_CONTENT_HEIGHT = verticalScale(280);

export default function Step13_Paywall({ data, setData, setValid }: StepProps) {

  // This step is always valid
  useEffect(() => {
    setValid(true);
  }, [setValid]);

  const handleCtaPress = () => {
      console.log("Paywall CTA Pressed! (Placeholder)");
      // No Superwall logic here for now
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Unlock Premium</Text>
      <Text style={styles.infoText}>
        Gain access to advanced features, exclusive templates, and priority support!
      </Text>

      {/* Placeholder CTA Button */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={handleCtaPress}
      >
        <Text style={styles.ctaButtonText}>View Premium Options</Text>
      </TouchableOpacity>

       <TouchableOpacity onPress={() => { /* Allow skipping for now */ }}>
            <Text style={styles.skipText}>Maybe Later</Text>
       </TouchableOpacity>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    width: '100%',
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(16, 0.5),
    color: '#FFFF00', // Yellow title
    textShadowColor: '#FFA500',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(15),
    textAlign: 'center',
    textTransform: 'uppercase',
  },
   infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#cccccc',
      textAlign: 'center',
      lineHeight: verticalScale(16),
      marginBottom: verticalScale(30),
      paddingHorizontal: scale(10),
  },
  ctaButton: {
    width: '90%',
    paddingVertical: verticalScale(12),
    borderWidth: moderateScale(2),
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.2)', // Green tint
    marginBottom: verticalScale(15),
    alignItems: 'center',
  },
  ctaButtonText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(12, 0.5),
    color: '#00FF00',
    textShadowColor: '#00FF00',
    textShadowRadius: moderateScale(6),
  },
  skipText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(9, 0.5),
      color: '#888888',
      marginTop: verticalScale(5),
      textDecorationLine: 'underline',
  }
}); 