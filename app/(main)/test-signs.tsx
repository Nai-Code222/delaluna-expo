import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { getAstroSigns } from "@/app/services/astrology-api.service";

export default function TestSignsScreen() {
  const [result, setResult] = useState<{ sunSign: string; moonSign: string; risingSign: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getAstroSigns({
        day: 9,
        month: 9,
        year: 1988,
        hour: 16,
        min: 21,
        lat: 34.9984,
        lon: -91.9837,
        tzone: -5,
      });
      console.log("🔥 Test result:", data);
      setResult(data);
    } catch (e: any) {
      console.error("❌ Error:", e.message);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ Test Astro Signs Function</Text>

      <TouchableOpacity style={styles.button} onPress={handleTest} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Run Test</Text>}
      </TouchableOpacity>

      {error && <Text style={styles.error}>Error: {error}</Text>}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>☀️ Sun: {result.sunSign}</Text>
          <Text style={styles.resultText}>🌙 Moon: {result.moonSign}</Text>
          <Text style={styles.resultText}>⬆️ Rising: {result.risingSign}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 24,
  },
  title: {
    color: "#6FFFE9",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#5BC0BE",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultBox: {
    backgroundColor: "#1C2541",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  resultText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 4,
  },
  error: {
    color: "#ff4d4f",
    marginTop: 10,
  },
});
