import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { db } from "../../firebaseConfig";
import { scale, verticalScale } from "@/utils/responsive";

// Enable smooth expand animations on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 💫 Keyword definitions
const keywordDefinitions: Record<string, string> = {
  Interest: "How naturally your attention and curiosity gravitate toward each other.",
  Communication: "How clearly you exchange thoughts, emotions, and ideas.",
  Resonation: "The level of emotional frequency and energy alignment.",
  Reasoning: "Your shared logic, perspective, and problem-solving flow.",
  Loyalty: "Consistency, dependability, and commitment to the bond.",
  Attraction: "Physical and magnetic chemistry that draws you together.",
  Stubbornness: "Your ability (or inability) to compromise when differences arise.",
  Sacrifice: "How much each person is willing to give for the relationship.",
};

// 🎨 Bar color by percentage
const getBarColor = (value: number) => {
  if (value >= 75) return "#41FF88"; // green
  if (value >= 50) return "#FFDD00"; // yellow
  return "#FF3B3B"; // red
};

export default function SingleConnectionViewScreen() {
  const { connectionId } = useLocalSearchParams();
  const [result, setResult] = useState<any>(null);
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, Animated.Value>>({});

  useEffect(() => {
    const fetchConnection = async () => {
      try {
        const userId = "your-user-id"; // 🔑 replace with AuthContext user.uid
        const ref = doc(db, "users", userId, "connections", connectionId as string);
        const snap = await getDoc(ref);
        if (snap.exists()) setResult(snap.data()?.result);
      } catch (error) {
        console.error("❌ Error loading compatibility:", error);
      }
    };
    fetchConnection();
  }, [connectionId]);

  // Animate bars once data loads
  useEffect(() => {
    if (!result?.scores) return;
    const anims: Record<string, Animated.Value> = {};

    Object.keys(result.scores).forEach((key) => {
      anims[key] = new Animated.Value(0);
    });

    setAnimatedValues(anims);

    Object.entries(result.scores).forEach(([key, val], index) => {
      const target = Number(val);
      Animated.timing(anims[key], {
        toValue: target,
        duration: 900,
        delay: index * 80,
        useNativeDriver: false,
      }).start();
    });
  }, [result]);

  const handleToggleKeyword = (keyword: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedKeyword((prev) => (prev === keyword ? null : keyword));
  };

  if (!result) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading Compatibility...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#1C003F", "#300067", "#4C008A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Compatibility</Text>
        <Text style={styles.subHeader}>First Individual ⚡ Second Individual</Text>

        {/* 🌙 Animated Scores */}
        {Object.entries(result.scores || {}).map(([keyword, value]) => {
          const numValue = Number(value);
          const barColor = getBarColor(numValue);
          const animWidth = animatedValues[keyword] || new Animated.Value(0);
          const definition = keywordDefinitions[keyword] ?? "Definition not available.";

          return (
            <View key={keyword} style={styles.keywordContainer}>
              <TouchableOpacity onPress={() => handleToggleKeyword(keyword)} activeOpacity={0.7}>
                <View style={styles.row}>
                  <Text style={styles.keyword}>{keyword}</Text>
                  <Text style={styles.value}>{Math.round(numValue)}%</Text>
                </View>

                <View style={styles.barBackground}>
                  <Animated.View
                    style={[
                      styles.barFill,
                      {
                        width: animWidth.interpolate({
                          inputRange: [0, 100],
                          outputRange: ["0%", "100%"],
                        }),
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {expandedKeyword === keyword && (
                <Text style={styles.definition}>{definition}</Text>
              )}
            </View>
          );
        })}

        {result.closing && <Text style={styles.closing}>✨ {result.closing}</Text>}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(25),
  },
  header: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  subHeader: {
    color: "#B8A3FF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: verticalScale(20),
  },
  keywordContainer: {
    marginBottom: verticalScale(15),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  keyword: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  barBackground: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    marginTop: 4,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 6,
  },
  definition: {
    color: "#D3CFFF",
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    marginTop: verticalScale(6),
    paddingLeft: 4,
  },
  closing: {
    color: "#D0B8FF",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: verticalScale(25),
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C003F",
  },
  loading: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
