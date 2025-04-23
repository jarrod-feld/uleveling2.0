import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { OnboardingData } from '../../app/onboarding'; // Adjust path
import { scale, verticalScale, moderateScale } from '../../constants/scaling'; // Adjust path as needed

interface Step3GenderProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  handleNext: () => void;
  handleBack: () => void;
}

const GENDERS = ['Male', 'Female', 'Other'] as const;

const Step3Gender: React.FC<Step3GenderProps> = ({
  onboardingData,
  setOnboardingData,
  handleNext,
  handleBack,
}) => {
  const selectGender = (gender: typeof GENDERS[number]) => {
    setOnboardingData((prevData) => ({ ...prevData, gender }));
  };

  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Select your gender:</Text>
      <View style={styles.genderButtonContainer}>
        {GENDERS.map((genderOption) => (
          <TouchableOpacity
            key={genderOption}
            style={[
              styles.choiceButton,
              onboardingData.gender === genderOption && styles.choiceButtonSelected,
            ]}
            onPress={() => selectGender(genderOption)}
          >
            <Text style={styles.choiceButtonText}>{genderOption}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    
  },
  labelText: {
    color: '#cccccc', // Lighter grey
    fontSize: moderateScale(16, 0.3), // Smaller font size
    marginBottom: verticalScale(25), // Reduced margin
    fontWeight: 'normal', // Normal weight
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6, // Reduced radius
    
  },
  genderButtonContainer: {
    width: '90%',
    alignItems: 'stretch',
  },
  choiceButton: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    backgroundColor: 'transparent', // Removed background
    borderRadius: moderateScale(6),
    borderWidth: moderateScale(1),
    borderColor: '#aaaaaa', // Grey border
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
    fontSize: moderateScale(17, 0.4),
    fontWeight: 'bold',
    textShadowColor: '#ffffff', // Changed to white
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Increased radius
  },
  checkboxContainer: {
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    borderWidth: moderateScale(1),
    borderColor: '#00ffff',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
    backgroundColor: 'transparent', // Removed background
    width: '100%',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: moderateScale(16, 0.4),
    textAlign: 'center',
    fontFamily: 'PublicSans-Regular', // Add font family
  },
});

export default Step3Gender;