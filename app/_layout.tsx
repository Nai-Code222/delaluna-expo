// app/_layout.tsx
import "react-native-gesture-handler";
import "react-native-reanimated"; // must be right after gesture-handler

import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./backend/auth-context";
import { ThemeProvider } from "./theme-context";

export default function RootLayout() {
  return (
    // 👇 This ensures Swipeable + Reanimated gestures work globally
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
