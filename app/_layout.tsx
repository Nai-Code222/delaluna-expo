// app/_layout.tsx
import React, { useContext } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/app/backend/AuthContext';
import { ThemeContext, ThemeProvider } from '../app/themecontext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* The Stack will now receive theme via context */}
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
