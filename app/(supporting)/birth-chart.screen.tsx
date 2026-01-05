import React, { useEffect } from "react";
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "@/backend/auth-context";
import { router } from "expo-router";

export default function BirthChartScreen() {
  const {
    birthChart,
    birthChartStatus,
    birthChartError,
    birthChartLoading,
    regenerateBirthChart,
  } = useAuth();

  useEffect(() => {
    console.log("📊 BirthChart status update:", {
      status: birthChartStatus,
      loading: birthChartLoading,
      error: birthChartError,
    });
  }, [birthChartStatus, birthChartLoading, birthChartError]);

  // Status and step from new Firestore schema
  const statusState = birthChart?.status?.state;
  const statusStep = birthChart?.status?.step;

  const isLoading = birthChartLoading || statusState === "processing";

  const chartImageUrl = birthChart?.svg?.downloadUrl ?? null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Birth Chart</Text>

      {/* STATUS / LOADING */}
      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#A78BFA" />
          <Text style={styles.loadingText}>
            {statusStep === "svg" && "✨ Casting your chart wheel…"}
            {statusStep === "free" && "🔮 Writing your chart overview…"}
            {statusStep === "premium" && "🌙 Finalizing your interpretation…"}
          </Text>
        </View>
      )}

      {/* ERROR */}
      {birthChart?.error?.message && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            Something went wrong: {birthChart?.error?.message ?? "Unknown error"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={regenerateBirthChart}>
            <Text style={styles.retryButtonText}>Retry Generation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CHART IMAGE */}
      {!isLoading && chartImageUrl && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: chartImageUrl }}
            style={styles.chartImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* NATAL TABLE */}
      {!isLoading && Array.isArray(birthChart?.natalTable) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Placements</Text>

          {birthChart.natalTable.map((row: any, idx: number) => (
            <View key={idx} style={styles.placementRow}>
              <Text style={styles.placementKey}>{row.planet}</Text>
              <Text style={styles.placementValue}>
                {row.degree} · {row.sign} · House {row.house}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* REGENERATE */}
      {!isLoading && (
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={regenerateBirthChart}
        >
          <Text style={styles.regenerateButtonText}>Regenerate Chart</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#FFF",
  },
  loadingBox: {
    alignItems: "center",
    marginVertical: 20,
    paddingVertical: 20,
  },
  loadingText: {
    color: "#DDD",
    marginTop: 10,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: "#ffdddd22",
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#A78BFA",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
  imageWrapper: {
    width: "100%",
    alignItems: "center",
    marginVertical: 20,
  },
  chartImage: {
    width: "100%",
    height: 350,
    borderRadius: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 10,
  },
  sectionText: {
    color: "#DDD",
    fontSize: 16,
    lineHeight: 22,
  },
  placementRow: {
    marginBottom: 10,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ffffff22",
  },
  placementKey: {
    fontSize: 16,
    color: "#A78BFA",
    fontWeight: "600",
  },
  placementValue: {
    color: "#EEE",
    fontSize: 16,
  },
  regenerateButton: {
    marginTop: 30,
    backgroundColor: "#6D28D9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  regenerateButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});