import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
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
import HeaderNav from "../../src/components/component-utils/header-nav";
import { ThemeContext } from "../theme-context";
import { useUserProfile } from "@/hooks/useUserProfile"; import { getDoc, doc } from "firebase/firestore";
import HomeSignsDisplay from "../../src/components/home/home-signs-display.component";
import HomeTextBox from "../../src/components/home/home-text-box.component";
import useRenderBackground from "@/hooks/useRenderBackground"; import DateSwitcher from "../../src/components/component-utils/date-switcher.component";
import { auth, db } from "../../firebaseConfig";
import { generateAndSaveBirthChart } from "@/services/firebase-ai-logic.service";
import { buildBirthChartPrompt } from "../../functions/src/utils/buildBirthChartPrompt";
import type { DrawnTarotCard } from "@/types/tarot-cards.type";

export default function HomeScreen() {
  const { authUser, initializing, horoscopes, dailyCards } = useContext(AuthContext);
  useEffect(() => {
    console.log("🏠 Home received from context");
  }, [horoscopes, dailyCards]);
  
  const today = dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(today);

  const selectedHoroscope = horoscopes?.[selectedDate];
  const selectedCards = dailyCards?.[selectedDate];

  const insets = useSafeAreaInsets();
  const goToProfile = () => router.replace("/(supporting)/profile.screen");
  const safeOffset =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;
  const { theme } = useContext(ThemeContext);
  const { user: userParam } = useLocalSearchParams();
  const initialUserRecord = userParam ? JSON.parse(userParam as string) : null;
  const HEADER_HEIGHT = Platform.OS === "ios" ? 115 : 85;
  
  // Firestore user profile (cached + realtime)
  const { user: userRecord, loading: profileLoading, cachedAt } = useUserProfile(
    authUser?.uid,
    initialUserRecord
  );

  const maybeGenerateBirthChart = async () => {
    if (!authUser?.uid || !userRecord) return;

    const chartRef = doc(
      db,
      "users",
      authUser.uid,
      "birthChart",
      "default"
    );

    const snap = await getDoc(chartRef);

    // If already generated, do nothing
    if (snap.exists()) {
      const data = snap.data();
      if (data?.status === "complete" && data?.imageUrl) {
        return;
      }
    }

    console.log("🌌 Generating birth chart...");

    const prompt = buildBirthChartPrompt({
      birthDate: userRecord.birthday,
      birthTime: userRecord.birthtime,
      lat: userRecord.birthLat,
      lon: userRecord.birthLon,
      timezone: userRecord.tZoneOffset,
    });

    await generateAndSaveBirthChart(authUser.uid, prompt);

    console.log("✨ Birth chart saved");
  };

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    if (!authUser?.uid) return;

    setRefreshing(true);

    try {

      // const cards = await getTarotCardDraw(
      //   authUser.uid,
      //   3,
      // );

      // const horoscopes = await generateHoroscopes(authUser.uid, userRecord.risingSign, userRecord.sunSign, userRecord.moonSign, cards);

      // Generate birth chart
      //await maybeGenerateBirthChart();

      // Optional: re-fetch user doc
      const snap = await getDoc(doc(db, "users", authUser.uid));
      if (snap.exists()) {
        console.log("Manually refreshed user data:", snap.data());
      }
    } catch (e) {
      console.warn("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [authUser?.uid, userRecord]);

  //  Fade animation on theme change
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
    if (!initializing && !authUser) router.replace("/(auth)/welcome");
  }, [initializing, authUser]);

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

      {/* Wrap main content with top offset */}
      <View style={[styles.mainContent, { marginTop: HEADER_HEIGHT }]}>
        <View style={[ { width: '100%' }]}>
          <HomeSignsDisplay
            sun={userRecord.sunSign}
            moon={userRecord.moonSign}
            rising={userRecord.risingSign}
          />
        </View>
        <DateSwitcher
          value={selectedDate}
          onChange={setSelectedDate}
          dates={Object.keys(horoscopes ?? {})}
        />
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
            {selectedHoroscope?.quote && (
              <HomeTextBox title="Quote" content={selectedHoroscope.quote} />
            )}

            {selectedHoroscope?.advice && (
              <HomeTextBox title="Advice" content={selectedHoroscope.advice} />
            )}

            {selectedHoroscope?.do && (
              <HomeTextBox title="Do's" content={selectedHoroscope.do} />
            )}

            {selectedHoroscope?.dont && (
              <HomeTextBox title="Don'ts" content={selectedHoroscope.dont} />
            )}

            {selectedHoroscope?.affirmation && (
              <HomeTextBox title="Affirmation" content={selectedHoroscope.affirmation} />
            )}

            {selectedCards?.cards && (
  <HomeTextBox
    title="Today's Cards"
    content={selectedHoroscope.tarot}
  />
)}

            {selectedHoroscope?.moon && (
              <HomeTextBox title="Moon Phase" content={selectedHoroscope.moon} />
            )}

            {selectedHoroscope?.luckyNumbers && (
              <HomeTextBox title="Lucky Numbers" content={selectedHoroscope.luckyNumbers} />
            )}

            {selectedHoroscope?.newLove && (
              <HomeTextBox title="New Love" content={selectedHoroscope.newLove} />
            )}

            {selectedHoroscope?.release && (
              <HomeTextBox title="Release" content={selectedHoroscope.release} />
            )}
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
    paddingBottom: 10,
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  datePicker: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "15%",
  }
});
