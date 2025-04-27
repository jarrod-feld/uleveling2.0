import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';
import AuthService from '@/services/AuthService';
import {
    AppleAuthenticationButton,
    AppleAuthenticationButtonStyle,
    AppleAuthenticationButtonType,
} from 'expo-apple-authentication';

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(260);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export default function Step10_SignIn({ data, setData, setValid }: StepProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSignInAttempted, setIsSignInAttempted] = useState(false);

  useEffect(() => {
      setValid(false);
      setIsAuthenticating(false);
      setIsSignInAttempted(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignInPress = async (method: 'Apple' | 'Google') => {
    if (isAuthenticating || isSignInAttempted) return;

    setIsAuthenticating(true);
    setIsSignInAttempted(true);

    try {
      let result: { user: any; session: any; error: Error | null } | null = null;
      if (method === 'Apple') {
        result = await AuthService.signInWithApple();
      } else if (method === 'Google') {
        console.log('Google button pressed - Skipping Sign-In for now.');
        setValid(true);
        return;
      }

      if (result?.error) {
        if (result.error.message !== 'Sign-in cancelled.') {
            Alert.alert("Authentication Error", result.error.message);
        }
        setValid(false);
        setIsSignInAttempted(false);
      } else if (result?.session || result?.user) {
        Alert.alert("Success", "Authentication successful!");
        setValid(true);
      } else {
          console.log('[Step10_SignIn] Sign-in attempt finished with no error/session/user.')
          setValid(false);
          setIsSignInAttempted(false);
      }

    } catch (error: any) {
        Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred.");
        setValid(false);
        setIsSignInAttempted(false);
    } finally {
        setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Account Setup:</Text>
      <Text style={styles.infoText}>Connect your account to save progress:</Text>

      {isAuthenticating && <ActivityIndicator size="small" color="#FFFFFF" style={styles.activityIndicator} />}

      {/* Use Expo Apple Authentication Button (only on iOS/macOS) */}
      {(Platform.OS === 'ios' || Platform.OS === 'macos') && (
            // Wrap the button to handle disabled state
            <View style={[styles.appleButtonContainer, (isAuthenticating || isSignInAttempted) && styles.buttonDisabledExpo]}>
                <AppleAuthenticationButton
                    buttonType={AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthenticationButtonStyle.BLACK} // Or .WHITE / .WHITE_OUTLINE
                    cornerRadius={moderateScale(5)}
                    style={styles.appleButtonExpo} // Apply fixed size style here
                    onPress={() => {
                        // Only call handler if not disabled
                        if (!(isAuthenticating || isSignInAttempted)) {
                            handleSignInPress('Apple');
                        }
                    }}
                    // Remove direct disabled prop
                />
            </View>
      )}

      <TouchableOpacity
        style={[
            styles.button,
            styles.googleButton,
            (isAuthenticating || isSignInAttempted) && styles.buttonDisabled
        ]}
        onPress={() => handleSignInPress('Google')}
        disabled={isAuthenticating || isSignInAttempted}
      >
        <Text style={[styles.buttonText, (isAuthenticating || isSignInAttempted) && styles.buttonTextDisabled]}>
            Sign In with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    width: '100%',
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(14, 0.5),
    color: '#FFFFFF',
    textShadowColor: '#26c6ff',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
   infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#cccccc',
      textAlign: 'center',
      marginBottom: verticalScale(25),
  },
  activityIndicator: {
      marginBottom: verticalScale(10),
  },
  appleButtonContainer: {
      width: '90%',
      marginBottom: verticalScale(15),
  },
  appleButtonExpo: {
      width: '100%',
      height: verticalScale(48),
  },
  button: {
    width: '90%',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    borderWidth: moderateScale(2),
    backgroundColor: '#000000',
    marginBottom: verticalScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: verticalScale(48),
  },
  googleButton: {
    borderColor: '#00ffff',
  },
  buttonText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(11, 0.5),
    color: '#FFFFFF',
  },
  buttonDisabledExpo: {
      opacity: 0.5,
  },
  buttonDisabled: {
      backgroundColor: '#333333',
      borderColor: '#555555',
      opacity: 0.6,
  },
  buttonTextDisabled: {
      color: '#888888',
  },
}); 