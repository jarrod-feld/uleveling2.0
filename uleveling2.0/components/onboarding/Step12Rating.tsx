import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../constants/scaling';

interface Step12RatingProps {
  selectRating: (rating: number) => void;
  handleNext: () => void; // For Skip action
}

const Step12Rating: React.FC<Step12RatingProps> = ({
  selectRating,
  handleNext,
}) => {
  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Enjoying the setup?</Text>
      <Text style={styles.subLabelText}>
        A quick rating helps us improve!
      </Text>
      <View style={styles.buttonRow}>
        {[1, 2, 3, 4, 5].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => selectRating(num)}
            style={styles.ratingButton}
          >
            <Text style={styles.ratingButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
        <Text style={styles.skipButtonText}>Skip</Text>
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
  },
  labelText: {
    color: '#cccccc', // Lighter grey
    fontSize: moderateScale(16, 0.3), // Smaller font size
    marginBottom: verticalScale(5), // Reduced margin
    fontWeight: 'normal', // Normal weight
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6, // Reduced radius
  },
  subLabelText: {
    color: '#bbbbbb', // Lighter grey
    fontSize: moderateScale(14, 0.3),
    marginBottom: verticalScale(30),
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '90%',
    marginBottom: verticalScale(40),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: verticalScale(20),
  },
  ratingButton: {
    borderWidth: moderateScale(1),
    borderColor: '#00ffff',
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20), // Make it circular
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent' // Removed background
  },
  ratingButtonChecked: {
    borderColor: '#00ffaa', // Brighter border when selected
    shadowColor: '#00ffaa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  ratingButtonText: {
    color: '#00ffff',
    fontSize: moderateScale(16, 0.4),
    fontWeight: 'bold',
    fontFamily: 'PublicSans-Bold', // Add font family (Bold)
  },
  ratingButtonTextChecked: {
    color: '#00ffaa', // Brighter text when selected
  },
  skipButton: {
    marginTop: verticalScale(10), // Added margin top for spacing
  },
  skipButtonText: {
    color: '#cccccc', // Light grey/white
    fontSize: moderateScale(14, 0.3),
    textDecorationLine: 'underline',
  }
});

export default Step12Rating;