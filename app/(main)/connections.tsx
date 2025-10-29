import React, { useContext } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../theme-context";
import AddConnectionButton from "../components/buttons/add-connection-button.component";

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
      <View
        style={[styles.background, { backgroundColor: theme.colors.background }]}
      >
        {children}
      </View>
    );
  }

  return renderBackground(
    <View style={styles.centered}>
      <AddConnectionButton
        onPress={() => console.log("Add Connection pressed!")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "column", // 👈 stack icon above text
    alignItems: "center",
    justifyContent: "center",
    width: "95%",
    height: "15%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(142, 68, 173, 0.60)",
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: "center",
    bottom: 20,
    paddingVertical: 10,
  },
  icon: {
    width: 40,
    height: 40,
    tintColor: "#fff", // optional for Delaluna glow effect
    resizeMode: "contain",
    marginBottom: 8, // space between icon and text
  },
  addText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
