// app/_layout.tsx
import React, { useContext } from 'react';
import { Stack } from 'expo-router';
import { ThemeContext, ThemeProvider } from '@/app/themecontext';
import { AuthProvider } from '@/backend/auth-context';

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
