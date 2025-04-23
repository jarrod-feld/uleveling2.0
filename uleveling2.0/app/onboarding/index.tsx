/* app/onboarding/index.tsx
 * ------------------------------------------------------------
 * Loads GIF + border PNGs with Asset.loadAsync before showing
 * the Solo-Leveling popup.  No flash, even at DUR = 150 ms.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Asset } from 'expo-asset';          /* ← NEW */
import { scale, verticalScale, moderateScale } from '@/constants/scaling';

import SoloPopup from '@/components/common/SoloPopup';
import TitleBar  from '@/components/common/TitleBar';
import NavRow    from '@/components/common/NavRow';

/* ---------- step components ---------- */
import Step01_Welcome        from '@/components/onboarding/Step01_Welcome';
import Step02_Age            from '@/components/onboarding/Step02_Age';
import Step03_Gender         from '@/components/onboarding/Step03_Gender';
import Step04_LifeStatus     from '@/components/onboarding/Step04_LifeStatus';
import Step05_Sleep          from '@/components/onboarding/Step05_Sleep';
import Step06_TimeCommit     from '@/components/onboarding/Step06_TimeCommit';
import Step07_FocusAreas     from '@/components/onboarding/Step07_FocusAreas';
import Step08_RoadmapChoice  from '@/components/onboarding/Step08_RoadmapChoice';
import Step09_GoalList       from '@/components/onboarding/Step09_GoalList';
import Step09_Template       from '@/components/onboarding/Step09_Template';
import Step10_SignIn         from '@/components/onboarding/Step10_SignIn';
import Step11_FoundUs        from '@/components/onboarding/Step11_FoundUs';
import Step12_Rating         from '@/components/onboarding/Step12_Rating';
import Step13_Paywall        from '@/components/onboarding/Step13_Paywall';
import Step14_Done           from '@/components/onboarding/Step14_Done';

const TOTAL_STEPS = 14;            // 1-14 inclusive

/* --- Types --- */
// TODO: Define more specific types as components are built
interface OnboardingData {
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  lifeStatus?: {
    working?: boolean;
    school?: boolean;
  };
  sleepWake?: string; // Example: "10:00 PM"
  sleepBed?: string; // Example: "6:00 AM"
  hoursWork?: number;
  hoursSchool?: number;
  focusAreas?: { [key: string]: boolean }; // e.g., { 'Dating': true, 'OtherText': 'xyz' }
  focusAreasOtherText?: string;
  roadmapChoice?: 'Create' | 'Template';
  goals?: { description: string; timeframe: string }[]; // Step 9a
  template?: string; // Step 9b
  templateIntensity?: 'Low' | 'Med' | 'High'; // Step 9b
  foundUs?: string; // e.g., 'Instagram', 'OtherText'
  foundUsOtherText?: string;
  rating?: number; // 1-5
}

/* ------------------------------------------------------------------ */

export default function OnboardingIndex() {
  const router = useRouter();

  /* ------------ preload GIF + borders (blocking) ------------ */
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await Asset.loadAsync([
        require('@/assets/img/techno-background.gif'),
        require('@/assets/img/techno-border-top.png'),
        require('@/assets/img/techno-border-bottom.png'),
      ]);
      setAssetsReady(true);
      // Assume step 1 is initially valid
      setStepValid(true);
    })();
  }, []);

  /* ------------ onboarding & popup state -------------------- */
  const [step,       setStep]       = useState<number>(1);
  const [queuedStep, setQueuedStep] = useState<number | null>(null);
  const [popupVisible, setPopupVisible] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isStepValid, setStepValid] = useState<boolean>(false); // Default to false until step validates

  const openPopup  = () => setPopupVisible(true);
  const closePopup = () => setPopupVisible(false);

  /* --------------- nav handlers ----------------------------- */
  const handleBack = () => {
    setQueuedStep(Math.max(1, step - 1));
    closePopup();
  };

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      setQueuedStep(null); // Prevent reopening popup
      closePopup(); // Close normally, onClosed will navigate
      return;
    }
    let nextStep = step + 1;
    // Special logic for step 9 based on step 8 choice?
    // Or handle rendering Step09_GoalList vs Step09_Template in renderStep
    setQueuedStep(nextStep);
    closePopup();
  };

  /* after collapse tween */
  const handleClosed = () => {
    if (queuedStep !== null) {
      setStep(queuedStep);
      setStepValid(false); // Reset validation for the new step
      setQueuedStep(null);
      openPopup();
    } else if (step === TOTAL_STEPS) {
      // Only navigate when the final step (14) is closed *without* a queued step
      router.replace('/(tabs)/dashboard' as any); // Cast to any to bypass strict type check
    }
  };

  /* --------------- title helper ----------------------------- */
  const getTitle = (): string => {
    switch (step) {
      case 1:  return 'Notification';
      case 2:  return 'What is your age?';
      case 3:  return 'What is your Gender?';
      case 4:  return 'Where are you in life?';
      case 5:  return 'Sleep Schedule';
      case 6:  return 'Time Commitment'; // Updated title
      case 7:  return 'Focus Areas';
      case 8:  return 'Create your Roadmap';
      case 9:  return 'Create Goals'; // Title might need adjustment based on Step 8 choice
      case 10: return 'Account Setup';
      case 11: return 'How did you find us?';
      case 12: return 'Quick Rating';
      case 13: return 'Unlock Premium';
      case 14: return 'Welcome Player';
      default: return '';
    }
  };

  /* --------------- step renderer ---------------------------- */
  const renderStep = () => {
    const stepProps = {
      // Use functional update form for setOnboardingData
      setData: (updater: (prev: OnboardingData) => OnboardingData) => setOnboardingData(updater),
      data: onboardingData,
      setValid: setStepValid,
    };

    switch (step) {
      case 1:  return <Step01_Welcome {...stepProps} />;
      case 2:  return <Step02_Age {...stepProps} />;
      case 3:  return <Step03_Gender {...stepProps} />;
      case 4:  return <Step04_LifeStatus {...stepProps} />;
      case 5:  return <Step05_Sleep {...stepProps} />;
      case 6:  return <Step06_TimeCommit {...stepProps} />;
      case 7:  return <Step07_FocusAreas {...stepProps} />;
      case 8:  return <Step08_RoadmapChoice {...stepProps} />;
      case 9:
        // Conditional rendering for Step 9 based on Step 8's choice
        if (onboardingData.roadmapChoice === 'Template') {
          return <Step09_Template {...stepProps} />;
        }
        return <Step09_GoalList {...stepProps} />; // Default or 'Create' choice
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
    /* optional: splash while caching images */
    return (
      <View style={[styles.bg, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
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
        >
          <TitleBar text={getTitle()} />
          {renderStep()}
          <NavRow
            isStepOne={step === 1}
            isLast={step === TOTAL_STEPS}
            nextDisabled={!isStepValid} // Use validation state
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
