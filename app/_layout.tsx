// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from './backend/auth-context';
import ThemeProvider from './ThemeContext';


export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
