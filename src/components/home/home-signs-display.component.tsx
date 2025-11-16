import { verticalScale, scale, moderateScale } from "@/utils/responsive";
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
          source={require("@/assets/icons/sun_icon.png")}

          style={styles.icon}
        />
        <Text style={styles.text}>{sun}</Text>
      </View>

      {/* 🌙 Moon Sign */}
      <View style={styles.signItem}>
        <Image
          source={require("@/assets/icons/moon_icon.png")}
          style={styles.icon}
        />
        <Text style={styles.text}>{moon}</Text>
      </View>

      {/* ⬆️ Rising Sign */}
      <View style={styles.signItem}>
        <Image
          source={require("@/assets/icons/arrow_upward_icon.png")}
          style={styles.icon}
        />
        <Text style={styles.text}>{rising}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
    gap: scale(5),
    alignSelf: "stretch",
  },
  signItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  icon: {
    width: scale(22),
    height: scale(22),
    resizeMode: "contain",
  },
  text: {
    fontSize: moderateScale(14),
    color: "#FFFFFF",
    fontWeight: "300",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
