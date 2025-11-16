import React, { useState, useRef, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../theme-context";
import useRenderBackground from "@/src/hooks/useRenderBackground";import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";

type Message = {
  id: string;
  role: "user" | "delaluna";
  text: string;
};

export default function ChatScreen() {
  const { theme } = useContext(ThemeContext);
  const renderBackground = useRenderBackground();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll when new message appears
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const newUserMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    Keyboard.dismiss();

    // Simulate AI typing + response
    setIsTyping(true);
    setTimeout(() => {
      const aiText = `✨ ${text
        .charAt(0)
        .toUpperCase()}${text.slice(1)} — Venus says it’s giving divine timing, babe.`;
      const aiMsg: Message = { id: `${Date.now()}-ai`, role: "delaluna", text: aiText };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1800);
  };

  const suggested = [
    "What is he feeling toward me?",
    "Will we talk again?",
    "Is he my soulmate?",
    "Should I move on?",
  ];

  return renderBackground(
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No messages yet.
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.text,
                msg.role === "user" ? styles.userText : styles.aiText,
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <Text style={[styles.text, styles.aiText, { opacity: 0.7 }]}>
              Delaluna is typing…
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Prompts */}
      {messages.length === 0 && (
        <View style={styles.suggestionContainer}>
          {suggested.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.suggestionChip}
              onPress={() => {
                setInput(q);
                sendMessage();
              }}
            >
              <Text style={styles.suggestionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor="#ccc"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Image
            source={require("../assets/icons/arrow-right-icon.png")}
            style={styles.sendIcon}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(80),
  },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: verticalScale(100) },
  emptyText: { fontSize: moderateScale(15), opacity: 0.6 },
  bubble: {
    borderRadius: scale(20),
    padding: scale(12),
    marginVertical: verticalScale(4),
    maxWidth: "75%",
  },
  userBubble: {
    backgroundColor: "#5BC0BE",
    alignSelf: "flex-end",
  },
  aiBubble: {
    backgroundColor: "#3A506B",
    alignSelf: "flex-start",
  },
  text: { fontSize: moderateScale(15), lineHeight: 20 },
  userText: { color: "#000" },
  aiText: { color: "#fff" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C2541",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
  },
  input: {
    flex: 1,
    backgroundColor: "#3A506B",
    borderRadius: scale(24),
    color: "#fff",
    paddingHorizontal: scale(16),
    height: verticalScale(46),
  },
  sendButton: {
    paddingHorizontal: scale(12),
    justifyContent: "center",
  },
  sendIcon: { width: scale(18), height: scale(18), tintColor: "#fff" },
  suggestionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: verticalScale(8),
  },
  suggestionChip: {
    backgroundColor: "#3A506B",
    borderRadius: scale(20),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(14),
    margin: scale(4),
  },
  suggestionText: { color: "#fff", fontSize: moderateScale(13) },
});
