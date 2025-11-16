import React from "react";
import { TouchableOpacity, Text, StyleSheet, Image, GestureResponderEvent } from "react-native";

interface AddConnectionButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  label?: string;
}

export default function AddConnectionButton({
  onPress,
  label = "Add Connection",
}: AddConnectionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
      accessibilityLabel={label}
      activeOpacity={0.8}
    >
      <Image
        source={require("@/assets/icons/add_circle_icon.png")}
        style={styles.icon}
      />
      <Text style={styles.addText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: "column",
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
    tintColor: "#fff",
    resizeMode: "contain",
    marginBottom: 8,
  },
  addText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
