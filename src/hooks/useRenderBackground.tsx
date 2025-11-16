import React, { useContext } from "react";
import { View, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../../app/theme-context";

/**
 * Returns a function that wraps children in the correct themed background.
 * Usage: renderBackground(<YourScreenContent />)
 */
export default function useRenderBackground() {
  const { theme } = useContext(ThemeContext);

  function renderBackground(children: React.ReactNode) {
    switch (theme.backgroundType) {
      case "image":
        return (
          <ImageBackground
            source={theme.backgroundImage}
            style={styles.background}
            resizeMode="cover"
          >
            {children}
          </ImageBackground>
        );

      case "gradient":
        if (!theme.gradient) break;
        const { colors, angle } = theme.gradient;
        return (
          <LinearGradient
            colors={colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{
              x: Math.cos((angle ?? 0) * Math.PI / 180),
              y: Math.sin((angle ?? 0) * Math.PI / 180),
            }}
            style={styles.background}
          >
            {children}
          </LinearGradient>
        );

      default:
        return (
          <View
            style={[
              styles.background,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {children}
          </View>
        );
    }
  }

  return renderBackground;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
