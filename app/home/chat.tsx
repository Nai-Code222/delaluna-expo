import React, { useContext } from "react";
import { ImageBackground, StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
 import { ThemeContext } from '@/app/theme-context';

export default function ChatScreen() {
    const { theme } = useContext(ThemeContext);

  function renderBackground(children: React.ReactNode) {
    if (theme.backgroundType === "image" && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={styles.background}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      );
    }
    if (theme.backgroundType === "gradient" && theme.gradient) {
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{
            x: Math.cos((theme.gradient.angle ?? 0) * Math.PI / 180),
            y: Math.sin((theme.gradient.angle ?? 0) * Math.PI / 180),
          }}
          style={styles.background}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View style={[styles.background, { backgroundColor: theme.colors.background }]}>
        {children}
      </View>
    );
  }

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