import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ToastAndroid,
  Animated,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale } from "@/src/utils/responsive";

interface SendInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
}

export default function SendInput({
  placeholder = "Message",
  onSend,
}: SendInputProps) {
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleSend = () => {
    if (!message.trim()) return;
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
      }, 10000);
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
    bottom: verticalScale(60),
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(25),
  },
  toastText: {
    color: "#fff",
    fontSize: scale(14),
  },
});
