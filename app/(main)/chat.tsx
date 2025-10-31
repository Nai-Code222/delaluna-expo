import React, { useContext } from "react";
import { ImageBackground, StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../theme-context";
import useRenderBackground from "../hooks/useRenderBackground";

export default function ChatScreen() {
    const { theme } = useContext(ThemeContext);
    const renderBackground = useRenderBackground();


  return renderBackground(
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: theme.colors.text, fontSize: 16, opacity: 0.6 }}>
        No messages yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});