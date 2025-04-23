import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../constants/scaling';

const NEXT_BUTTON_GREEN = '#39ff14'; // Define green color locally if needed

interface Step13PaywallProps {
  handleNext: () => void;
}

const Step13Paywall: React.FC<Step13PaywallProps> = ({
  handleNext,
}) => {
  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Unlock Your Potential</Text>
      <Text style={styles.popupText}>
        Subscribe now to access all features, AI goal generation, personalized
        roadmaps, and more!
      </Text>
      <View style={styles.paywallPlaceholder}>
        <Text style={styles.paywallPlaceholderText}>
          (Paywall Component Goes Here)
        </Text>
      </View>
      <TouchableOpacity style={styles.choiceButton} onPress={handleNext}>
        <Text style={styles.choiceButtonText}>Continue to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
   
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(10),
  },
  labelText: {
    color: '#cccccc', // Lighter grey
    fontSize: moderateScale(16, 0.3), // Smaller font size
    marginBottom: verticalScale(15), // Reduced margin
    fontWeight: 'normal', // Normal weight
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6, // Reduced radius
  },
  popupText: {
    color: '#e0e0e0', // Light grey
    fontSize: moderateScale(16, 0.4),
    textAlign: 'center',
    marginHorizontal: scale(15),
    lineHeight: verticalScale(24),
    marginBottom: verticalScale(20),
    textShadowColor: 'rgba(224, 224, 224, 0.5)', // Light grey shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4, // Increased radius
  },
  paywallPlaceholder: {
    marginVertical: verticalScale(30),
    padding: scale(20),
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallPlaceholderText: {
    color: '#888',
    fontStyle: 'italic',
  },
  choiceButton: { // Style for the "Continue" button
    width: '90%',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    backgroundColor: 'rgba(0, 20, 10, 0.3)', // Very subtle dark green background
    borderRadius: moderateScale(6),
    borderWidth: moderateScale(1),
    borderColor: NEXT_BUTTON_GREEN, // Green border
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(20),
    shadowColor: NEXT_BUTTON_GREEN, // Green shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, // Increased opacity
    shadowRadius: 10, // Increased radius
    elevation: 12, // Increased elevation
  },
  choiceButtonText: { // Text for the "Continue" button
    color: NEXT_BUTTON_GREEN, // Green text
    fontSize: moderateScale(16, 0.4),
    fontWeight: 'bold',
    textShadowColor: NEXT_BUTTON_GREEN, // Green shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Increased radius
  },
});

export default Step13Paywall;