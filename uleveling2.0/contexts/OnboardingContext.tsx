import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingContextType {
  // Define state and functions here
  exampleState: string;
  setExampleState: (value: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [exampleState, setExampleState] = useState<string>('initial');

  return (
    <OnboardingContext.Provider value={{ exampleState, setExampleState }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}; 