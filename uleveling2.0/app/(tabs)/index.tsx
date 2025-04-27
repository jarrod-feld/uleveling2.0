import React from 'react';
import { Redirect } from 'expo-router';

export default function TabIndex() {
  // Redirect to the primary tab, e.g., dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}
