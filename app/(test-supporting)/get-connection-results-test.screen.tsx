import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// Enable smooth animations
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function GetConnectionResultsTestScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();

  const payload = JSON.parse(Array.isArray(data) ? data[0] : data);

  const {
    isMe,
    personOneFirst,
    personOneLast,
    personTwoFirst,
    personTwoLast,
    userSun,
    userMoon,
    userRising,
    partnerSun,
    partnerMoon,
    partnerRising,
  } = payload;

  // -------------------------
  // MOCK PROMPT (you will replace later with your real generation)
  // -------------------------
  const promptUsed = `
Compare these two individuals:

Person 1:
Name: ${isMe ? "User" : `${personOneFirst} ${personOneLast}`}
Sun: ${userSun}
Moon: ${userMoon}
Rising: ${userRising}

Person 2:
Name: ${personTwoFirst} ${personTwoLast}
Sun: ${partnerSun}
Moon: ${partnerMoon}
Rising: ${partnerRising}

Return:
- A Delaluna-style summary
- Closing compatibility percentages
  `;

  // -------------------------
  // MOCK SUMMARY
  // -------------------------
  const returnedSummary =
    "✨ Bestie… this connection is giving cosmic spark. There’s a magnetic pull mixed with emotional depth, and just enough contrast to keep things exciting. The vibes? Warm with a hint of chaos — in the fun way.";

  // -------------------------
  // MOCK PERCENTAGES
  // -------------------------
  const percentages = {
    Interest: 78,
    Communication: 62,
    Attraction: 73,
    Loyalty: 84,
    Resonation: 69,
  };

  // -------------------------
  // Expand/Collapse State
  // -------------------------
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showPercent, setShowPercent] = useState(false);

  const animateToggle = (toggleFunc: any, current: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleFunc(!current);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔮 Connection Results Test</Text>

      {/* -------------------- */}
      {/* PROMPT USED */}
      {/* -------------------- */}
      <TouchableOpacity
        style={styles.box}
        onPress={() => animateToggle(setShowPrompt, showPrompt)}
      >
        <Text style={styles.boxTitle}>📝 Prompt Used</Text>

        {showPrompt && (
          <Text style={styles.boxContent}>{promptUsed.trim()}</Text>
        )}
      </TouchableOpacity>

      {/* -------------------- */}
      {/* SENT INFO */}
      {/* -------------------- */}
      <TouchableOpacity
        style={styles.box}
        onPress={() => animateToggle(setShowSent, showSent)}
      >
        <Text style={styles.boxTitle}>📦 Sent Info</Text>

        {showSent && (
          <View style={{ marginTop: 10 }}>
            {/* PERSON 1 */}
            <View style={styles.personBlock}>
              <Text style={styles.personTitle}>
                {isMe ? "You (Person 1)" : "Person 1"}
              </Text>
              <Text style={styles.item}>
                Name: {personOneFirst} {personOneLast}
              </Text>
              <Text style={styles.item}>Sun: {userSun}</Text>
              <Text style={styles.item}>Moon: {userMoon}</Text>
              <Text style={styles.item}>Rising: {userRising}</Text>
            </View>

            {/* PERSON 2 */}
            <View style={styles.personBlock}>
              <Text style={styles.personTitle}>Person 2</Text>
              <Text style={styles.item}>
                Name: {personTwoFirst} {personTwoLast}
              </Text>
              <Text style={styles.item}>Sun: {partnerSun}</Text>
              <Text style={styles.item}>Moon: {partnerMoon}</Text>
              <Text style={styles.item}>Rising: {partnerRising}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* -------------------- */}
      {/* RETURNED SUMMARY */}
      {/* -------------------- */}
      <TouchableOpacity
        style={styles.box}
        onPress={() => animateToggle(setShowSummary, showSummary)}
      >
        <Text style={styles.boxTitle}>✨ Returned Summary</Text>

        {showSummary && (
          <Text style={styles.summaryText}>{returnedSummary}</Text>
        )}
      </TouchableOpacity>

      {/* -------------------- */}
      {/* PERCENTAGES */}
      {/* -------------------- */}
      <TouchableOpacity
        style={styles.box}
        onPress={() => animateToggle(setShowPercent, showPercent)}
      >
        <Text style={styles.boxTitle}>📊 Closing Percentages</Text>

        {showPercent && (
          <View style={{ marginTop: 12 }}>
            {Object.entries(percentages).map(([label, value]) => (
              <View key={label} style={styles.percentRow}>
                <Text style={styles.percentLabel}>{label}</Text>
                <Text style={styles.percentValue}>{value}%</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* -------------------- */}
      {/* BUTTONS */}
      {/* -------------------- */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#3A506B" }]}
        onPress={() =>
          router.replace("/(test-supporting)/test-connection-setup.screen")
        }
      >
        <Text style={styles.buttonText}>🔁 Back to Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.replace("/(main)/test-signs")
        }
      >
        <Text style={styles.buttonText}>🏠 Test Menu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    padding: 24,
    paddingBottom: 80,
  },
  title: {
    color: "#6FFFE9",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
  },
  box: {
    backgroundColor: "#1C2541",
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  boxTitle: {
    color: "#6FFFE9",
    fontSize: 18,
    fontWeight: "700",
  },
  boxContent: {
    color: "#C5AFFF",
    marginTop: 12,
    lineHeight: 20,
  },
  personBlock: {
    marginBottom: 14,
  },
  personTitle: {
    color: "#6FFFE9",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  item: {
    color: "#fff",
    marginBottom: 4,
  },
  summaryText: {
    color: "#C5AFFF",
    marginTop: 12,
    lineHeight: 22,
  },
  percentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  percentLabel: {
    color: "#fff",
    fontSize: 15,
  },
  percentValue: {
    color: "#6FFFE9",
    fontSize: 15,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#5BC0BE",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
