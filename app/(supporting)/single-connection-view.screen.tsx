// app/(supporting)/single-connection-view.screen.tsx
import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import HeaderNav from "../components/component-utils/header-nav";
import useRenderBackground from "../hooks/useRenderBackground";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";
import AuthContext from "../backend/auth-context";
import CompatibilityProgressBarComponent from "../components/connection/compatability-progress-bar.component";

/* -------------------------------------------------
   🔮 TYPE DEFINITIONS
---------------------------------------------------*/
interface CompatibilityScores {
  [keyword: string]: number;
}

interface CompatibilityResult {
  title: string;
  summary: string;
  closing?: string;
  scores: CompatibilityScores;
}

interface ConnectionDoc {
  status?: string;
  result?: CompatibilityResult;
}

/* -------------------------------------------------
   🪩 MAIN COMPONENT
---------------------------------------------------*/
export default function SingleConnectionViewScreen() {
  const { connectionId } = useLocalSearchParams<{ connectionId: string }>();
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const renderBackground = useRenderBackground();

  const [connectionData, setConnectionData] = useState<ConnectionDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.uid || !connectionId) return;

    console.log("🔎 Listening for connection:", connectionId);
    const ref = doc(db, "users", user.uid, "connections", connectionId);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ConnectionDoc;
        console.log("🪩 Connection Data:", data);
        setConnectionData(data);
        setLoading(false);
      } else {
        setConnectionData(null);
        setLoading(false);
      }
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => unsub();
  }, [user?.uid, connectionId]);

  if (!user) {
    return renderBackground(
      <View style={styles.centered}>
        <Text style={styles.errorText}>Please log in to view this report.</Text>
      </View>
    );
  }

  if (loading) {
    return renderBackground(
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>✨ Loading Compatibility Report...</Text>
      </View>
    );
  }

  if (!connectionData?.result) {
    return renderBackground(
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          This connection doesn’t have a completed compatibility report yet.
        </Text>
      </View>
    );
  }

  const { result } = connectionData;
  const { title, summary, closing, scores } = result;

  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <HeaderNav
        title="Compatibility Report"
        leftLabel="Back"
        onLeftPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(40) }}
      >
        {/* Title */}
        <Text style={styles.titleText}>{title || "Connection Report"}</Text>

        {/* Summary */}
        {summary && <Text style={styles.summaryText}>{summary}</Text>}

        {/* Compatibility Bars */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Compatibility Breakdown</Text>

          {scores &&
            Object.entries(scores).map(([keyword, value]) => {
              const numericValue =
                typeof value === "number" ? value : Number(value) || 0;

              return (
                <CompatibilityProgressBarComponent
                  key={keyword}
                  keywordLabel={keyword}
                  keywordDefinition={getKeywordDefinition(keyword)}
                  scoreValue={numericValue}
                />
              );
            })}
        </View>

        {/* Closing */}
        {closing && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Final Thoughts</Text>
            <Text style={styles.closingText}>{closing}</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

/* -------------------------------------------------
   🌙 KEYWORD DEFINITIONS
---------------------------------------------------*/
function getKeywordDefinition(keyword: string): string {
  const definitions: Record<string, string> = {
    Resonation: "How deeply your personalities and energies align.",
    Chemistry: "The magnetic attraction and spark between you.",
    Vibe: "The overall energy or atmosphere between you.",
    Attraction: "The physical and emotional pull between you.",
    Intensity: "The strength and emotional charge in your bond.",
    Understanding: "The ability to empathize and interpret each other.",
    Communication: "How effectively you exchange ideas and feelings.",
    Logic: "How aligned your reasoning and decision-making are.",
    Empathy: "Emotional awareness and compassion for each other.",
    Reasoning: "Shared ability to think through and resolve issues.",
    Romance: "Your gestures of affection and connection.",
    Loyalty: "Mutual trust, dependability, and devotion.",
    Devotion: "How committed and emotionally invested you are.",
    Trust: "Confidence in one another’s integrity and honesty.",
    Sacrifice: "Willingness to compromise or put each other first.",
    Stubbornness: "Resistance to compromise or change.",
    PowerStruggle: "Balance of control or influence in the relationship.",
    Patience: "How well you handle tension, time, or differences.",
    Boundaries: "Respect for each other's limits and independence.",
    Independence: "Ability to maintain individuality while connected.",
  };
  return definitions[keyword] || "";
}

/* -------------------------------------------------
   🎨 STYLES
---------------------------------------------------*/
const styles = StyleSheet.create({
  container: { flex: 1, width: "100%" },
  scrollContainer: { paddingHorizontal: scale(16), paddingTop: verticalScale(20) },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    color: "#FFFFFF",
    marginTop: verticalScale(8),
    fontSize: moderateScale(15),
  },
  errorText: {
    color: "#C5AFFF",
    textAlign: "center",
    fontSize: moderateScale(14),
    marginHorizontal: scale(20),
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: moderateScale(22),
    fontWeight: "700",
    marginBottom: verticalScale(12),
  },
  summaryText: {
    color: "#C5AFFF",
    fontSize: moderateScale(14),
    lineHeight: verticalScale(20),
    marginBottom: verticalScale(18),
  },
  sectionContainer: {
    marginBottom: verticalScale(25),
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(15),
    marginBottom: verticalScale(10),
  },
  closingText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    lineHeight: verticalScale(20),
  },
});
