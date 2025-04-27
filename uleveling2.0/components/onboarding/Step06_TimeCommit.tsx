import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Keyboard } from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Exported height for this step's content
// Note: This might vary slightly if only one input is shown, but we use a fixed estimate.
export const STEP_CONTENT_HEIGHT = verticalScale(250);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

const isValidHours = (text: string): boolean => {
    const num = parseInt(text, 10);
    return !isNaN(num) && num >= 0 && num <= 168; // Max 168 hours/week
};

export default function Step06_TimeCommit({ data, setData, setValid }: StepProps) {
  const showWorkInput = !!data.lifeStatus?.working;
  const showSchoolInput = !!data.lifeStatus?.school;

  const [workHoursInput, setWorkHoursInput] = useState<string>(
    data.hoursWork?.toString() || ''
  );
  const [schoolHoursInput, setSchoolHoursInput] = useState<string>(
    data.hoursSchool?.toString() || ''
  );

  const handleHoursChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    dataKey: keyof Pick<OnboardingData, 'hoursWork' | 'hoursSchool'>
  ) => {
    setter(value);
    if (isValidHours(value)) {
      setData(prev => ({ ...prev, [dataKey]: parseInt(value, 10) }));
    } else {
      setData(prev => {
          const newData = { ...prev };
          delete newData[dataKey];
          return newData;
      });
    }
  };

  // Validate step: Check if all *required* inputs are valid
  useEffect(() => {
    let valid = true;
    if (showWorkInput && !isValidHours(workHoursInput)) {
      valid = false;
    }
    if (showSchoolInput && !isValidHours(schoolHoursInput)) {
      valid = false;
    }
    // If neither is required, it's valid by default (or becomes valid if inputs are cleared)
    if (!showWorkInput && !showSchoolInput) {
        valid = true;
    }
    setValid(valid);
  }, [workHoursInput, schoolHoursInput, showWorkInput, showSchoolInput, setValid]);

  // Set initial state and validity
  useEffect(() => {
    const initialWork = data.hoursWork?.toString() || '';
    const initialSchool = data.hoursSchool?.toString() || '';
    setWorkHoursInput(initialWork);
    setSchoolHoursInput(initialSchool);

    let initiallyValid = true;
    if (showWorkInput && !isValidHours(initialWork)) {
        initiallyValid = false;
    }
    if (showSchoolInput && !isValidHours(initialSchool)) {
        initiallyValid = false;
    }
    if (!showWorkInput && !showSchoolInput) {
        initiallyValid = true;
    }
    setValid(initiallyValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const handleDonePress = () => {
    Keyboard.dismiss();
  };

  // Render nothing if neither status is selected (shouldn't happen with step logic, but safe)
  if (!showWorkInput && !showSchoolInput) {
      return (
          <View style={styles.container}>
              <Text style={styles.label}>Time Commitment</Text>
              <Text style={styles.infoText}>Status not selected in previous step.</Text>
              {/* Or maybe automatically advance/validate? For now, show info */}
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Weekly Time Commitment:</Text>
      <View style={styles.inputColumn}> // Use column for potentially multiple inputs
        {showWorkInput && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Work Hours/Week:</Text>
            <TextInput
              style={styles.input}
              value={workHoursInput}
              onChangeText={(text) => handleHoursChange(text, setWorkHoursInput, 'hoursWork')}
              placeholder="e.g. 40"
              placeholderTextColor="#555555"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleDonePress}
              blurOnSubmit={true}
              maxLength={3}
              selectionColor="#00FF00"
            />
          </View>
        )}
        {showSchoolInput && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>School Hours/Week:</Text>
            <TextInput
              style={styles.input}
              value={schoolHoursInput}
              onChangeText={(text) => handleHoursChange(text, setSchoolHoursInput, 'hoursSchool')}
              placeholder="e.g. 15"
              placeholderTextColor="#555555"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleDonePress}
              blurOnSubmit={true}
              maxLength={3}
              selectionColor="#00FF00"
            />
          </View>
        )}
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
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  inputColumn: {
      width: '80%', // Center the column
      alignItems: 'center',
  },
  inputGroup: {
      alignItems: 'center',
      marginBottom: verticalScale(15), // Space between inputs if both shown
      width: '100%', // Ensure group takes width for centering input
  },
  inputLabel: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#FFFFFF',
      marginBottom: verticalScale(8),
      textShadowColor: '#26c6ff',
      textShadowRadius: moderateScale(6),
      textShadowOffset: { width: 0, height: 0 },
      textAlign: 'center',
  },
  input: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(14, 0.5),
    color: '#00FF00',
    backgroundColor: '#000000',
    borderWidth: moderateScale(2),
    borderColor: '#00ffff',
    width: scale(100),
    height: verticalScale(40),
    textAlign: 'center',
    paddingHorizontal: scale(5),
    paddingVertical: Platform.OS === 'ios' ? verticalScale(8) : verticalScale(4),
  },
  infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#888888',
      textAlign: 'center',
      marginTop: verticalScale(10),
  }
}); 