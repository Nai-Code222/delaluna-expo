// src/components/home/tarot-card-image-view.tsx

import React from "react";
import { StyleSheet, View, Image } from "react-native";


interface TarotCardProps {
  cardNumber: number[];     // REQUIRED card number (53–133)
  reversed?: boolean;     // OPTIONAL reversed card
}

export default function TarotCardImageFrame({ 
  cardNumber, 
  reversed = false 
}: TarotCardProps) {

  const getTarotCardImageUrl = (cardNumber: number) =>
    `https://firebasestorage.googleapis.com/v0/b/delaluna-answers.firebasestorage.app/o/tarot-card-front%2F${cardNumber}.png?alt=media`;

  return (
    <View style={styles.frame}>
      {cardNumber.map((num, idx) => (
        <Image
          key={`${num}-${idx}`}
          style={[
            styles.image,
            reversed && { transform: [{ rotate: "180deg" }] },
          ]}
          source={{ uri: getTarotCardImageUrl(num) }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  image: {
    width: 120,
    height: 190,
    resizeMode: "contain",
  },
});
