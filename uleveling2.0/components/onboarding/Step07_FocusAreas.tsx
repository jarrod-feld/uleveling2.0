import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// Exported height for this step's content
// Note: This might vary slightly if "Other" input is shown.
export const STEP_CONTENT_HEIGHT = verticalScale(230);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

const FOCUS_AREAS = ['Fitness', 'Career', 'Skills', 'Social'];
const OTHER_KEY = 'Other';

export default function Step07_FocusAreas({ data, setData, setValid }: StepProps) {
  const [otherText, setOtherText] = useState<string>(data.focusAreasOtherText || '');

  const toggleFocusArea = (key: string) => {
    setData(prev => {
      const currentAreas = prev.focusAreas || {};
      const newAreas = { ...currentAreas, [key]: !currentAreas[key] };

      // Remove key if deselected
      if (!newAreas[key]) {
        delete newAreas[key];
      }

      // Update focusAreas, handle empty object case
      if (Object.keys(newAreas).length === 0) {
        const { focusAreas, ...rest } = prev;
        return { ...rest, focusAreasOtherText: otherText || undefined }; // Keep otherText if any
      } else {
        return { ...prev, focusAreas: newAreas, focusAreasOtherText: otherText || undefined };
      }
    });
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    setData(prev => ({ ...prev, focusAreasOtherText: text || undefined }));
  };

  // Validate step: At least one checkbox must be selected OR the Other text box must have text
  useEffect(() => {
    const hasSelection = data.focusAreas && Object.values(data.focusAreas).some(v => v);
    const otherIsValid = !!data.focusAreasOtherText?.trim();
    setValid(hasSelection || otherIsValid);
  }, [data.focusAreas, data.focusAreasOtherText, setValid]);

  // Set initial validity
   useEffect(() => {
    const initialAreas = data.focusAreas || {};
    const initialOtherText = data.focusAreasOtherText || '';
    setOtherText(initialOtherText);
    const hasInitialSelection = Object.values(initialAreas).some(v => v);
    const initialOtherIsValid = !!initialOtherText.trim();
    setValid(hasInitialSelection || initialOtherIsValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const handleDonePress = () => {
    Keyboard.dismiss();
  };

  const renderCheckbox = (key: string, label: string) => {
    const isSelected = !!data.focusAreas?.[key];
    return (
      <TouchableOpacity
        key={key}
        style={styles.checkboxContainer}
        onPress={() => toggleFocusArea(key)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkboxCheck}>X</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const isOtherSelected = !!data.focusAreas?.[OTHER_KEY];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Focus Areas (Select ≥1):</Text>
      <View style={styles.checkboxGrid}> // Use a grid or wrap layout
        {FOCUS_AREAS.map((area) => renderCheckbox(area, area))}
        {/* Render "Other" checkbox separately */} 
        {renderCheckbox(OTHER_KEY, OTHER_KEY)}
      </View>

      {/* Conditionally render TextInput for "Other" */}
      {isOtherSelected && (
        <View style={styles.otherInputContainer}>
          <Text style={styles.inputLabel}>Specify Other:</Text>
          <TextInput
            style={styles.input}
            value={otherText}
            onChangeText={handleOtherTextChange}
            placeholder="Type here..."
            placeholderTextColor="#555555"
            returnKeyType="done"
            onSubmitEditing={handleDonePress}
            blurOnSubmit={false} // Allow manual dismiss
            selectionColor="#00FF00"
          />
        </View>
      )}
    </View>
  );
}

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
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow items to wrap to next line
    justifyContent: 'center', // Center items horizontally
    width: '95%',
    marginBottom: verticalScale(15),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%', // Roughly two items per row
    marginBottom: verticalScale(10),
    marginHorizontal: scale(5),
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderWidth: moderateScale(2),
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
    marginRight: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  checkboxCheck: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(12, 0.5),
    color: '#00FF00',
    lineHeight: moderateScale(14, 0.5),
  },
  checkboxLabel: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(10, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(6),
    textShadowOffset: { width: 0, height: 0 },
    flexShrink: 1, // Allow text to shrink if needed
  },
  otherInputContainer: {
      width: '90%',
      alignItems: 'center',
      marginTop: verticalScale(5),
      borderTopWidth: moderateScale(1),
      borderTopColor: '#555', // Separator line
      paddingTop: verticalScale(15),
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
    fontSize: moderateScale(12, 0.5),
    color: '#00FF00',
    backgroundColor: '#000000',
    borderWidth: moderateScale(2),
    borderColor: '#00ffff',
    width: '90%', // Make input wider
    height: verticalScale(40),
    textAlign: 'left', // Align text left for sentence input
    paddingHorizontal: scale(8),
    paddingVertical: Platform.OS === 'ios' ? verticalScale(8) : verticalScale(4),
  },
}); 