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
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import AuthContext from "../backend/auth-context";
import HeaderNav from "../components/component-utils/header-nav";
import { ThemeContext } from "../theme-context";
import { useUserProfile } from "../hooks/useUserProfile";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import HomeSignsDisplay from "../components/home/home-signs-display.component";

export default function HomeScreen() {
  const { user, initializing } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const safeOffset =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;
  const { theme } = useContext(ThemeContext);
  const { user: userParam } = useLocalSearchParams();
  const initialUserRecord = userParam ? JSON.parse(userParam as string) : null;

  // 🌙 Firestore user profile (cached + realtime)
  const { user: userRecord, loading: profileLoading, cachedAt } = useUserProfile(
    user?.uid,
    initialUserRecord
  );

  // 🔄 Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const freshData = snap.data();
        console.log("🔄 Manually refreshed user data:", freshData);
      }
    } catch (e) {
      console.warn("⚠️ Manual refresh failed:", e);
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

  // 🧭 Auth guard
  useEffect(() => {
    if (!initializing && !user) router.replace("/(auth)/welcome");
  }, [initializing, user]);

  // 🎨 Background renderer
  const renderBackground = (children: React.ReactNode) => {
    if (theme.backgroundType === "image" && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={styles.background}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      );
    }
    if (theme.backgroundType === "gradient" && theme.gradient) {
      const angle = theme.gradient.angle ?? 0;
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{
            x: Math.cos((angle * Math.PI) / 180),
            y: Math.sin((angle * Math.PI) / 180),
          }}
          style={styles.background}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View
        style={[styles.background, { backgroundColor: theme.colors.background }]}
      >
        {children}
      </View>
    );
  };

  // ⏳ While auth/profile loading
  if (initializing || profileLoading) {
    return renderBackground(
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const goToProfile = () => router.replace("/(supporting)/profile.screen");

  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <ExpoStatusBar style="light" />
      <HeaderNav
        title="home"
        leftIconName="person-circle-outline"
        onLeftPress={goToProfile}
      />
      <HomeSignsDisplay sun={userRecord.sunSign} moon={userRecord.moonSign} rising={userRecord.risingSign} />
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
          <Text style={styles.title}>
            Welcome
            {userRecord?.displayName ? `, ${userRecord.displayName}` : "!"}
          </Text>
          <Text style={styles.email}>
            {user ? `Logged in as: ${user.email}` : "No user logged in."}
          </Text>

          {userRecord && (
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Text style={styles.detail}>☀️ Sun: {userRecord.sunSign}</Text>
              <Text style={styles.detail}>🌙 Moon: {userRecord.moonSign}</Text>
              <Text style={styles.detail}>⬆️ Rising: {userRecord.risingSign}</Text>
              <Text style={[styles.detail, { opacity: 0.7 }]}>
                Theme: {userRecord.themeKey}
              </Text>
              {cachedAt && (
                <Text style={[styles.detail, { fontSize: 13, opacity: 0.6 }]}>
                  Last synced: {new Date(cachedAt).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%" },
  background: { flex: 1, width: "100%", height: "100%" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContainer: { flexGrow: 1 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 24, marginBottom: 8, color: "#fff", fontWeight: "600" },
  email: { fontSize: 16, marginBottom: 20, color: "#ddd" },
  detail: { fontSize: 16, color: "#fff", marginVertical: 2 },
});
