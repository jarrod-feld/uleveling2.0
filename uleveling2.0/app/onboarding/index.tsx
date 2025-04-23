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
    })();
  }, []);

  /* ------------ normal popup state -------------------------- */
  const [step,       setStep]       = useState<number>(1);
  const [queuedStep, setQueuedStep] = useState<number | null>(null);
  const [popupVisible, setPopupVisible] = useState(true);

  const openPopup  = () => setPopupVisible(true);
  const closePopup = () => setPopupVisible(false);

  /* --------------- nav handlers ----------------------------- */
  const handleBack = () => {
    setQueuedStep(Math.max(1, step - 1));
    closePopup();
  };

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      setQueuedStep(null);
      closePopup();
      return;
    }
    setQueuedStep(step + 1);
    closePopup();
  };

  /* after collapse tween */
  const handleClosed = () => {
    if (queuedStep !== null) {
      setStep(queuedStep);
      setQueuedStep(null);
      openPopup();
    } else if (step === TOTAL_STEPS) {
      router.replace('/(tabs)/dashboard');
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
      case 6:  return 'Time at Work/School';
      case 7:  return 'Focus Areas';
      case 8:  return 'Create your Roadmap';
      case 9:  return 'Create Goals';
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
    switch (step) {
      case 1:  return <Step01_Welcome />;
      case 2:  return <Step02_Age />;
      case 3:  return <Step03_Gender />;
      case 4:  return <Step04_LifeStatus />;
      case 5:  return <Step05_Sleep />;
      case 6:  return <Step06_TimeCommit />;
      case 7:  return <Step07_FocusAreas />;
      case 8:  return <Step08_RoadmapChoice />;
      case 9:  return <Step09_GoalList />;
      case 10: return <Step10_SignIn />;
      case 11: return <Step11_FoundUs />;
      case 12: return <Step12_Rating />;
      case 13: return <Step13_Paywall />;
      case 14: return <Step14_Done />;
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
            nextDisabled={false /* TODO validation */}
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
