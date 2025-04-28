/* app/onboarding/index.tsx
 * ------------------------------------------------------------
 * Loads GIF + border PNGs with Asset.loadAsync before showing
 * the Solo-Leveling popup.  No flash, even at DUR = 150 ms.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Asset } from 'expo-asset';
import { scale, verticalScale, moderateScale } from '@/constants/scaling';
import AccountService from '@/services/AccountService';
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
import Step10_SignIn, { STEP_CONTENT_HEIGHT as STEP_10_HEIGHT } from '@/components/onboarding/Step10_SignIn';
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state for auth check

  /* ------------ preload assets ------------ */
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    (async () => {
      // Keep asset preloading if needed for 8-bit style (e.g., background image)
      // await Asset.loadAsync([...]);
      setAssetsReady(true);
      // Step 0 (Welcome) is now always valid, Step 1 (Username) starts invalid
      setStepValid(true); // Step 0 is now Welcome, which is valid
    })();
  }, []);

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

        if (session) {
          console.log('[OnboardingIndex] Active session found. Redirecting to dashboard...');
          setIsNavigating(true); // Prevent rendering onboarding steps
          router.replace('/(tabs)/dashboard' as any);
          // Keep isCheckingAuth true until navigation completes to avoid flashing UI
        } else {
          console.log('[OnboardingIndex] No active session found. Starting onboarding.');
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
  const [step,       setStep]       = useState<number>(0);
  const [queuedStep, setQueuedStep] = useState<number | null>(null);
  const [popupVisible, setPopupVisible] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isStepValid, setStepValid] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // --- Stabilize setData callback ---
  const stableSetData = useCallback(
      (updater: (prev: OnboardingData) => OnboardingData) => {
          setOnboardingData(updater);
      },
      [setOnboardingData] // Dependency: the state setter function from useState
  );
  // ----------------------------------

  // Remove TODO for Reanimated hook if not needed now

  const openPopup  = () => setPopupVisible(true);
  const closePopup = () => setPopupVisible(false);

  /* --------------- nav handlers ----------------------------- */
  const handleBack = () => {
    setQueuedStep(Math.max(0, step - 1));
    closePopup();
  };

  const handleNext = () => {
    if (!isStepValid) {
        return;
    }

    // Check if it's the final step (index is TOTAL_STEPS - 1)
    if (step === TOTAL_STEPS - 1) {
      console.log("[OnboardingIndex] Reached final step (14). Closing popup to trigger redirect.");
      setQueuedStep(null);
      closePopup();
    } else {
      // Otherwise, proceed to the next step as usual
      let nextStep = step + 1;
      setQueuedStep(nextStep);
      closePopup();
    }
  };

  /* after collapse tween */
  const handleClosed = () => {
    if (queuedStep !== null) {
      // Logic for transitioning between steps
      const newStep = queuedStep;
      setStep(newStep);
      setQueuedStep(null);
      setStepValid(newStep === 0); // Welcome (Step 0) is always valid
      openPopup();
    } else if (step === TOTAL_STEPS - 1) {
      // This condition is now met after closing from Step 14
      // because handleNext set queuedStep to null
      console.log("[OnboardingIndex] Popup closed on final step (14), redirecting to dashboard.");
      setIsNavigating(true);
      router.replace('/(tabs)/dashboard' as any);
    }
    // Add an else case for safety, though it shouldn't be reached in normal flow
    // else {
    //   console.warn("[OnboardingIndex] handleClosed called unexpectedly with null queuedStep and not on final step.");
    // }
  };

  /* --------------- title helper (keep updated titles) ------- */
  const getTitle = (): string => {
    switch (step) {
      case 0:  return 'Alert'; // Step 0 is now Welcome
      case 1:  return 'Identify Yourself'; // Step 1 is now Username
      case 2:  return 'Player Age';
      case 3:  return 'Player Gender';
      case 4:  return 'Current Status';
      case 5:  return 'Sleep Schedule';
      case 6:  return 'Time Commitment';
      case 7:  return 'Focus Areas';
      case 8:  return 'Create your Roadmap';
      case 9:  return 'Define Your Goals';
      case 10: return 'Account Setup';
      case 11: return 'How did you find us?';
      case 12: return 'Quick Rating';
      case 13: return 'Unlock Premium';
      case 14: return 'Welcome Player';
      default: return '';
    }
  };

  /* --------------- height calculation --------------- */
  function getCurrentStepContentHeight(): number {
    if (isNavigating) return 0;
    switch (step) {
      case 0:  return STEP_01_HEIGHT; // Step 0 uses Welcome height
      case 1:  return STEP_00_HEIGHT; // Step 1 uses Username height
      case 2:  return STEP_02_HEIGHT;
      case 3:  return STEP_03_HEIGHT;
      case 4:  return STEP_04_HEIGHT;
      case 5:  return STEP_05_HEIGHT;
      case 6:  return STEP_06_HEIGHT;
      case 7:  return STEP_07_HEIGHT;
      case 8:  return STEP_08_HEIGHT;
      case 9:
        return onboardingData.roadmapChoice === 'Template' ? STEP_09B_HEIGHT : STEP_09A_HEIGHT;
      case 10: return STEP_10_HEIGHT;
      case 11: return STEP_11_HEIGHT;
      case 12: return STEP_12_HEIGHT;
      case 13: return STEP_13_HEIGHT;
      case 14: return STEP_14_HEIGHT;
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
    const stepProps = {
      data: onboardingData,
      setData: stableSetData,
      setValid: setStepValid,
    };

    switch (step) {
      case 0:  return <Step01_Welcome {...stepProps} />; // Step 0 renders Welcome
      case 1:  return <Step00_Username {...stepProps} />; // Step 1 renders Username
      case 2:  return <Step02_Age {...stepProps} />;
      case 3:  return <Step03_Gender {...stepProps} />;
      case 4:  return <Step04_LifeStatus {...stepProps} />;
      case 5:  return <Step05_Sleep {...stepProps} />;
      case 6:  return <Step06_TimeCommit {...stepProps} />;
      case 7:  return <Step07_FocusAreas {...stepProps} />;
      case 8:  return <Step08_RoadmapChoice {...stepProps} />;
      case 9:
        if (onboardingData.roadmapChoice === 'Template') {
          return <Step09_Template {...stepProps} />;
        }
        return <Step09_GoalList {...stepProps} />;
      case 10: return <Step10_SignIn {...stepProps} />;
      case 11: return <Step11_FoundUs {...stepProps} />;
      case 12: return <Step12_Rating {...stepProps} />;
      case 13: return <Step13_Paywall {...stepProps} />;
      case 14: return <Step14_Done {...stepProps} />;
      default: return null;
    }
  };

  /* ----------- UI ----------- */
  if (!assetsReady) {
    return (
      <View style={[styles.bg, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  // Show loading indicator while checking auth or navigating
  if (isCheckingAuth || isNavigating) {
     console.log(`[OnboardingIndex] Rendering loading indicator (isCheckingAuth: ${isCheckingAuth}, isNavigating: ${isNavigating}).`);
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
          // Keep animation props for 8-bit style (fadeIn/Out)
          // animationIn="fadeIn" 
          // animationOut="fadeOut"
        >
          {/* Remove TODO for ScrollView if not part of 8-bit style */}
          <TitleBar text={getTitle()} />
          {renderStep()}
          <NavRow
            isStepOne={step === 0}
            isLast={false}
            nextDisabled={!isStepValid}
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
});
