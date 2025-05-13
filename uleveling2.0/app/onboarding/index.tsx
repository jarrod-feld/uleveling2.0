/* app/onboarding/index.tsx
 * ------------------------------------------------------------
 * Loads GIF + border PNGs with Asset.loadAsync before showing
 * the Solo-Leveling popup.  No flash, even at DUR = 150 ms.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Asset } from 'expo-asset';
import { scale, verticalScale, moderateScale } from '@/constants/scaling';
import AccountService from '@/services/AccountService';
import UserService from '@/services/UserService';
import AIService from '@/services/AIService';
import StatService from '@/services/StatService';
import RoadmapService from '@/services/RoadmapService';
import QuestService from '@/services/QuestService';
import { useAuth } from '@/contexts/UserContext';
import { Quest } from '@/mock/dashboardData';
import OnboardingService from '@/services/OnboardingService';
import { OnboardingStage } from '@/services/OnboardingService';
import { StatCategory } from '@/types/quest';
import CacheService from '@/services/CacheService';
// Remove context/type imports
// import { OnboardingProvider } from '@/context/OnboardingContext';
// import { StepProps } from '@/types/onboarding';

import SoloPopup from '@/components/common/SoloPopup';
import TitleBar  from '@/components/common/TitleBar';
import NavRow    from '@/components/common/NavRow';

/* ---------- step components ---------- */
import Step00_Username, { STEP_CONTENT_HEIGHT as STEP_00_HEIGHT } from '@/components/onboarding/Step00_Username';
import Step01_Welcome, { STEP_CONTENT_HEIGHT as STEP_01_HEIGHT } from '@/components/onboarding/Step01_Welcome';
import Step02_Age, { STEP_CONTENT_HEIGHT as STEP_02_HEIGHT } from '@/components/onboarding/Step02_Age';
import Step03_Gender, { STEP_CONTENT_HEIGHT as STEP_03_HEIGHT } from '@/components/onboarding/Step03_Gender';
import Step04_LifeStatus, { STEP_CONTENT_HEIGHT as STEP_04_HEIGHT } from '@/components/onboarding/Step04_LifeStatus';
import Step05_Sleep, { STEP_CONTENT_HEIGHT as STEP_05_HEIGHT } from '@/components/onboarding/Step05_Sleep';
import Step06_TimeCommit, { STEP_CONTENT_HEIGHT as STEP_06_HEIGHT } from '@/components/onboarding/Step06_TimeCommit';
import Step07_FocusAreas, { STEP_CONTENT_HEIGHT as STEP_07_HEIGHT } from '@/components/onboarding/Step07_FocusAreas';
import Step08_RoadmapChoice, { STEP_CONTENT_HEIGHT as STEP_08_HEIGHT } from '@/components/onboarding/Step08_RoadmapChoice';
import Step09_GoalList, { STEP_CONTENT_HEIGHT as STEP_09A_HEIGHT } from '@/components/onboarding/Step09_GoalList';
import Step09_Template, { STEP_CONTENT_HEIGHT as STEP_09B_HEIGHT } from '@/components/onboarding/Step09_Template';
import Step00_SignIn, { STEP_CONTENT_HEIGHT as STEP_10_HEIGHT } from '@/components/onboarding/Step00_SignIn';
import Step11_FoundUs, { STEP_CONTENT_HEIGHT as STEP_11_HEIGHT } from '@/components/onboarding/Step11_FoundUs';
import Step12_Rating, { STEP_CONTENT_HEIGHT as STEP_12_HEIGHT } from '@/components/onboarding/Step12_Rating';
import Step13_Paywall, { STEP_CONTENT_HEIGHT as STEP_13_HEIGHT } from '@/components/onboarding/Step13_Paywall';
import Step14_Done, { STEP_CONTENT_HEIGHT as STEP_14_HEIGHT } from '@/components/onboarding/Step14_Done';

const TOTAL_STEPS = 15;            // 0-14 inclusive

// Height constants
const TITLE_BAR_HEIGHT = verticalScale(45); // Estimated height
const NAV_ROW_HEIGHT   = verticalScale(60); // Estimated height
const VERTICAL_PADDING = verticalScale(10); // Top + bottom padding within popup inner container

// Restore local OnboardingData interface and export it
export interface OnboardingData {
  name?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  lifeStatus?: {
    working?: boolean;
    school?: boolean;
  };
  sleepWake?: string;
  sleepBed?: string;
  hoursWork?: number;
  hoursSchool?: number;
  focusAreas?: { [key: string]: boolean };
  focusAreasOtherText?: string;
  roadmapChoice?: 'Create' | 'Template';
  goals?: { description: string; timeframe: string }[];
  template?: string;
  templateIntensity?: 'Low' | 'Med' | 'High';
  foundUs?: string;
  foundUsOtherText?: string;
  rating?: number;
}

