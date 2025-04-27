import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export const STEP_CONTENT_HEIGHT = verticalScale(180);

const MAX_RATING = 5;

export default function Step12_Rating({ data, setData, setValid }: StepProps) {
  const [rating, setRating] = useState<number | undefined>(data.rating);

  const handleRate = (newRating: number) => {
    setRating(newRating);
    setData(prev => ({ ...prev, rating: newRating }));
    setValid(true); // Selecting any rating makes it valid
  };

  // Validate: A rating must be selected
  useEffect(() => {
      setValid(typeof rating === 'number' && rating > 0 && rating <= MAX_RATING);
  }, [rating, setValid]);

  // Set initial state and validity
  useEffect(() => {
      const initialRating = data.rating;
      setRating(initialRating);
      setValid(typeof initialRating === 'number' && initialRating > 0 && initialRating <= MAX_RATING);
       // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick Rating:</Text>
      <Text style={styles.infoText}>How is your experience so far?</Text>
      <View style={styles.starsContainer}>
        {Array.from({ length: MAX_RATING }).map((_, index) => {
          const currentRatingValue = index + 1;
          const isSelected = rating !== undefined && currentRatingValue <= rating;
          return (
            <TouchableOpacity
              key={currentRatingValue}
              onPress={() => handleRate(currentRatingValue)}
              style={styles.starButton}
            >
              <Text style={[styles.starText, isSelected && styles.starTextSelected]}>
                {
                  // Use a simple character for star - replace with icon later if needed
                  '★' // Or use a block character: '■'
                }
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
    fontSize: moderateScale(14, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#cccccc',
      textAlign: 'center',
      marginBottom: verticalScale(25),
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    paddingHorizontal: scale(8), // Spacing between stars
    paddingVertical: verticalScale(5),
  },
  starText: {
    fontFamily: 'PressStart2P', // Or keep default if using unicode star
    fontSize: moderateScale(30, 0.5), // Large stars
    color: '#555555', // Dimmed/unselected color
    // No text shadow for unselected?
  },
  starTextSelected: {
    color: '#FFFF00', // Yellow for selected star
    textShadowColor: '#FFA500', // Orange glow for selected star
    textShadowRadius: moderateScale(6),
    textShadowOffset: { width: 0, height: 0 },
  },
}); 