import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../constants/scaling';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Step10SignInProps {
  handleAppleSignIn: () => void;
  handleGoogleSignIn: () => void;
  handleNext: () => void; // For skip button
}

const Step10SignIn: React.FC<Step10SignInProps> = ({
  handleAppleSignIn,
  handleGoogleSignIn,
  handleNext,
}) => {
  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Sign In</Text>
      
      <TouchableOpacity style={[styles.signInButton, styles.googleButton]} onPress={handleGoogleSignIn}>
          <FontAwesome name="google" size={moderateScale(18)} color="#fff" style={styles.buttonIcon} />
          <Text style={[styles.signInButtonText, styles.googleButtonText]}>Sign in with Google</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
          <TouchableOpacity style={[styles.signInButton, styles.appleButton]} onPress={handleAppleSignIn}>
              <FontAwesome name="apple" size={moderateScale(20)} color="#000" style={styles.buttonIcon} />
              <Text style={[styles.signInButtonText, styles.appleButtonText]}>Sign in with Apple</Text>
          </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
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
    marginBottom: verticalScale(30), // Reduced margin
    fontWeight: 'normal', // Normal weight
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6, // Reduced radius
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    borderRadius: moderateScale(6),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: '#ccc', // Light grey border
    minWidth: scale(200),
    backgroundColor: 'transparent', // Removed background
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  buttonIcon: {
    marginRight: scale(10),
  },
  signInButtonText: {
    fontSize: moderateScale(16, 0.4),
    fontWeight: 'bold',
    fontFamily: 'PublicSans-Regular', // Add font family
  },
  googleButtonText: {
      color: '#fff',
  },
  appleButtonText: {
      color: '#000',
  },
  skipButton: {
      marginTop: verticalScale(20),
  },
  skipButtonText: {
      color: '#cccccc', // Light grey/white
      fontSize: moderateScale(14, 0.3),
      textDecorationLine: 'underline',
  },
  buttonContainer: {
    borderColor: '#ccc', // Light grey border
    marginBottom: verticalScale(15),
    minWidth: scale(200),
    backgroundColor: 'transparent', // Removed background
  },
  buttonText: {
    marginLeft: scale(10),
    color: '#fff',
    fontSize: moderateScale(16, 0.4),
    fontFamily: 'PublicSans-Regular', // Add font family
  },
});

export default Step10SignIn;