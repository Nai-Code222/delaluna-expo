import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { scale, moderateScale } from "@/src/utils/responsive";

interface DelalunaToggleProps {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}

export default function DelalunaToggle({ label, value, onToggle }: DelalunaToggleProps) {
  return (
    <View style={styles.container}>
      <Switch
        trackColor={{ false: "rgba(255,255,255,0.1)", true: "#8E44AD" }}
        thumbColor={value ? "#fff" : "#d3d3d3"}
        ios_backgroundColor="rgba(255,255,255,0.1)"
        onValueChange={onToggle}
        value={value}
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    alignSelf: "flex-end",
  },
  label: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
});
