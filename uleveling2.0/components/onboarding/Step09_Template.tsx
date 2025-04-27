import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Picker from 'react-native-wheel-picker-expo';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(340);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

interface PickerItem {
    label: string;
    value: string;
}

// --- Picker Data ---
const TEMPLATE_OPTIONS: PickerItem[] = [
    { label: "Fitness Foundation", value: "Fitness Foundation" },
    { label: "Career Climb", value: "Career Climb" },
    { label: "Skill Sprint", value: "Skill Sprint" },
    { label: "Social Butterfly", value: "Social Butterfly" },
    // Add more templates as needed
];

const INTENSITY_OPTIONS: PickerItem[] = [
    { label: "Low", value: "Low" },
    { label: "Med", value: "Med" },
    { label: "High", value: "High" },
];

const DEFAULT_TEMPLATE_INDEX = 0;
const DEFAULT_INTENSITY_INDEX = 1; // Default to Med

export default function Step09_Template({ data, setData, setValid }: StepProps) {
  const findInitialIndex = (
      options: PickerItem[],
      value: string | undefined,
      defaultIndex: number
  ): number => {
      if (value === undefined) return defaultIndex;
      const index = options.findIndex(opt => opt.value === value);
      return index >= 0 ? index : defaultIndex;
  };

  const [templateIndex, setTemplateIndex] = useState<number>(() =>
    findInitialIndex(TEMPLATE_OPTIONS, data.template, DEFAULT_TEMPLATE_INDEX)
  );
  const [intensityIndex, setIntensityIndex] = useState<number>(() =>
    findInitialIndex(INTENSITY_OPTIONS, data.templateIntensity, DEFAULT_INTENSITY_INDEX)
  );

  // Update parent state and validation when pickers change
  useEffect(() => {
      // Get current values based on indices
      const selectedTemplate = TEMPLATE_OPTIONS[templateIndex]?.value;
      const selectedIntensity = INTENSITY_OPTIONS[intensityIndex]?.value as OnboardingData['templateIntensity'];

      // Update data in parent state
      setData(prev => ({
          ...prev,
          template: selectedTemplate,
          templateIntensity: selectedIntensity,
      }));

      // Validate: Both must be selected (which they always are due to defaults)
      setValid(true);

  }, [templateIndex, intensityIndex, setData, setValid]);

   // Set initial validity
   useEffect(() => {
      // Initial validity check is implicitly true due to default indices
      setValid(true);
       // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

  // Function to render picker items with 8-bit style
  const renderPickerItem = (props: any): React.ReactElement => {
      const label = props?.label ?? '??';
      const isSelected = props?.isSelected;
      return (
          <Text style={[styles.pickerItemText, isSelected && styles.pickerItemSelectedText]}>
              {label}
          </Text>
      );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Template & Intensity:</Text>

      {/* Template Picker */}
      <View style={styles.pickerGroup}>
        <Text style={styles.pickerLabel}>Template:</Text>
        <Picker
          items={TEMPLATE_OPTIONS}
          initialSelectedIndex={templateIndex}
          onChange={({ index }) => setTemplateIndex(index)}
          height={verticalScale(100)}
          width={scale(220)} // Wider for template names
          backgroundColor="#0d1b2a"
          selectedStyle={styles.pickerSelectedStyle}
          renderItem={renderPickerItem}
          haptics
        />
      </View>

      {/* Intensity Picker */}
      <View style={styles.pickerGroup}>
        <Text style={styles.pickerLabel}>Intensity:</Text>
        <Picker
          items={INTENSITY_OPTIONS}
          initialSelectedIndex={intensityIndex}
          onChange={({ index }) => setIntensityIndex(index)}
          height={verticalScale(100)}
          width={scale(100)}
          backgroundColor="#0d1b2a"
          selectedStyle={styles.pickerSelectedStyle}
          renderItem={renderPickerItem}
          haptics
        />
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(15),
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
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  pickerGroup: {
      alignItems: 'center',
      marginBottom: verticalScale(10),
      width: '100%',
  },
  pickerLabel: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#FFFFFF',
      marginBottom: verticalScale(5),
      textShadowColor: '#26c6ff',
      textShadowRadius: moderateScale(6),
      textShadowOffset: { width: 0, height: 0 },
  },
  pickerSelectedStyle: {
      borderColor: '#00FF00',
      borderWidth: moderateScale(2),
  },
  pickerItemText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5), // Smaller font for potentially long items
      color: '#FFFFFF',
      textShadowColor: '#26c6ff',
      textShadowRadius: moderateScale(6),
      textShadowOffset: { width: 0, height: 0 },
      paddingVertical: verticalScale(1),
      textAlign: 'center',
  },
  pickerItemSelectedText: {
      color: '#00FF00',
      textShadowColor: '#00FF00',
  },
}); 