import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import MessageInABottleComponent from "../component-utils/message-in-a-bottle.component";
import DelalunaContainer from "../component-utils/delaluna-container.component";
import TarotCardImageFrame from "./tarot-card-image-view.component";

interface HomeTextBoxProps {
  title: string;
  text?: string;
  style?: ViewStyle;
  cardNumber?: number; 
  reversed?: boolean;   // 🌙 prepare for reversed cards
}

export default function HomeTextBox({ 
  title, 
  text = "", 
  style, 
  cardNumber, 
  reversed = false 
}: HomeTextBoxProps) {

  const isBottleSection = title.toLowerCase().includes("in a bottle");
  const isTarotSection = title.toLowerCase().includes("todays cards");

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>

      {isTarotSection ? (
        <>
          {/* TAROT IMAGE */}
          {cardNumber ? (
            <TarotCardImageFrame 
              cardNumber={cardNumber} 
              reversed={reversed}
            />
          ) : (
            <Text style={{ color: "#fff" }}>Loading card...</Text>
          )}

          {/* TAROT MEANING BOX */}
          <DelalunaContainer style={styles.box}>
            <Text style={styles.text}>{text}</Text>
          </DelalunaContainer>
        </>
      ) : isBottleSection ? (
        <MessageInABottleComponent placeholder="Message to the universe" />
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
    marginBottom: 16,
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
