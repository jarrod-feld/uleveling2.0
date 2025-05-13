import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { moderateScale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';
import { OnboardingStage } from '@/services/OnboardingService';



// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  onComplete: () => void;
  isGenerating?: boolean;
  generationError?: string | null;
  onRetry?: () => void;
  generationComplete?: boolean;
  generatingStage?: OnboardingStage;
}

export const STEP_CONTENT_HEIGHT = verticalScale(190);

export default function Step14_Done({ data, onComplete, isGenerating, generationError, onRetry, generationComplete }: StepProps) {
  // --- Removed State ---
  // const [isLoading, setIsLoading] = useState(true);
  // const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  // const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const [statusText, setStatusText] = useState<string>("Preparing your profile...");
  // ------------------

  // Signal completion immediately on mount
  useEffect(() => {
    console.log("[Step14_Done] Mounted. Calling onComplete.");
    onComplete(); // Signal to parent that this step is ready/valid
  }, [onComplete]);

  // --- Removed AI Generation useEffect and triggerAIGeneration function ---

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Welcome Player!</Text>

      {/* Loader */}
      {isGenerating && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.statusText}>Generating your profile...</Text>
        </View>
      )}

      {/* Error display and retry */}
      {!isGenerating && generationError && (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>{generationError}</Text>
          {onRetry && <Button title="Retry" onPress={onRetry} color="#00ffff" />}
        </View>
      )}

      {/* In-progress info before complete */}
      {!isGenerating && !generationError && !generationComplete && (
        <Text style={styles.infoText}>
          Preparing your personalized roadmap and quests...
        </Text>
      )}

      {/* Success message when generation complete */}
      {!isGenerating && !generationError && generationComplete && (
        <Text style={styles.infoText}>
          All set! Press NEXT to begin your journey!
        </Text>
      )}
    </View>
  );
}

// --- Styles (Simplified) ---
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    width: '100%',

    justifyContent: 'center',
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(16, 0.5),
    color: '#00FF00',
    textShadowColor: '#00FF00',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(10),
    textAlign: 'center',
    textTransform: 'uppercase',
  },
   infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#cccccc',
      textAlign: 'center',
      lineHeight: verticalScale(16),
      marginBottom: verticalScale(10),
      paddingHorizontal: moderateScale(10),
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  statusText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(12, 0.5),
    color: '#00ff00',
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(10, 0.5),
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  // Removed statusText, errorText, activityIndicator, progress styles
}); 