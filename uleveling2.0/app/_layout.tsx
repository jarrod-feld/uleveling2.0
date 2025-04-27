import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'PressStart2P': require('../assets/fonts/PressStart2P-Regular.ttf'), // Restore 8-bit font
    // 'PublicSans-Regular': require('../assets/fonts/PublicSans-Regular.ttf'),
    // 'PublicSans-Bold': require('../assets/fonts/PublicSans-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded (or an error occurred)
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until the font has loaded or an error was returned
  if (!fontsLoaded && !fontError) {
    return null; // Or return a custom loading indicator
  }

  // Render the navigation stack within the Gesture Handler Root View
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false, // Hide the header globally
        }}
      />
    </GestureHandlerRootView>
  );
}
