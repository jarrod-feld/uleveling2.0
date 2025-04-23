import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../constants/scaling'; // Using correct relative path

interface Step1WelcomeProps {
  handleNext: () => void;
}

const Step1Welcome: React.FC<Step1WelcomeProps> = ({ handleNext }) => {
  return (
    // Use contentWrapper style for consistency
    <View style={styles.contentWrapper}>
      {/* Updated Text to match the new image */}
      <Text style={styles.popupText}>
        You Have Acquired the
        {'\n'} {/* Line break */}
        Qualifications to become the
        {'\n'} {/* Line break */}
        "
        <Text style={styles.boldText}>Player</Text>
        ". Will you Accept?
      </Text>
      {/* No buttons here, navigation handled by parent */}
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  
 
  },
  popupText: {
    color: '#ffffff', // Changed to white
    fontSize: moderateScale(17, 0.4),
    textAlign: 'center',
    lineHeight: verticalScale(28),
    // Adjusted text shadow for subtle white glow
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Use radius 8 for consistency
    fontFamily: 'PublicSans-Regular', // Add font family
   
  },
  // Add style for bold text
  boldText: {
    fontWeight: 'bold',
  },
  // Removed highlightedText style
});

export default Step1Welcome;