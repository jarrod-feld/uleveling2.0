import { Redirect } from 'expo-router';
// import React, { useEffect } from 'react'; // No longer needed
// import { View } from 'react-native'; // No longer needed

// This component redirects the user from the root route ("/")
// to the onboarding screen using the Redirect component.
export default function RootIndex() {
  // const router = useRouter(); // No longer needed

  // useEffect(() => { // No longer needed
  //   // Replace the current route with /onboarding in the history stack
  //   router.replace('/onboarding');
  // }, [router]); // Depend on router instance

  // Render nothing or a loading indicator while redirecting
  // return <View />; // Or return null

  // Use Redirect component for initial navigation
  return <Redirect href="/onboarding" />;
} 