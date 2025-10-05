import React, { useContext } from "react";
import { ImageBackground, StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme-context } from "../theme-context";

export default function ConnectionsScreen() {
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
    <View style={styles.centered}>
      <Text style={styles.placeholderText}>No connections yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  placeholderText: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});