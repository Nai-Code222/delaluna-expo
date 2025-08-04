import React, { useContext } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { ThemeContext } from "../themecontext";
import { LinearGradient } from "expo-linear-gradient";

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
    <></>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});