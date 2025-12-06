import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import { getUserSignsAndChart } from "@/services/astrology-api.service";

export default function GetSignsTestScreen() {
  const router = useRouter();
  const { sent, returned } = useLocalSearchParams();

  // Normalize Expo Router params (string | string[])
  const sentStr = Array.isArray(sent) ? sent[0] : sent;
  const returnedStr = Array.isArray(returned) ? returned[0] : returned;

  // Parse initial values
  const initialSent = JSON.parse(sentStr!);
  const initialReturned = JSON.parse(returnedStr!);

  // Store current test session
  const [sentBirth, setSentBirth] = useState(initialSent);
  const [returnedSigns, setReturnedSigns] = useState(initialReturned);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [birthChart, setBirthChart] = useState("");
  const [chartExpanded, setChartExpanded] = useState(false);

  // Fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function randomBirth() {
    return {
      day: Math.floor(Math.random() * 28) + 1,
      month: Math.floor(Math.random() * 12) + 1,
      year: Math.floor(Math.random() * 35) + 1970,
      hour: Math.floor(Math.random() * 24),
      min: Math.floor(Math.random() * 60),
    };
  }

  const animateFade = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  };

  const handleRandomize = async () => {
    const birth = randomBirth();
    const newSentBirth = {
      ...birth,
      lat: 34.9984,
      lon: -91.9837,
      tzone: -5,
    };

    setLoading(true);
    setError(null);

    try {
      const fullBirthParams = {
        ...newSentBirth,
        birthDate: `${newSentBirth.year}-${String(newSentBirth.month).padStart(2, "0")}-${String(newSentBirth.day).padStart(2, "0")}`,
        birthTime: `${String(newSentBirth.hour).padStart(2, "0")}:${String(newSentBirth.min).padStart(2, "0")}`,
        timezone: newSentBirth.tzone,
      };

      const data = await getUserSignsAndChart(fullBirthParams);

      // Update values
      setSentBirth(newSentBirth);
      setReturnedSigns(data);
      setBirthChart(data.birthChart || "");

      // Fade in effect
      animateFade();
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>✨ get User Astro Info Test</Text>

      {/* Animate BOTH sections together */}
      <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>

        {/* ⭐ SECTION 1: SENT PARAMS */}
        <View style={styles.resultBox}>
          <Text style={styles.resultHeader}>📦 Sent Birth Parameters</Text>

          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>📅 Day</Text>
            <Text style={styles.resultValue}>{sentBirth.day}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>📆 Month</Text>
            <Text style={styles.resultValue}>{sentBirth.month}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>🗓 Year</Text>
            <Text style={styles.resultValue}>{sentBirth.year}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>⏰ Hour</Text>
            <Text style={styles.resultValue}>{sentBirth.hour}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>🕒 Min</Text>
            <Text style={styles.resultValue}>{sentBirth.min}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>📍 Lat</Text>
            <Text style={styles.resultValue}>{sentBirth.lat}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>📍 Lon</Text>
            <Text style={styles.resultValue}>{sentBirth.lon}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>🕑 Timezone</Text>
            <Text style={styles.resultValue}>{sentBirth.tzone}</Text>
          </View>
        </View>

        {/* ⭐ SECTION 2: RETURNED SIGNS */}
        <View style={[styles.resultBox, { marginTop: 20 }]}>
          <Text style={styles.resultHeader}>🔮 Returned Signs</Text>

          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>☀️ Sun</Text>
            <Text style={styles.resultValue}>{returnedSigns.sunSign}</Text>
          </View>

          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>🌙 Moon</Text>
            <Text style={styles.resultValue}>{returnedSigns.moonSign}</Text>
          </View>

          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>⬆️ Rising</Text>
            <Text style={styles.resultValue}>{returnedSigns.risingSign}</Text>
          </View>
        </View>

        {/* ⭐ SECTION 3: Birth Chart (Expandable) */}
        <View style={[styles.resultBox, { marginTop: 20 }]}>
          <TouchableOpacity onPress={() => setChartExpanded(!chartExpanded)}>
            <Text style={styles.resultHeader}>
              🜁 Birth Chart {chartExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {chartExpanded && (
            <View style={{ marginTop: 10 }}>
              {birthChart ? (
                <View style={styles.chartCard}>
                  <Text style={styles.chartText}>{birthChart}</Text>
                </View>
              ) : (
                <View style={styles.chartCard}>
                  <Text style={styles.chartPending}>Birth chart still generating...</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>

      {/* ⭐ BUTTONS */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#3A506B" }]}
        onPress={handleRandomize}
      >
        <Text style={styles.buttonText}>
          {loading ? "Loading..." : "🎲 Randomize Again"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#5BC0BE" }]}
        onPress={() => router.replace("/(main)/test-signs")}
      >
        <Text style={styles.buttonText}>← Go Back</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>Error: {error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#000",
    flexGrow: 1,
  },
  title: {
    color: "#6FFFE9",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 45,
    paddingBottom: 10,
  },
  resultBox: {
    backgroundColor: "#1C2541",
    padding: 20,
    borderRadius: 10,
    width: "100%",
  },
  resultHeader: {
    color: "#6FFFE9",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  resultPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  resultValue: {
    color: "#C5AFFF",
    fontSize: 15,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#ff4d4f",
    marginTop: 12,
    textAlign: "center",
  },
  chartCard: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A506B",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginTop: 6,
  },
  chartText: {
    color: "#C5AFFF",
    fontSize: 15,
    lineHeight: 22,
  },
  chartPending: {
    color: "#888",
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
