// app/home/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

export default function HomeLayout() {
  return (
    // Again, no children needed
    <Tabs screenOptions={{ headerShown: false }} />
  );
}
