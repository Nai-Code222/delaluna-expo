import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import SendInput from "../component-utils/send-input.component";
import DelalunaContainer from "../component-utils/delaluna-container.component";


interface HomeTextBoxProps {
  title: string;
  text?: string;
  style?: ViewStyle;
}


export default function HomeTextBox({ title, text = "", style }: HomeTextBoxProps) {
  const isBottleSection = title.toLowerCase().includes("in a bottle");

  return ( 
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {isBottleSection ? (
        <SendInput placeholder="Message to the universe" />
      ) : (
        <DelalunaContainer style={styles.box}>
          <Text style={styles.text}>{text}</Text>
        </DelalunaContainer>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    display: "flex",
    width: "100%",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16, // spacing between boxes
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    alignSelf: "center",
    marginBottom: 6,
  },
  box: {
    width: "100%",
    minHeight: 75,
    borderWidth: 1,
    borderColor: "rgba(142, 68, 173, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    lineHeight: 25,
    color: "#FFFFFF",
  },
});
