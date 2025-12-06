import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  UIManager,
} from "react-native";
import { getUserSignsAndChart } from "@/services/astrology-api.service";
import { useRouter } from "expo-router";

// Enable smooth animations on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TestSignsScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Generate random birth for fast testing
  function randomBirth() {
    return {
      day: Math.floor(Math.random() * 28) + 1,
      month: Math.floor(Math.random() * 12) + 1,
      year: Math.floor(Math.random() * 35) + 1970,
      hour: Math.floor(Math.random() * 24),
      min: Math.floor(Math.random() * 60),
    };
  }

  const handleTestConnection = async () => {
    router.replace({
        pathname: "/(test-supporting)/get-connection-setup-test.screen",
      });
  };

  const handleTestSigns = async () => {
    const birth = randomBirth();
    let returnedSigns;

    const sentBirth = {
      ...birth,
      lat: 34.9984,
      lon: -91.9837,
      tzone: -5,
    };

    // Format parameters needed for getUserSignsAndChart
    const fullBirthParams = {
      ...sentBirth,
      birthDate: `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`,
      birthTime: `${String(birth.hour).padStart(2, "0")}:${String(birth.min).padStart(2, "0")}`,
      timezone: sentBirth.tzone,
    };

    setLoading(true);
    setError(null);

    try {
      const data = await getUserSignsAndChart(fullBirthParams);
      returnedSigns = data;
    } catch (e: any) {
      setError(e.message || "Unknown error");
      returnedSigns = null;
    } finally {
      setLoading(false);

      router.replace({
        pathname: "/(test-supporting)/get-signs-tests.screen",
        params: {
          sent: JSON.stringify(fullBirthParams),
          returned: JSON.stringify(returnedSigns),
        },
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💫 Test Actions</Text>

      {/* Run getSigns Test */}
      <TouchableOpacity
        style={[styles.button, { marginTop: 20, backgroundColor: "#3A506B" }]}
        onPress={handleTestSigns}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>✨ Run getSigns Test</Text>
        )}
      </TouchableOpacity>

      {/* Run Connection Test */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#5BC0BE" }]}
       onPress={handleTestConnection}
      >
        <Text style={styles.buttonText}>💞 Run Connection Test</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>Error: {error}</Text>}
    </ScrollView>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#000",
    padding: 24,
  },
  title: {
    color: "#6FFFE9",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 45,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 15,
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
    marginTop: 10,
  },
});
