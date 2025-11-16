import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Platform,
  StatusBar,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import AuthContext from "../../src/backend/auth-context";
import HeaderNav from "../components/component-utils/header-nav";
import { ThemeContext } from "../theme-context";
import { useUserProfile } from "../hooks/useUserProfile";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import HomeSignsDisplay from "../components/home/home-signs-display.component";
import HomeTextBox from "../components/home/home-text-box.component";
import useRenderBackground from "../hooks/useRenderBackground";
import DateSwitcher from "../components/component-utils/date-switcher.component";

export default function HomeScreen() {
  const { user, initializing } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const goToProfile = () => router.replace("/(supporting)/profile.screen");
  const safeOffset =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;
  const { theme } = useContext(ThemeContext);
  const { user: userParam } = useLocalSearchParams();
  const initialUserRecord = userParam ? JSON.parse(userParam as string) : null;
  const HEADER_HEIGHT = Platform.OS === "ios" ? 115 : 85;

  // 🌙 Firestore user profile (cached + realtime)
  const { user: userRecord, loading: profileLoading, cachedAt } = useUserProfile(
    user?.uid,
    initialUserRecord
  );

  const sectionLabels = [
    "Quote",
    "Advice",
    "Affirmation",
    "Message in a Bottle",
    "Moon Phase",
    "Todays Cards",
    "New Love",
    "Release",
  ];

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const freshData = snap.data();
        console.log("Manually refreshed user data:", freshData);
      }
    } catch (e) {
      console.warn("Manual refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  // ✨ Fade animation on theme change
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  // Auth guard
  useEffect(() => {
    if (!initializing && !user) router.replace("/(auth)/welcome");
  }, [initializing, user]);

  // Background renderer
  const renderBackground = useRenderBackground();

  // ⏳ While auth/profile loading
  if (initializing || profileLoading) {
    return renderBackground(
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }


  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <HeaderNav
        title="Home"
        rightIconName="person-circle-outline"
        onRightPress={goToProfile}
      />

      {/* 👇 Wrap main content with top offset */}
      <View style={[styles.mainContent, { marginTop: HEADER_HEIGHT }]}>
        <View style={styles.homeTextBox}>
          <HomeSignsDisplay
            sun={userRecord.sunSign}
            moon={userRecord.moonSign}
            rising={userRecord.risingSign}
          />

        </View>
        <DateSwitcher>

        </DateSwitcher>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        >
          <View style={styles.content}>
            {sectionLabels.map((label, index) => (
              <HomeTextBox key={index} title={label} style={{ marginBottom: 15 }} />
            ))}
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );

}


const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    flexDirection: "column",
  },
  mainContent: {
    flex: 1,
    width: "100%",
  },
  homeTextBox: {
    width: "100%",
    marginBottom: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  datePicker:{
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "15%",
  }
});
