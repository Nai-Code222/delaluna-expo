// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // One-line, no children: router auto-wires index/login/signup/home
    <Stack screenOptions={{ headerShown: false }} />
  );
}
