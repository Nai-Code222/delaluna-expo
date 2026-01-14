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

import { router, useLocalSearchParams } from "expo-router";

import dayjs, { tz } from "dayjs";
import { DateTime } from "luxon";
import { getDoc, doc } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MoonView from "@/components/home/moon-view.component";
import SectionTitle from "@/components/typography/section-title";
import useRenderBackground from "@/hooks/useRenderBackground";
import { scale } from "@/utils/responsive";
import { useAuth } from "@/backend/auth-context";

import DateSwitcher from "../../src/components/component-utils/date-switcher.component";
import HeaderNav from "../../src/components/component-utils/header-nav";
import HomeSignsDisplay from "../../src/components/home/home-signs-display.component";
import HomeTextBox from "../../src/components/home/home-text-box.component";
import { ThemeContext } from "../theme-context";
import { db } from "../../firebaseConfig";

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
  const iconSize = scale(20);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    if (!authUser?.uid) return;

    setRefreshing(true);

    try {
      // Trigger birth chart regeneration if needed
      if (birthChartStatus !== "processing") {
        regenerateBirthChart();
      }

      // Optional: re-fetch user doc
      const snap = await getDoc(doc(db, "users", authUser.uid));
      if (snap.exists()) {
        console.log("✅ Manually refreshed user data");
      }
    } catch (e) {
      console.warn("⚠️ Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [authUser?.uid, birthChartStatus, regenerateBirthChart]);

  // Auth guard
  useEffect(() => {
    if (isAppReady === false && !authUser) {
      console.log("Redirecting to /(auth)/welcome");
    }
  }, [isAppReady, authUser]);

  // Background renderer
  const renderBackground = useRenderBackground();

  // Loading state
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

      <View style={[styles.mainContent, { marginTop: HEADER_HEIGHT }]}>
        <View style={{ width: '100%' }}>
          
        </View>

        {/* Birth Chart Section */}
        <View style={{ width: "100%", marginBottom: 16 }}>
          {birthChartLoading && (
            <Text style={styles.subtleText}>
              Generating your birth chart…
            </Text>
          )}

          {!birthChartLoading && !birthChart && (
            <Text style={styles.subtleText}>
              Your birth chart isn't ready yet.
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
            <SectionTitle sectionName="quote" title="Quote" />
            <HomeTextBox sectionName="quote" content={selectedHoroscope?.quote} />

            {selectedHoroscope?.advice && (
              <>
                <SectionTitle sectionName="advice" title="Advice" />
                <HomeTextBox sectionName="advice" content={selectedHoroscope.advice} />
              </>
            )}

            {selectedHoroscope?.do && (
              <>
                <SectionTitle sectionName="dos" title="Do's" />
                <HomeTextBox sectionName="dos" content={selectedHoroscope.do} />
              </>
            )}

            {selectedHoroscope?.dont && (
              <>
                <SectionTitle sectionName="donts" title="Don'ts" />
                <HomeTextBox sectionName="donts" content={selectedHoroscope.dont} />
              </>
            )}

            {selectedHoroscope?.affirmation && (
              <>
                <SectionTitle sectionName="affirmation" title="Affirmation" />
                <HomeTextBox sectionName="affirmation" content={selectedHoroscope.affirmation} />
              </>
            )}

            {selectedCards && selectedCards.length > 0 && selectedHoroscope?.tarot && (
              <>
                <SectionTitle sectionName="tarot" title="Today's Cards" />
                <HomeTextBox
                  sectionName="tarot"
                  content={selectedHoroscope.tarot}
                  cards={selectedCards}
                />
              </>
            )}

            <>
              <SectionTitle sectionName="message" title="Message in a Bottle" />
              <HomeTextBox sectionName="message" />
            </>

            <SectionTitle sectionName="moon" title="Moon Phase" />
            <MoonView
              moon={selectedHoroscope?.moon}
              moonPhaseDetails={selectedHoroscope?.moonPhaseDetails}
            />

            {selectedHoroscope?.planetsRetrograde && (
              <>
                <SectionTitle sectionName="retrograde" title="Planets in Retrograde" />
                <HomeTextBox sectionName="retrograde" content={selectedHoroscope.planetsRetrograde} />
              </>
            )}

            {selectedHoroscope?.newLove && (
              <>
                <SectionTitle sectionName="newLove" title="New Love" />
                <HomeTextBox sectionName="newLove" content={selectedHoroscope.newLove} />
              </>
            )}

            {selectedHoroscope?.returns && (
              <>
                <SectionTitle sectionName="returns" title="Returns" />
                <HomeTextBox sectionName="returns" content={selectedHoroscope.returns} />
              </>
            )}

            {selectedHoroscope?.luckyNumbers && (
              <>
                <SectionTitle sectionName="luckyNumbers" title="Lucky Numbers" />
                <HomeTextBox sectionName="luckyNumbers" content={selectedHoroscope.luckyNumbers} />
              </>
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
  titleRow: {
    flexDirection: "row",
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