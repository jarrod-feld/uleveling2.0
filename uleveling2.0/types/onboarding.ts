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