// app/_layout.tsx
import "react-native-gesture-handler";
import "react-native-reanimated";

import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Slot, Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ImageBackground } from "react-native";

import { AuthProvider, useAuth } from "../src/backend/auth-context";
import { ThemeProvider } from "./theme-context";
import { DelalunaToastProvider } from "../src/components/component-utils/delaluna-toast.component";
import LoadingScreen from "@/components/component-utils/loading-screen";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const router = useRouter();
  const { authUser, isAppReady } = useAuth();

  useEffect(() => {
    if (!isAppReady) return;

    if (authUser) {
      router.replace("/(main)");
    } else {
      router.replace("/(auth)/welcome");
    }

    SplashScreen.hideAsync();
  }, [isAppReady, authUser]);

  if (!isAppReady) {
    return <LoadingScreen message="Preparing your stars..." progress={0} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    // Ensures Swipeable and Reanimated gestures work globally
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#1b0634ff" }}>
      <ImageBackground
        source={require("@/assets/images/background.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <ThemeProvider>
          <AuthProvider>
            {/* Global toast provider for all screens */}
            <DelalunaToastProvider>
              <Slot/>
            </DelalunaToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}
