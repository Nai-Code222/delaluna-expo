import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface HomeSignsDisplayProps {
  sun: string;
  moon: string;
  rising: string;
}

export default function HomeSignsDisplay({ sun, moon, rising }: HomeSignsDisplayProps) {
  return (
    <View style={styles.container}>
      {/* ☀️ Sun Sign */}
      <View style={styles.signItem}>
        <Image
          source={require("../../assets/icons/sun_icon.png")}
          style={styles.icon}
        />
        <Text style={styles.text}>{sun}</Text>
      </View>

      {/* 🌙 Moon Sign */}
      <View style={styles.signItem}>
        <Image
          source={require("../../assets/icons/moon_icon.png")}
          style={styles.icon}
        />
        <Text style={styles.text}>{moon}</Text>
      </View>

      {/* ⬆️ Rising Sign */}
      <View style={styles.signItem}>
        <Image
          source={require("../../assets/icons/arrow_upward_icon.png")}
          style={styles.icon}
        />
        <Text style={styles.text}>{rising}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 5,
    alignSelf: "stretch",
  },
  signItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  text: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
    textTransform: "uppercase",
  },
});
