import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LocalizationProvider } from './src/context/LocalizationContext';

export default function App() {
  return (
    <AuthProvider>
      <LocalizationProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </LocalizationProvider>
    </AuthProvider>
  );
}