// Define StepProps interface shared by onboarding step components
interface StepProps { /* ... existing fields ... */ }

/* ------------------------------------------------------------------ */

// Remove Provider wrapper export
// export default function OnboardingIndexWrapped() { ... }

// Restore original export
export default function OnboardingIndex() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);

  const [step, setStep] = useState<number>(0);
  const [queuedStep, setQueuedStep] = useState<number | null>(null);
  const [popupVisible, setPopupVisible] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isStepValid, setStepValid] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasStartedOnboardingFlow, setHasStartedOnboardingFlow] = useState<boolean>(false);
  const [generationComplete, setGenerationComplete] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatingStage, setGeneratingStage] = useState<OnboardingStage>('idle');

  const { user, updateUserProfile } = useAuth();
  const userId = user?.id;

  // Log when userId changes
  useEffect(() => {
    console.log(`[OnboardingIndex] User auth state changed. userId=${userId || 'null'}`);
  }, [userId]);

  useEffect(() => {
    (async () => {
      // Keep asset preloading if needed for 8-bit style (e.g., background image)
      // await Asset.loadAsync([...]);
      setAssetsReady(true);
      // Step 0 (Welcome) is now always valid, Step 1 (Username) starts invalid
      setStepValid(true); // Step 0 is now Welcome, which is valid
      // Restore onboarding progress if available
      const completed = await OnboardingService.isCompleted();
      if (!completed) {
        const savedStep = await OnboardingService.getCurrentStep();
        setStep(savedStep);
        const savedData = await OnboardingService.getOnboardingData();
        if (savedData) setOnboardingData(savedData);
      }
    })();
  }, []);

  // Persist onboarding step and data on change
  useEffect(() => {
    OnboardingService.setCurrentStep(step);
  }, [step]);

  useEffect(() => {
    OnboardingService.setOnboardingData(onboardingData);
  }, [onboardingData]);

  // --- Auth Check Effect ---
  useEffect(() => {
    async function checkAuthStatus() {
      console.log('[OnboardingIndex] Checking initial auth status...');
      try {
        const { session, error } = await AccountService.getSession();
        if (error) {
          console.error('[OnboardingIndex] Error checking session:', error.message);
          // Proceed to onboarding even if there was an error fetching session
          setIsCheckingAuth(false);
          return;
        }

        // Only redirect to dashboard if onboarding is completed
        const onboardingCompleted = await OnboardingService.isCompleted();
        if (session && onboardingCompleted) {
          console.log('[OnboardingIndex] Active session found and onboarding completed. Redirecting to dashboard...');
          setIsNavigating(true); // Prevent rendering onboarding steps
          router.replace('/(tabs)/dashboard' as any);
          // Keep isCheckingAuth true until navigation completes to avoid flashing UI
        } else {
          console.log('[OnboardingIndex] No active session or onboarding not completed. Starting onboarding.');
          setIsCheckingAuth(false); // Allow onboarding to render
        }
      } catch (err) {
        console.error('[OnboardingIndex] Unexpected error during auth check:', err);
        setIsCheckingAuth(false); // Proceed to onboarding on unexpected error
      }
    }

    checkAuthStatus();
  }, [router]); // Depend on router
  // ------------------------

  /* ------------ onboarding & popup state -------------------- */
  const stableSetData = useCallback(
      (updater: (prev: OnboardingData) => OnboardingData) => {
          setOnboardingData(updater);
      },
      [setOnboardingData] // Dependency: the state setter function from useState
  );
  // ----------------------------------

  const openPopup  = () => setPopupVisible(true);
  const closePopup = () => setPopupVisible(false);

  /* --------------- nav handlers ----------------------------- */
  const handleBack = () => {
    setQueuedStep(Math.max(0, step - 1));
    closePopup();
  };

  const handleNext = async () => {
    const currentStep = step;
    console.log(`[OnboardingIndex] handleNext START. Current Step: ${currentStep}, Valid: ${isStepValid}`);

    if (!isStepValid) {
      console.log("[OnboardingIndex] handleNext: Step not valid. Bailing.");
      return;
    }

    // If on the final step, navigate to dashboard when generation complete
    if (currentStep === TOTAL_STEPS - 1) {
      if (generationComplete) {
        console.log("[OnboardingIndex] handleNext: Generation complete, navigating to dashboard.");
        router.replace('/(tabs)/dashboard' as any);
      } else {
        console.log("[OnboardingIndex] handleNext: Generation not complete, blocking navigation.");
      }
      return;
    }

    // Otherwise, advance to the next step
    const nextStep = currentStep + 1;
    console.log(`[OnboardingIndex] handleNext: Queuing next step ${nextStep} and closing popup.`);
    setQueuedStep(nextStep);
    closePopup();
  };

  // --- Final Generation and Navigation Logic ---
  const handleCompleteOnboarding = useCallback(async () => {
    if (!userId) {
      console.error("[OnboardingIndex] User ID missing, cannot complete onboarding.");
      setGenerationError("Authentication error. Please try restarting the app.");
      setGeneratingStage('error');
      return;
    }
    if (isGenerating) return; // Prevent multiple triggers

    console.log("[OnboardingIndex] Starting final onboarding generation...");
    setIsGenerating(true);
    setGeneratingStage('starting');
    setGenerationError(null);
    setGenerationComplete(false);

    const progressCallback = (stage: OnboardingStage) => {
      setGeneratingStage(stage);
    };

    try {
      const { success, error } = await OnboardingService.completeOnboardingFlow(userId, onboardingData, progressCallback);

      if (!success) throw error;
      console.log("[OnboardingIndex] Onboarding generation successful via service.");
      setGenerationComplete(true);
      setStepValid(true); // enable Next button
    } catch (error: any) {
      console.error("[OnboardingIndex] Error during onboarding generation process:", error);
      setGenerationError(error.message || "An unexpected error occurred during setup.");
      setGeneratingStage('error');
    } finally {
      setIsGenerating(false);
    }
  }, [userId, onboardingData, isGenerating, updateUserProfile]);

  /* after collapse tween */
  const handleClosed = async () => {
    const stepToProcess = queuedStep; // Capture queued step at the start
    const currentStepBeforeUpdate = step;
    console.log(`[OnboardingIndex] handleClosed START. Queued: ${stepToProcess}, Current Before Update: ${currentStepBeforeUpdate}`);

    if (stepToProcess !== null) {
      console.log(`[OnboardingIndex] handleClosed: Setting step state to ${stepToProcess}`);
      setStep(stepToProcess);
      setQueuedStep(null);
      console.log(`[OnboardingIndex] handleClosed: Opening popup for step ${stepToProcess}`);
      openPopup();
    } else if (currentStepBeforeUpdate === TOTAL_STEPS - 1) {
      console.log("[OnboardingIndex] handleClosed: Final step reached, generation handled on mount.");
    } else {
      console.log("[OnboardingIndex] handleClosed: No action needed (null queue or not final step).");
    }
  };

  // Trigger onboarding completion flow immediately once when reaching final step
  useEffect(() => {
    console.log(`[OnboardingIndex] Final step effect check -> step=${step}, hasStartedOnboardingFlow=${hasStartedOnboardingFlow}, userId=${userId}`);
    // Only start generation once we have a user ID and have reached final step
    if (step === TOTAL_STEPS - 1 && !hasStartedOnboardingFlow && userId) {
      console.log("[OnboardingIndex] Final step mounted and user ID available, starting onboarding generation...");
      setHasStartedOnboardingFlow(true);
      handleCompleteOnboarding();
    }
  }, [step, hasStartedOnboardingFlow, handleCompleteOnboarding, userId]);

  /* --------------- title helper (keep updated titles) ------- */
  const getTitle = (): string => {
    switch (step) {
      case 0:  return 'Account Setup';      // Was Step 10 (SignIn)
      case 1:  return 'Identify Yourself';  // Was Step 1 (Username)
      case 2:  return 'Alert';              // Was Step 0 (Welcome)
      case 3:  return 'Player Age';         // Was Step 2
      case 4:  return 'Player Gender';        // Was Step 3
      case 5:  return 'Current Status';       // Was Step 4
      case 6:  return 'Sleep Schedule';       // Was Step 5
      case 7:  return 'Time Commitment';      // Was Step 6
      case 8:  return 'Focus Areas';          // Was Step 7
      case 9:  return 'Create your Roadmap';  // Was Step 8
      case 10: return 'Define Your Goals';    // Was Step 9
      case 11: return 'How did you find us?'; // Stays Step 11
      case 12: return 'Quick Rating';         // Stays Step 12
      case 13: return 'Unlock Premium';       // Stays Step 13
      case 14: return 'Welcome Player';       // Stays Step 14
      default: return '';
    }
  };

  /* --------------- height calculation --------------- */
  function getCurrentStepContentHeight(): number {
    if (isNavigating) return 0;
    switch (step) {
      case 0:  return STEP_10_HEIGHT;       // SignIn (was step 10)
      case 1:  return STEP_00_HEIGHT;       // Username (was step 1, used STEP_00_HEIGHT)
      case 2:  return STEP_01_HEIGHT;       // Welcome (was step 0, used STEP_01_HEIGHT)
      case 3:  return STEP_02_HEIGHT;       // Age (was step 2)
      case 4:  return STEP_03_HEIGHT;       // Gender (was step 3)
      case 5:  return STEP_04_HEIGHT;       // LifeStatus (was step 4)
      case 6:  return STEP_05_HEIGHT;       // Sleep (was step 5)
      case 7:  return STEP_06_HEIGHT;       // TimeCommit (was step 6)
      case 8:  return STEP_07_HEIGHT;       // FocusAreas (was step 7)
      case 9:  return STEP_08_HEIGHT;       // RoadmapChoice (was step 8)
      case 10: // Was step 9 (GoalList/Template)
        return onboardingData.roadmapChoice === 'Template' ? STEP_09B_HEIGHT : STEP_09A_HEIGHT;
      case 11: return STEP_11_HEIGHT;       // FoundUs
      case 12: return STEP_12_HEIGHT;       // Rating
      case 13: return STEP_13_HEIGHT;       // Paywall
      case 14: return STEP_14_HEIGHT;       // Done
      default: return verticalScale(200); // Fallback height
    }
  }

  const currentStepContentHeight = getCurrentStepContentHeight();
  const requiredPopupHeight = TITLE_BAR_HEIGHT + currentStepContentHeight + NAV_ROW_HEIGHT + VERTICAL_PADDING;

  // --- Debug Log ---
  if (!isNavigating) {
    console.log(`[OnboardingIndex] Step: ${step}`);
    if (step === 9) {
      console.log(`  Roadmap Choice: ${onboardingData.roadmapChoice}`);
    }
    console.log(`  currentStepContentHeight: ${currentStepContentHeight}`);
    console.log(`  requiredPopupHeight: ${requiredPopupHeight} (Title: ${TITLE_BAR_HEIGHT}, Content: ${currentStepContentHeight}, Nav: ${NAV_ROW_HEIGHT}, Padding: ${VERTICAL_PADDING})`);
  }
  // ---------------

  /* --------------- step renderer ---------------------------- */
  const renderStep = () => {
    // Base props passed to most steps
    const baseStepProps = {
      data: onboardingData,
      setData: stableSetData,
      setValid: setStepValid,
    };

    switch (step) {
      case 0:  return <Step00_SignIn {...baseStepProps} />;    // Was Step 10
      case 1:  return <Step00_Username {...baseStepProps} />;  // Was Step 1
      case 2:  return <Step01_Welcome {...baseStepProps} />;   // Was Step 0
      case 3:  return <Step02_Age {...baseStepProps} />;
      case 4:  return <Step03_Gender {...baseStepProps} />;
      case 5:  return <Step04_LifeStatus {...baseStepProps} />;
      case 6:  return <Step05_Sleep {...baseStepProps} />;
      case 7:  return <Step06_TimeCommit {...baseStepProps} />;
      case 8:  return <Step07_FocusAreas {...baseStepProps} />;
      case 9:  return <Step08_RoadmapChoice {...baseStepProps} />;
      case 10: // Was Step 9
        if (onboardingData.roadmapChoice === 'Template') {
          return <Step09_Template {...baseStepProps} />;
        }
        return <Step09_GoalList {...baseStepProps} />;
      case 11: return <Step11_FoundUs {...baseStepProps} />;
      case 12: return <Step12_Rating {...baseStepProps} />;
      case 13: return <Step13_Paywall {...baseStepProps} />;
      case 14:
        // Step14: show loading, error, or success state, then allow Next
        return (
          <Step14_Done
            {...baseStepProps}
            isGenerating={isGenerating}
            generatingStage={generatingStage}
            generationError={generationError}
            generationComplete={generationComplete}
            onRetry={() => {
              setHasStartedOnboardingFlow(false);
              setGeneratingStage('idle');
              handleCompleteOnboarding();
            }}
            onComplete={() => setStepValid(true)}
          />
        );
      default: return null;
    }
  };

  /* ----------- UI ----------- */
  if (!assetsReady) {
    return (
      <View style={[styles.bg, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#cccccc" />
      </View>
    );
  }

  if (isCheckingAuth) {
     console.log(`[OnboardingIndex] Rendering loading indicator (isCheckingAuth: true).`);
    return (
      <View style={[styles.bg, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  if (isNavigating) {
    console.log("[OnboardingIndex] Navigating away, rendering null.");
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bg}>
        <SoloPopup
          key={step}
          visible={popupVisible}
          onClose={closePopup}
          onClosed={handleClosed}
          disableBackdropClose={true}
          requiredHeight={requiredPopupHeight}
        >
          <TitleBar text={getTitle()} />
          {renderStep()}
          <NavRow
            isStepOne={step === 0}
            isLast={step === TOTAL_STEPS - 1 && !generationComplete}
            nextDisabled={!isStepValid || isGenerating}
            backDisabled={isGenerating}
            onBack={handleBack}
            onNext={handleNext}
          />
        </SoloPopup>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050a15',
    padding: moderateScale(20),
  },
  loadingText: {
    marginTop: moderateScale(15),
    color: '#ffffff',
    fontSize: moderateScale(16),
    // fontFamily: 'PressStart2P', // Optional font
  },
});
