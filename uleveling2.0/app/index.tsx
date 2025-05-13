import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import OnboardingService from '@/services/OnboardingService';
import AccountService from '@/services/AccountService';
import { UserProvider } from '@/contexts/UserContext';
import { QuestGoalProvider } from '@/contexts/QuestGoalContext';
// import MainApp from '@/MainApp'; // Replace with your main app component

// This component redirects the user from the root route ("/")
// to the onboarding screen using the Redirect component.
export default function RootIndex() {
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [renderApp, setRenderApp] = useState(false); // New state to control rendering
  console.log(`[RootIndex] Render State -> initialCheckComplete=${initialCheckComplete}, redirectPath=${redirectPath}, renderApp=${renderApp}`);

  useEffect(() => {
    (async () => {
      console.log('[RootIndex] Initiating startup checks...');
      const { session, error: sessionError } = await AccountService.getSession();
      let onboardingCompleted = false;
      if (session && session.user?.id) {
        onboardingCompleted = await OnboardingService.hasOnboardingData(session.user.id);
      }

      if (sessionError) {
        console.error('[RootIndex] Error fetching session during startup:', sessionError.message);
      }

      console.log(`[RootIndex] Startup check - Onboarding data present: ${onboardingCompleted}`);
      console.log(`[RootIndex] Startup check - Session exists: ${!!session}`);

      if (session && onboardingCompleted) {
        console.log('[RootIndex] Conditions met: Session exists AND onboarding_data present. Setting renderApp to true.');
        setRenderApp(true);
      } else {
        console.log('[RootIndex] Conditions NOT met for full app start. Determining redirect...');
        if (!session) {
          console.log('[RootIndex] Reason for redirect/no-render: No active session.');
        }
        if (!onboardingCompleted) {
          console.log('[RootIndex] Reason for redirect/no-render: No onboarding_data in user record.');
        }
        const lastStep = await OnboardingService.getCurrentStep();
        console.log(`[RootIndex] Last onboarding step was: ${lastStep}. Setting redirect to /onboarding?step=${lastStep}`);
        setRedirectPath(`/onboarding?step=${lastStep}`);
        setRenderApp(false); // Ensure app is not rendered
      }
      setInitialCheckComplete(true);
      console.log('[RootIndex] Startup checks complete.');
    })();
  }, []);

  if (!initialCheckComplete) {
    console.log('[RootIndex] Rendering null: Startup checks not yet complete.');
    return null; // Or a global loading indicator
  }

  if (redirectPath) {
    console.log(`[RootIndex] Redirecting to: ${redirectPath}`);
    return <Redirect href={redirectPath as any} />;
  }

  if (renderApp) {
    console.log('[RootIndex] Redirecting to (tabs)/dashboard');
    return (
      <UserProvider isAppReady={true}>
        <QuestGoalProvider isAppReady={true}>
          <Redirect href={'/dashboard' as any} />
        </QuestGoalProvider>
      </UserProvider>
    );
  }
  
  // Fallback if not rendering app and not redirecting (e.g. if initialCheckComplete is true, but renderApp is false and no redirectPath)
  // This state should ideally not be reached if the logic above is correct.
  console.log('[RootIndex] Fallback: Initial checks complete, but app not ready to render and no redirect path. Rendering null.');
  return null; 
} 