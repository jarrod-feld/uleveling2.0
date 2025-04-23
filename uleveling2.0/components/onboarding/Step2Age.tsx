import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { scale, verticalScale, moderateScale } from '../../constants/scaling'; // Adjust path as needed
import { OnboardingData } from '../../app/onboarding'; // Adjust path to get type

interface Step2AgeProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  handleNext: () => void;
  AGE_OPTIONS: string[];
}

const Step2Age: React.FC<Step2AgeProps> = ({
  onboardingData,
  setOnboardingData,
  handleNext,
  AGE_OPTIONS,
}) => {
  // Move definitions inside the component
  const pickerData = AGE_OPTIONS.map((age: string) => ({ value: age, label: age }));
  const initialAgeIndex = AGE_OPTIONS.indexOf(onboardingData.age || '18'); // Find index of current age or default
  const initialValue = onboardingData.age || AGE_OPTIONS[initialAgeIndex >= 0 ? initialAgeIndex : 5]; // Default to 18 if not found

  // Function to render the overlay (highlight lines and selected text style)
  const renderPickerOverlay = () => {
    // Calculate approximate vertical position for lines based on itemHeight
    const itemHeight = verticalScale(50); // Match itemHeight prop below
    const lineOffset = itemHeight / 2; 

    return (
      <View style={styles.overlayContainer} pointerEvents="none"> 
        {/* Top Highlight Line */}
        <View style={[styles.highlightLine, { bottom: lineOffset }]} /> 
        {/* Bottom Highlight Line */}
        <View style={[styles.highlightLine, { top: lineOffset }]} />
        {/* Selected Item Style Applied via WheelPicker's internal logic */}
      </View>
    );
  };

  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Select your age:</Text>
      <View style={styles.pickerContainer}>
        <WheelPicker
          data={pickerData}
          onValueChanged={({ item }) => { 
            if (item && typeof item.value === 'string') {
              setOnboardingData(prev => ({ ...prev, age: item.value }));
            }
          }}
          value={initialValue}
          style={styles.pickerStyle}
          itemHeight={verticalScale(50)} // Set item height
          itemTextStyle={styles.pickerItemText} // Non-selected items - Selected style handled internally or via different prop?
          renderOverlay={renderPickerOverlay} // Render custom overlay lines
        />
      </View>
      {/* <Button title="Next" onPress={handleNext} color="#00ffff" disabled={!onboardingData.age} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    
  
  },
  labelText: {
    color: '#e0e0e0',
    fontSize: moderateScale(18, 0.4),
    marginBottom: verticalScale(15),
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'PublicSans-Bold', // Use Bold variant
  },
  pickerContainer: { // Container to control picker size
    height: verticalScale(100), // Fixed height for the picker area
    width: '60%', // Limit width
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  pickerStyle: { // Style the picker itself if needed
    width: '100%',
    height: '100%',
  },
  pickerItemText: {
    fontSize: moderateScale(18, 0.4),
    color: '#aaa',
    fontFamily: 'PublicSans-Regular',
  },
  pickerActiveItemText: {
    fontSize: moderateScale(20, 0.4),
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'PublicSans-Bold', // Use Bold variant
  },
  overlayContainer: { // Container for the highlight lines
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightLine: { // Style for the horizontal highlight lines
    position: 'absolute',
    left: scale(10), // Add some horizontal padding
    right: scale(10),
    height: moderateScale(1.5),
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white
  },
});

export default Step2Age;