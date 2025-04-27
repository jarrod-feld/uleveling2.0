import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(130);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

type StatusKey = 'working' | 'school';

export default function Step04_LifeStatus({ data, setData, setValid }: StepProps) {

  const toggleStatus = (key: StatusKey) => {
    setData(prev => {
      const currentStatus = prev.lifeStatus || {};
      const newStatus = { ...currentStatus, [key]: !currentStatus[key] };
      // Remove the key if both are false, otherwise keep the structure
      if (!newStatus.working && !newStatus.school) {
        const { lifeStatus, ...rest } = prev; // Destructure to remove lifeStatus
        return rest;
      } else {
        return { ...prev, lifeStatus: newStatus };
      }
    });
  };

  // This step is always valid (can select none, one, or both)
  useEffect(() => {
    setValid(true);
  }, [setValid]);

  const renderCheckbox = (key: StatusKey, label: string) => {
    const isSelected = !!data.lifeStatus?.[key];
    return (
      <TouchableOpacity
        key={key}
        style={styles.checkboxContainer}
        onPress={() => toggleStatus(key)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkboxCheck}>X</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Status:</Text>
      <View style={styles.checkboxRow}>
        {renderCheckbox('working', 'Working')}
        {renderCheckbox('school', 'School')}
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
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(14, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(25),
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: verticalScale(15),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderWidth: moderateScale(2),
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
    marginRight: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  checkboxCheck: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(14, 0.5),
    color: '#00FF00',
    lineHeight: moderateScale(16, 0.5), // Adjust line height for centering
  },
  checkboxLabel: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(12, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(6),
    textShadowOffset: { width: 0, height: 0 },
  },
}); 