import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import HeaderNav from "../../src/components/component-utils/header-nav";
import { ThemeContext } from "../theme-context";
import HomeSignsDisplay from "../../src/components/home/home-signs-display.component";
import HomeTextBox from "../../src/components/home/home-text-box.component";
import useRenderBackground from "@/hooks/useRenderBackground";
import DateSwitcher from "../../src/components/component-utils/date-switcher.component";
import { db } from "../../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import { useAuth } from "@/backend/auth-context";

export default function HomeScreen() {
  const {
    authUser,
    isAppReady,
    profile,
    horoscopes,
    dailyCards,
    availableDates,
    defaultDate,
    birthChart,
    birthChartStatus,
    birthChartLoading,
    regenerateBirthChart,
  } = useAuth();

  const todayKey = dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!availableDates?.length) return;

    if (availableDates.includes(todayKey)) {
      setSelectedDate(todayKey);
    } else {
      setSelectedDate(defaultDate);
    }
  }, [availableDates, defaultDate, todayKey]);

  const selectedHoroscope = selectedDate ? horoscopes?.[selectedDate] ?? null : null;
  const selectedCards = selectedDate ? dailyCards?.[selectedDate]?.cards ?? null : null;

  const insets = useSafeAreaInsets();
  const goToProfile = () => router.replace("/(supporting)/profile.screen");
  const safeOffset =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;
  const { theme } = useContext(ThemeContext);
  const { user: userParam } = useLocalSearchParams();
  const initialUserRecord = userParam ? JSON.parse(userParam as string) : null;
  const HEADER_HEIGHT = Platform.OS === "ios" ? 115 : 85;

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    if (!authUser?.uid) return;

    setRefreshing(true);

    try {
      // 🔮 Trigger birth chart generation on pull-to-refresh
      if (birthChartStatus !== "processing") {
        regenerateBirthChart();
      }

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
  }, [authUser?.uid, birthChartStatus, regenerateBirthChart]);


  // Auth guard
  useEffect(() => {
    if (isAppReady === false && !authUser) console.log("/(auth)/welcome");
  }, [isAppReady, authUser]);

  // Background renderer
  const renderBackground = useRenderBackground();

  // ⏳ While auth/profile loading
  if (!isAppReady) {
    return renderBackground(
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return renderBackground(
    <View style={styles.container}>
      <HeaderNav
        title="Home"
        
        rightIconName="person-circle-outline"
        onRightPress={goToProfile}
      />

      {/* Wrap main content with top offset */}
      <View style={[styles.mainContent, { marginTop: HEADER_HEIGHT }]}>
        <View style={[{ width: '100%' }]}>
          {profile && (
            <HomeSignsDisplay
              sun={profile.sunSign}
              moon={profile.moonSign}
              rising={profile.risingSign}
            />
          )}
        </View>

        {/* 🌌 Birth Chart Section */}
        <View style={{ width: "100%", marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Birth Chart</Text>

          {birthChartLoading && (
            <Text style={styles.subtleText}>
              Generating your birth chart…
            </Text>
          )}

          {!birthChartLoading && !birthChart && (
            <Text style={styles.subtleText}>
              Your birth chart isn’t ready yet.
            </Text>
          )}

          {birthChartStatus === "error" && (
            <Text style={styles.errorText}>
              Something went wrong generating your chart.
            </Text>
          )}

          {!birthChartLoading && (
            <View style={{ marginTop: 8 }}>
              <Text
                style={styles.actionText}
                onPress={regenerateBirthChart}
              >
                {birthChart ? "Regenerate Birth Chart" : "Generate Birth Chart"}
              </Text>
            </View>
          )}
        </View>
        {availableDates?.length > 0 && selectedDate && (
          <DateSwitcher
            value={selectedDate}
            onChange={setSelectedDate}
            dates={availableDates}
          />
        )}
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

            {selectedCards && selectedCards.length > 0 && selectedHoroscope?.tarot && (
              <HomeTextBox
                title="Today's Cards"
                content={selectedHoroscope.tarot}
                cards={selectedCards}
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
    </View>
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    alignSelf: "center",
  },
  subtleText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    textAlign: "center",
  },
  actionText: {
    color: "#C77DFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
