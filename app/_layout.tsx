// app/_layout.tsx
import React from 'react';
import { Stack, Slot } from 'expo-router';
import { AuthProvider } from '@/backend/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* This is where all child routes like /home, /login appear */}
        <Slot />
      </Stack>
    </AuthProvider>
  );
}
