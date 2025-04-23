import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { verticalScale, moderateScale } from '@/constants/scaling';
import type { StepComponentProps } from './types'; // Use type import

// Use the props interface
export default function Step01_Welcome({ setValid }: StepComponentProps) {
  // This step is always valid, so set validation true on mount
  useEffect(() => {
    setValid(true);
  }, [setValid]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Congratulations!</Text>
      <Text style={styles.text}>
        You have been selected as a <Text style={styles.highlight}>'Player'</Text>.{'\n\n'}
        Prepare for your journey by answering a few questions to tailor your experience.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: verticalScale(20), // Add padding at the bottom for NavRow space
    width: '100%', // Ensure container takes width for alignment
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#00ff00', // Highlight color
    marginBottom: verticalScale(20), // Space before potential NavRow
    fontFamily: 'PublicSans-Regular',
    paddingHorizontal: moderateScale(10), // Prevent text touching edges
    textAlign: 'center',
  },
  text: {
    fontSize: moderateScale(16),
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(20), // Space before potential NavRow
    fontFamily: 'PublicSans-Regular',
  },
  highlight: {
    color: '#00ff00', // Highlight color
    fontWeight: 'bold',
    fontFamily: 'PublicSans-Bold',
  },
});
