import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OnboardingData } from '../../app/onboarding'; // Adjust path
import { scale, verticalScale, moderateScale } from '../../constants/scaling';

interface Step8RoadmapChoiceProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  handleNext: () => void;
}

const Step8RoadmapChoice: React.FC<Step8RoadmapChoiceProps> = ({
  onboardingData,
  setOnboardingData,
  handleNext,
}) => {
  const chooseRoadmap = (choice: 'create' | 'template') => {
    setOnboardingData((prevData) => ({ ...prevData, roadmapChoice: choice }));
  };

  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Create your Roadmap:</Text>
      <View style={styles.buttonColumn}>
        <TouchableOpacity
          style={[
            styles.choiceButton,
            onboardingData.roadmapChoice === 'create' && styles.choiceButtonSelected,
          ]}
          onPress={() => chooseRoadmap('create')}
        >
          <Text style={styles.choiceButtonText}>Create your Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.choiceButton,
            onboardingData.roadmapChoice === 'template' && styles.choiceButtonSelected,
          ]}
          onPress={() => chooseRoadmap('template')}
        >
          <Text style={styles.choiceButtonText}>Use a Template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Step8RoadmapChoice;

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
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
  buttonColumn: {
    width: '90%',
    alignItems: 'stretch',
  },
  choiceButton: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    backgroundColor: 'transparent', // Removed background
    borderRadius: moderateScale(6),
    borderWidth: moderateScale(1),
    borderColor: '#00ffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
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
  choiceLabel: {
    color: '#fff',
    fontSize: moderateScale(16, 0.4),
    textAlign: 'center',
    fontFamily: 'PublicSans-Regular', // Add font family
  },
});