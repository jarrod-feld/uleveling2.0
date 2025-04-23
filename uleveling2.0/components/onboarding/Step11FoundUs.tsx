import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Button, ScrollView, TextInput, StyleSheet } from 'react-native';
import { OnboardingData } from '../../app/onboarding'; // Adjust path
import { scale, verticalScale, moderateScale } from '../../constants/scaling'; // Added scaling

interface Step11FoundUsProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  selectFoundUsSource: (source: string) => void;
  handleNext: () => void;
}

const FOUND_US_OPTIONS = ['App Store', 'Social Media', 'Friend/Word of Mouth', 'Other'];

const Step11FoundUs: React.FC<Step11FoundUsProps> = ({
  onboardingData,
  setOnboardingData, // Added missing prop
  selectFoundUsSource,
  handleNext,
}) => {
  const [otherSourceText, setOtherSourceText] = useState(onboardingData.foundUsSource === 'Other' ? onboardingData.otherFoundUsSource || '' : '');

  const handleSelectSource = (source: string) => {
    selectFoundUsSource(source); // Update state via passed function
    if (source !== 'Other') {
      setOnboardingData(prev => ({ ...prev, otherFoundUsSource: null })); // Clear other text if not Other
      setOtherSourceText('');
    } else {
       setOtherSourceText(onboardingData.otherFoundUsSource || ''); // Restore text if Other selected
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherSourceText(text);
    if (onboardingData.foundUsSource === 'Other') {
      setOnboardingData(prev => ({ ...prev, otherFoundUsSource: text }));
    }
  }

  return (
    // Use contentWrapper style
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>How did you find us?</Text>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.optionsContainer}>
        {FOUND_US_OPTIONS.map((source) => (
          <TouchableOpacity
            key={source}
            style={[
              styles.choiceButton, // Reuse button style
              onboardingData.foundUsSource === source && styles.choiceButtonSelected,
            ]}
            onPress={() => handleSelectSource(source)}
          >
            <Text style={styles.choiceButtonText}>{source}</Text>
          </TouchableOpacity>
        ))}
        {onboardingData.foundUsSource === 'Other' && (
          <TextInput
            style={[styles.input, { marginTop: verticalScale(15) }]} // Reuse input style
            value={otherSourceText}
            onChangeText={handleOtherTextChange}
            placeholder="Please specify..."
            placeholderTextColor="#888888" // Darker grey placeholder
          />
        )}
      </ScrollView>
    </View>
  );
};

// Add local styles definition
const styles = StyleSheet.create({
  contentWrapper: {
  
    width: '100%',
    alignItems: 'center',
    // justifyContent: 'center', // Let content flow from top
    paddingVertical: verticalScale(20),
  },
  labelText: {
    color: '#cccccc', // Lighter grey
    fontSize: moderateScale(16, 0.3), // Smaller font size
    marginBottom: verticalScale(20), // Reduced margin
    fontWeight: 'normal', // Normal weight
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6, // Reduced radius
    // Removed textTransform and letterSpacing
  },
  scrollView: {
    width: '95%',
    flexGrow: 0,
  },
  optionsContainer: {
    alignItems: 'stretch', // Make buttons stretch
  },
  // Reusing button styles
  choiceButton: { 
    paddingVertical: verticalScale(12), // Slightly less padding
    paddingHorizontal: scale(20),
    backgroundColor: 'transparent', // Removed background
    borderRadius: moderateScale(6),
    borderWidth: moderateScale(1),
    borderColor: '#00ffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(15),
    shadowColor: '#ffffff', // White shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, // Increased opacity
    shadowRadius: 8, // Increased radius
    elevation: 10, // Increased elevation
  },
  choiceButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Very subtle white highlight
    borderColor: '#ffffff', // White border
    shadowColor: '#ffffff', // White shadow
    shadowOpacity: 1.0, // Increased opacity
    shadowRadius: 12, // Increased radius
    elevation: 15, // Increased elevation
  },
  choiceButtonText: {
    color: '#ffffff', // Changed to white
    fontSize: moderateScale(16, 0.4), // Slightly smaller text
    fontWeight: 'bold',
    textShadowColor: '#ffffff', // Changed to white
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Increased radius
  },
  // Input style copied from Step 9
  input: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)', // Darker input background
    color: '#fff',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    fontSize: moderateScale(15, 0.4),
    borderRadius: moderateScale(5),
    borderWidth: moderateScale(0.5),
    borderColor: 'rgba(255, 255, 255, 0.2)', // Faint white border
    textAlign: 'left',
  },
  sourceLabel: {
    color: '#fff',
    fontSize: moderateScale(16, 0.4),
    textAlign: 'center',
    fontFamily: 'PublicSans-Regular', // Add font family
  },
  otherInput: {
    borderWidth: moderateScale(1),
    textAlign: 'center',
    fontSize: moderateScale(16, 0.4),
    borderRadius: moderateScale(5),
    fontFamily: 'PublicSans-Regular', // Add font family
  },
});

export default Step11FoundUs;