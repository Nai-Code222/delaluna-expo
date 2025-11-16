// app/_layout.tsx
import "react-native-gesture-handler";
import "react-native-reanimated"; // must be right after gesture-handler

import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/backend/auth-context";
import { ThemeProvider } from "./theme-context";
import { DelalunaToastProvider } from "./components/component-utils/delaluna-toast.component";

export default function RootLayout() {
  return (
    // Ensures Swipeable and Reanimated gestures work globally
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          {/* Global toast provider for all screens */}
          <DelalunaToastProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </DelalunaToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
