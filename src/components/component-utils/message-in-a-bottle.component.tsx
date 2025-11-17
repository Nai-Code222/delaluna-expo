import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ToastAndroid,
  Animated,
  Text,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale } from "@/utils/responsive";

interface MessageInABottleComponentProps {
  placeholder?: string;
  onSend?: (message: string) => void;
}

// -----------------------
// 🔒 Harm Filter Utility
// -----------------------
function checkForHarm(text: string) {
  const value = text.toLowerCase();

  const selfHarm = [
    "kill myself",
    "end my life",
    "don't want to live",
    "suicide",
    "hurt myself",
    "self harm",
    "cut myself",
  ];

  const violence = [
    "kill him",
    "kill her",
    "kill them",
    "hurt him",
    "hurt her",
    "shoot",
    "stab",
  ];

  const crime = [
    "rob",
    "robbery",
    "arson",
    "burn his house",
    "burn her house",
    "break in",
    "breaking in",
    "damage his car",
    "damage her car"
  ];

  if (selfHarm.some((p) => value.includes(p))) return "self-harm";
  if (violence.some((p) => value.includes(p))) return "violence";
  if (crime.some((p) => value.includes(p))) return "crime";

  return null;
}

export default function MessageInABottleComponent({
  placeholder = "Message",
  onSend,
}: MessageInABottleComponentProps) {
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleSend = () => {
    if (!message.trim()) return;

    // -----------------------
    // Run Safety Check
    // -----------------------
    const harmType = checkForHarm(message);

    if (harmType) {
      let alertMsg = "";

      if (harmType === "self-harm") {
        alertMsg =
          "Some of your message sounds like you may be thinking about harming yourself.\n\n" +
          "Delaluna encourages you to reach out to the Suicide & Crisis Lifeline at 988 or 1-800-273-8255.\n\n" +
          "You are not alone. You are loved.";
      } else if (harmType === "violence") {
        alertMsg =
          "Your message includes statements about harming someone. Delaluna cannot help with violent or dangerous situations.\n\nIf you or someone you know is in danger, call 911 or local emergency services.";
      } else {
        alertMsg =
          "Your message mentions illegal activity. Delaluna does not support any crime or illegal activity.";
      }

      Alert.alert("Safety Check", alertMsg, [{ text: "OK" }]);
      setMessage("");
      return; // DO NOT SEND — NO TOAST
    }

    // -----------------------
    // SAFE → SEND + TOAST
    // -----------------------
    const msg = message.trim();
    setMessage("");
    onSend?.(msg);

    if (Platform.OS === "android") {
      ToastAndroid.show(`📩 Sent: ${msg}`, ToastAndroid.LONG);
    } else {
      setToastMessage(`📩 Sent: ${msg}`);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setToastMessage(null));
      }, 5000);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#1F2024"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.trim()}
          style={[styles.sendButton, !message.trim() && { opacity: 0.5 }]}
        >
          <Ionicons name="send" size={scale(18)} color="#FFF" />
        </TouchableOpacity>
      </View>

      {Platform.OS === "ios" && toastMessage && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: verticalScale(40),
    backgroundColor: "#F8F9FE",
    borderRadius: scale(71),
    paddingLeft: scale(16),
    paddingRight: scale(6),
    gap: scale(6),
  },
  input: {
    flex: 1,
    color: "#1F2024",
    fontSize: scale(14),
    paddingVertical: verticalScale(8),
  },
  sendButton: {
    width: verticalScale(32),
    height: verticalScale(32),
    borderRadius: scale(38),
    backgroundColor: "#513877",
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: verticalScale(30), // 👈 moves toast to bottom of screen
    alignItems: "center",
    zIndex: 9999,

    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    marginHorizontal: scale(20),
    borderRadius: scale(20),
  },

  toastText: {
    color: "#fff",
    fontSize: scale(14),
  },
});
