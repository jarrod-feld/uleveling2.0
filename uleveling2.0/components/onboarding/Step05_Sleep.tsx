import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { verticalScale, moderateScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';
import TimePickerTriple from '@/components/common/TimePickerTriple'; // Import the new component

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(280);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export default function Step05_Sleep({ data, setData, setValid }: StepProps) {
  console.log("Step05_Sleep rendering. Data:", data);

  // Memoize the callback functions
  const handleWakeTimeChange = useCallback((newTime: string) => {
    console.log("Step05 handleWakeTimeChange called with:", newTime);
    setData(prev => ({ ...prev, sleepWake: newTime }));
  }, [setData]);

  const handleBedTimeChange = useCallback((newTime: string) => {
    console.log("Step05 handleBedTimeChange called with:", newTime);
    setData(prev => ({ ...prev, sleepBed: newTime }));
  }, [setData]);

  // Step is always valid because the pickers provide a default valid time
  useEffect(() => {
    console.log("Step05 setValid effect running");
    setValid(true);
  }, [setValid]);

  return (
    <View style={styles.container}>
    
      <TimePickerTriple
        label="Wake Time:"
        initialTime={data.sleepWake}
        onTimeChange={handleWakeTimeChange}
      />
      <TimePickerTriple
        label="Bed Time:"
        initialTime={data.sleepBed}
        onTimeChange={handleBedTimeChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(30),
    width: '100%',
    justifyContent: 'center',
    flex: 1
  },
 
}); 