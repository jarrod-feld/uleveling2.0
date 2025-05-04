import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from '@/constants/scaling';
import { OnboardingData } from '@/app/onboarding';

// --- Removed Imports ---
// import AccountService from '@/services/AccountService';
// import AIService from '@/services/AIService';
// import RoadmapService from '@/services/RoadmapService';
// import QuestService from '@/services/QuestService';
// import UserService from '@/services/UserService';
// import { Goal } from '@/mock/roadmapData';
// import { Quest } from '@/mock/dashboardData';
// --------------------

// Define StepProps locally
interface StepProps {
  data: OnboardingData;
  onComplete: () => void;
}

export const STEP_CONTENT_HEIGHT = verticalScale(190);

export default function Step14_Done({ data, onComplete }: StepProps) {
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
      <Text style={styles.infoText}>
         Your personalized roadmap and quests are being generated... Press NEXT to begin your journey!
      </Text>
      {/* Removed loading indicator and progress segments */}
    </View>
  );
}

// --- Styles (Simplified) ---
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    width: '100%',
    minHeight: STEP_CONTENT_HEIGHT, // Use constant
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: moderateScale(16, 0.5),
    color: '#00FF00',
    textShadowColor: '#00FF00',
    textShadowRadius: moderateScale(8),
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: verticalScale(25),
    textAlign: 'center',
    textTransform: 'uppercase',
  },
   infoText: {
      fontFamily: 'PressStart2P',
      fontSize: moderateScale(10, 0.5),
      color: '#cccccc',
      textAlign: 'center',
      lineHeight: verticalScale(16),
      marginBottom: verticalScale(15),
      paddingHorizontal: moderateScale(10),
  },
  // Removed statusText, errorText, activityIndicator, progress styles
}); 