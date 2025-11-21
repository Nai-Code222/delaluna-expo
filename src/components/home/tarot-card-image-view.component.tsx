// src/components/home/tarot-card-image-view.tsx

import React from "react";
import { StyleSheet, View, Image } from "react-native";
import { TarotCardAssets } from "@/assets/cards";

interface TarotCardProps {
  cardNumber: number;     // REQUIRED card number (1–133)
  reversed?: boolean;     // OPTIONAL reversed card
}

export default function TarotCardImageFrame({ 
  cardNumber, 
  reversed = false 
}: TarotCardProps) {

  return (
    <View style={styles.frame}>
      <Image
        style={[
          styles.image,
          reversed && { transform: [{ rotate: "180deg" }] },
        ]}
        source={TarotCardAssets[cardNumber]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { 
    alignItems: "center", 
    justifyContent: "center" 
  },
  image: { 
    width: 240, 
    height: 380, 
    resizeMode: "contain" 
  },
});
