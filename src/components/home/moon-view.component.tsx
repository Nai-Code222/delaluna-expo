// src/components/home/moon-view.component

import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import DelalunaContainer from "../component-utils/delaluna-container.component";

interface MoonProps {
    moon?: string;
    moonPhaseDetails?: string;
}

export default function MoonView({
    moon,
    moonPhaseDetails
} : MoonProps) {
    // moon 
    // "With the Moon in Taurus, your senses are heightened, Virgo rising. Indulge in simple pleasures, like good food, soft textures, and beautiful surroundings. This is a fertile time for creativity, especially anything that involves the earth element. But watch out for stubbornness, and remember that compromise is key, even when you're convinced you're right. This Taurus Moon will ask you to tap into your sensuality and connect with your body. Release any feelings of restriction or limitation that are holding you back from fully embracing the present moment."

    // moonPhaseDetails
    // "Taurus Moon, Waxing Gibbous, 15°"
    if(moonPhaseDetails){
        const moonPhaseDetailsList: string[] = moonPhaseDetails?.split(',');
        console.log("Moon phase details: ", moonPhaseDetailsList);
    }
    

    return(
        <View style={styles.box}>
            <Image>

            </Image>
             <Text style={styles.textPhase}>{moonPhaseDetails}</Text>
            <DelalunaContainer>
                <Text style={styles.text}>{moon}</Text>
            </DelalunaContainer>
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
    marginBottom: 25,
  },
  box: {
    width: "100%",
    minHeight: 75,
    borderWidth: 1,
    borderColor: "rgba(142, 68, 173, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 5,
  },
  frame: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 25,
    color: "#FFFFFF",
  },
  textPhase: {
    fontSize: 14,
    lineHeight: 25,
    color: "#FFFFFF",
    textAlign: "center",
  }
});