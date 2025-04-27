import { Dispatch, SetStateAction } from 'react';

// Data collected during onboarding
export interface OnboardingData {
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  lifeStatus?: {
    working?: boolean;
    school?: boolean;
  };
  sleepWake?: string; // Example: "10:00 PM"
  sleepBed?: string;  // Example: "6:00 AM"
  hoursWork?: number;
  hoursSchool?: number;
  focusAreas?: { [key: string]: boolean }; // e.g., { 'Dating': true }
  focusAreasOtherText?: string;
  roadmapChoice?: 'Create' | 'Template';
  goals?: { description: string; timeframe: string }[]; // Step 9a
  template?: string; // Step 9b
  templateIntensity?: 'Low' | 'Med' | 'High'; // Step 9b
  foundUs?: string; // e.g., 'Instagram'
  foundUsOtherText?: string;
  rating?: number; // 1-5
}

// Props passed to each Step component
export interface StepProps {
  setValid: Dispatch<SetStateAction<boolean>>;
  // Note: data and setData will come from context now
}

// Type for the OnboardingContext
export interface OnboardingContextType {
  onboardingData: OnboardingData;
  setOnboardingData: (updateFn: (prevData: OnboardingData) => OnboardingData) => void;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface OnboardingProgress {
  currentStepId: string;
  steps: OnboardingStep[];
} 