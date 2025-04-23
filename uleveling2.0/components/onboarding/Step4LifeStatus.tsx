import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OnboardingData } from '../../app/onboarding'; // Adjust path
import { scale, verticalScale, moderateScale } from '../../constants/scaling';

interface Step4LifeStatusProps {
  onboardingData: OnboardingData;
  toggleLifeStatus: (key: 'working' | 'school') => void; // Toggle working or school status
}

// Define life status options
const lifeStatusOptions = [
  "School","Work"
] as const;

type LifeStatus = (typeof lifeStatusOptions)[number];

const Step4LifeStatus: React.FC<Step4LifeStatusProps> = ({
  onboardingData,
  toggleLifeStatus,
}) => {
  const selectLifeStatus = (status: LifeStatus) => {
    // Map 'School' to 'school', 'Work' to 'working'
    const key: 'working' | 'school' = status === 'Work' ? 'working' : 'school';
    toggleLifeStatus(key);
  };

  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>What describes your current status?</Text>
      <View style={styles.buttonContainer}>
        {lifeStatusOptions.map((status) => {
          const key: 'working' | 'school' = status === 'Work' ? 'working' : 'school';
          const isSelected = onboardingData.lifeStatus[key];
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                isSelected && styles.statusButtonSelected,
              ]}
              onPress={() => selectLifeStatus(status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  isSelected && styles.statusButtonTextSelected,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  labelText: {
    color: '#cccccc',
    fontSize: moderateScale(16, 0.3),
    marginBottom: verticalScale(20),
    fontWeight: 'normal',
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  buttonContainer: {
    width: '90%',
    alignItems: 'stretch',
  },
  statusButton: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    backgroundColor: 'transparent',
    borderRadius: moderateScale(6),
    borderWidth: moderateScale(1),
    borderColor: '#aaaaaa',
    marginBottom: verticalScale(12), // Slightly smaller margin
    alignItems: 'center', // Center text horizontally
  },
  statusButtonSelected: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderColor: '#00ffff',
  },
  statusButtonText: {
    color: '#cccccc',
    fontSize: moderateScale(15, 0.3),
    fontWeight: 'bold',
  },
  statusButtonTextSelected: {
    color: '#00ffff',
  },
  checkboxContainer: {
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    borderWidth: moderateScale(1),
    borderColor: '#00ffff',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
    backgroundColor: 'transparent',
    width: '100%',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: moderateScale(16, 0.4),
    textAlign: 'center',
    fontFamily: 'PublicSans-Regular',
  },
});

export default Step4LifeStatus;