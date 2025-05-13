import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { moderateScale, scale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';
import AuthService from '@/services/AuthService';
import AccountService from '@/services/AccountService';
import {
    AppleAuthenticationButton,
    AppleAuthenticationButtonStyle,
    AppleAuthenticationButtonType,
} from 'expo-apple-authentication';
import { useAuth } from '@/contexts/UserContext';

// Exported height for this step's content
export const STEP_CONTENT_HEIGHT = verticalScale(200);

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void;
  setValid: (isValid: boolean) => void;
}

export default function Step00_SignIn({ data, setData, setValid }: StepProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSignInAttemptSuccessful, setIsSignInAttemptSuccessful] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      console.log(`[Step10_SignIn] UserContext has user ID: ${user.id}. Step is valid.`);
      setValid(true);
      setIsSignInAttemptSuccessful(true);
    } else {
      console.log('[Step10_SignIn] UserContext has no user ID. Step is invalid.');
      setValid(false);
    }
  }, [user, setValid]);

  const handleSignInPress = async (method: 'Apple' | 'Anonymous') => {
    if (isAuthenticating || (isSignInAttemptSuccessful && user?.id)) {
      console.log('[Step10_SignIn] SignIn attempt blocked: isAuthenticating or already signed in.');
      return;
    }

    setIsAuthenticating(true);
    setIsSignInAttemptSuccessful(false);

    try {
      let authServiceError: Error | null = null;

      if (method === 'Apple') {
        console.log('[Step10_SignIn] Attempting Apple Sign-in via AccountService...');
        const appleResult = await AccountService.signInWithApple();
        authServiceError = appleResult.error;
      } else if (method === 'Anonymous') {
        console.log('[Step10_SignIn] Attempting Anonymous Sign-in via AccountService...');
        const anonResult = await AccountService.signInAnonymously();
        authServiceError = anonResult.error;
      }

      if (authServiceError) {
        if (authServiceError.message !== 'Sign-in cancelled.') {
          Alert.alert("Authentication Error", authServiceError.message);
        }
        console.error(`[Step10_SignIn] AccountService ${method} Sign-in error:`, authServiceError.message);
      } else {
        console.log(`[Step10_SignIn] AccountService ${method} Sign-in call successful. Waiting for UserContext update.`);
        setIsSignInAttemptSuccessful(true);
      }
    } catch (error: any) {
      console.error('[Step10_SignIn] Critical error during sign-in call:', error);
      Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  let statusContent;
  if (isAuthenticating) {
    statusContent = (
      <View style={styles.centeredStatus}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.statusText}>Connecting...</Text>
      </View>
    );
  } else if (isSignInAttemptSuccessful && user?.id) {
    statusContent = (
      <View style={styles.centeredStatus}>
        <Text style={styles.successText}>Account connected successfully!</Text>
        <Text style={styles.infoText}>You can now proceed.</Text>
      </View>
    );
  } else if (isSignInAttemptSuccessful && !user?.id) {
    statusContent = (
      <View style={styles.centeredStatus}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.statusText}>Finalizing sign-in...</Text>
        <Text style={[styles.infoText, styles.errorText]}>
          Waiting for account confirmation. If this persists, please try again.
        </Text>
      </View>
    );
  } else {
    statusContent = (
      <>
        {Platform.OS === 'ios' && (
          <AppleAuthenticationButton
            buttonType={AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthenticationButtonStyle.WHITE_OUTLINE}
            cornerRadius={moderateScale(8)}
            style={styles.authButton}
            onPress={() => handleSignInPress('Apple')}
          />
        )}
        {Platform.OS !== 'ios' && (
          <TouchableOpacity
            style={[styles.authButton, styles.manualButton]}
            onPress={() => handleSignInPress('Anonymous')}
            disabled={isAuthenticating}
          >
            <Text style={styles.manualButtonText}>Continue Anonymously (Dev)</Text>
          </TouchableOpacity>
        )}
      </>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Connect Your Account</Text>
      {statusContent}
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    height: STEP_CONTENT_HEIGHT,
  },
  label: {
    fontSize: moderateScale(18),
    color: '#FFFFFF',
    marginBottom: verticalScale(20),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  authButton: {
    width: scale(280),
    height: verticalScale(50),
    marginBottom: verticalScale(15),
  },
  manualButton: {
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  centeredStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: '#FFFFFF',
    textAlign: 'center',
  },
  successText: {
    fontSize: moderateScale(18),
    color: '#00FF00',
    fontWeight: 'bold',
    marginBottom: verticalScale(5),
    textAlign: 'center',
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#B0B0B0',
    textAlign: 'center',
  },
  errorText: {
    color: '#FFA500',
    marginTop: verticalScale(5),
  }
}); 