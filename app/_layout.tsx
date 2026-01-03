// app/_layout.tsx
import "react-native-gesture-handler";
import "react-native-reanimated";

import React from "react";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/backend/auth-context";
import { ThemeProvider } from "./theme-context";
import { DelalunaToastProvider } from "../src/components/component-utils/delaluna-toast.component";
import { ImageBackground, StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    // Ensures Swipeable and Reanimated gestures work globally
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0B0215" }}>
      <ImageBackground
        source={require("@/assets/images/background.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ThemeProvider>
          <AuthProvider>
            {/* Global toast provider for all screens */}
            <DelalunaToastProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </DelalunaToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}
