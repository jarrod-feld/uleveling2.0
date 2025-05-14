import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import OnboardingService from '@/services/OnboardingService';
import AccountService from '@/services/AccountService';
import StatService from '@/services/StatService';
import RoadmapService from '@/services/RoadmapService';
import QuestService from '@/services/QuestService';
import CacheService from '@/services/CacheService';
import { UserProvider } from '@/contexts/UserContext';
import { QuestGoalProvider } from '@/contexts/QuestGoalContext';
// import MainApp from '@/MainApp'; // Replace with your main app component

// This component redirects the user from the root route ("/")
// to the onboarding screen using the Redirect component.
export default function RootIndex() {
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [renderApp, setRenderApp] = useState(false);
  console.log(`[RootIndex] Render State -> initialCheckComplete=${initialCheckComplete}, redirectPath=${redirectPath}, renderApp=${renderApp}`);

  useEffect(() => {
    (async () => {
      console.log('[RootIndex] Initiating startup checks...');
      const { session, error: sessionError } = await AccountService.getSession();

      if (sessionError) {
        console.error('[RootIndex] Error fetching session during startup:', sessionError.message);
        // Decide how to handle session fetch error - e.g., proceed to onboarding as if no session
        setRedirectPath('/onboarding?step=0'); // Or a dedicated error/login page
        setInitialCheckComplete(true);
        setRenderApp(false);
        return;
      }

      if (session && session.user?.id) {
        const userId = session.user.id;
        console.log(`[RootIndex] Session found for user ${userId}.`);

        // Pre-warm caches (fire and forget)
        AccountService.getProfile(userId)
            .then(({ data }) => { if(data) console.log('[RootIndex] Profile cache potentially updated/warmed.'); })
            .catch(e => console.warn('[RootIndex] Failed to pre-warm profile cache:', e.message));
        StatService.getStats(userId)
            .then(({ data }) => { if(data) console.log('[RootIndex] Stats cache potentially updated/warmed.'); })
            .catch(e => console.warn('[RootIndex] Failed to pre-warm stats cache:', e.message));
        RoadmapService.getGoals(userId)
            .then(({ data }) => { if(data) console.log('[RootIndex] Goals cache potentially updated/warmed.'); })
            .catch(e => console.warn('[RootIndex] Failed to pre-warm goals cache:', e.message));
        QuestService.getQuests(userId)
            .then(({ data }) => { if(data) console.log('[RootIndex] Quests cache potentially updated/warmed.'); })
            .catch(e => console.warn('[RootIndex] Failed to pre-warm quests cache:', e.message));

        let onboardingDataPresentInUsersTable = false;
        try {
          onboardingDataPresentInUsersTable = await OnboardingService.hasOnboardingData(userId);
          console.log(`[RootIndex] OnboardingService.hasOnboardingData (checks users table) for user ${userId} returned: ${onboardingDataPresentInUsersTable}`);

          if (!onboardingDataPresentInUsersTable) {
            console.warn(`[RootIndex] Onboarding data NOT found in users table for user ${userId}. Forcing sign-out and clearing cache.`);
            await AccountService.signOut();
            // Clear app-specific caches
            await CacheService.remove(`quests_${userId}`);
            await CacheService.remove(`goals_${userId}`);
            await CacheService.remove(`stats_${userId}`);
            await CacheService.remove(`profile_${userId}`); // Assuming a key like this if AccountService caches profile
            await CacheService.remove('onboardingCompleted');
            await CacheService.remove('onboardingCurrentStep');
            await CacheService.remove('onboardingData');
            // Add any other user-specific or general onboarding cache keys here
            console.log(`[RootIndex] Cleared app caches for user ${userId} after forced sign-out.`);
            setRedirectPath('/onboarding?step=0'); // Direct to start of onboarding
            setInitialCheckComplete(true);
            setRenderApp(false);
            return; // Exit early
          }
          // If we reach here, onboardingDataPresentInUsersTable IS TRUE.
          // This means the user has at least started onboarding and data is in the DB.
          // Proceed to dashboard.
          console.log(`[RootIndex] Conditions met: Session exists AND onboarding data is present in users table. Setting renderApp to true for dashboard redirect.`);
          setRenderApp(true);

        } catch (error: any) {
          console.error(`[RootIndex] Error calling OnboardingService.hasOnboardingData for user ${userId}:`, error.message);
          console.warn(`[RootIndex] Forcing sign-out and clearing cache due to error checking onboarding data in users table.`);
          await AccountService.signOut();
          // Clear app-specific caches
          await CacheService.remove(`quests_${userId}`);
          await CacheService.remove(`goals_${userId}`);
          await CacheService.remove(`stats_${userId}`);
          await CacheService.remove(`profile_${userId}`);
          await CacheService.remove('onboardingCompleted');
          await CacheService.remove('onboardingCurrentStep');
          await CacheService.remove('onboardingData');
          console.log(`[RootIndex] Cleared app caches for user ${userId} after forced sign-out due to error.`);
          setRedirectPath('/onboarding?step=0'); // Direct to start of onboarding
          setInitialCheckComplete(true);
          setRenderApp(false);
          return; // Exit early
        }
        // The logic for checking OnboardingService.isCompleted() and redirecting to a specific onboarding step
        // is now bypassed if onboardingDataPresentInUsersTable is true.
        // If onboardingDataPresentInUsersTable was false, the user would have been signed out and redirected.

      } else { // No session
        console.log('[RootIndex] No active session or user ID missing. Determining redirect to onboarding...');
        // Check local cache for last onboarding step if user was partway through then closed app
        const lastStep = await OnboardingService.getCurrentStep();
        setRedirectPath(`/onboarding?step=${lastStep}`);
        setRenderApp(false);
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
          <Redirect href={'/(tabs)/dashboard' as any} />
        </QuestGoalProvider>
      </UserProvider>
    );
  }
  
  // Fallback if not rendering app and not redirecting (e.g. if initialCheckComplete is true, but renderApp is false and no redirectPath)
  // This state should ideally not be reached if the logic above is correct.
  console.log('[RootIndex] Fallback: Initial checks complete, but app not ready to render and no redirect path. Rendering null.');
  return null; 
} 