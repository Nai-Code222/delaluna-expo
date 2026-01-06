import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import MessageInABottleComponent from "../component-utils/message-in-a-bottle.component";
import DelalunaContainer from "../component-utils/delaluna-container.component";
import TarotCardImageFrame from "./tarot-card-image-view.component";
import { BulletList } from "../typography/bullet-list-text";
import { DrawnTarotCard } from "@/types/tarot-cards.type";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "@/utils/responsive";

// Define section types
export type SectionName =
  | "quote"
  | "advice"
  | "dos"
  | "donts"
  | "affirmation"
  | "tarot"
  | "message"
  | "moon"
  | "moonPhaseDetails"
  | "retrograde"
  | "newLove"
  | "returns"
  | "luckyNumbers";

// Icon mapping for each section
const SECTION_ICONS: Record<SectionName, { name: keyof typeof Ionicons.glyphMap; color?: string }> = {
  quote: { name: "chatbubble-outline", color: "#5BC0BE" },
  advice: { name: "bulb-outline", color: "#F4A261" },
  dos: { name: "checkmark-circle-outline", color: "#2A9D8F" },
  donts: { name: "close-circle-outline", color: "#E76F51" },
  affirmation: { name: "sparkles-outline", color: "#E63946" },
  tarot: { name: "sparkles-outline", color: "#9D4EDD" },
  message: { name: "send-outline", color: "#06FFA5" },
  moon : { name: "moon-outline", color: "#F1FAEE" },
  moonPhaseDetails : { name: "moon-outline", color: "#F1FAEE" },
  retrograde: { name: "planet-outline", color: "#8E44AD" },
  newLove: { name: "heart-outline", color: "#FF69B4" },
  returns: { name: "repeat-outline", color: "#FCA311" },
  luckyNumbers: { name: "dice-outline", color: "#FFD60A" },
};

interface HomeTextBoxProps {
  sectionName: SectionName;
  title: string;
  content?: string | string[];
  style?: ViewStyle;
  cards?: DrawnTarotCard[];
  reversed?: boolean;
}

export default function HomeTextBox({
  sectionName,
  title,
  content = "",
  style,
  cards,
}: HomeTextBoxProps) {

  const isBottleSection = sectionName === "message";
  const isTarotSection = sectionName === "tarot";
  const isMoonPhase = sectionName === "moonPhaseDetails";
  const isListStyleSection = Array.isArray(content);
  const isHoriListSection = sectionName === "newLove" || sectionName === "luckyNumbers" || sectionName === "returns";
  const iconSize = scale(20);

  // Get icon config for this section
  const iconConfig = SECTION_ICONS[sectionName];

  const renderTextContent = () => {
    if (!content || Array.isArray(content)) return null;
    return <Text style={styles.text}>{content}</Text>;
  };

  const renderListContent = () => {
    if (!Array.isArray(content) || content.length === 0) return null;
    return <BulletList items={content} />;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Ionicons
          name={iconConfig.name}
          size={iconSize}
          color={"#ffffffff"}
        />
        <Text style={styles.title}>{title}</Text>
      </View>

      {isTarotSection ? (
        <>
          {/* TAROT IMAGE */}
          {cards && cards.length > 0 ? (
            <TarotCardImageFrame
              cardNumber={cards.map(c => c.id)}
              reversed={cards.map(c => c.reversed)}
            />
          ) : (
            <Text style={{ color: "#fff" }}>Loading card...</Text>
          )}

          {/* TAROT MEANING BOX */}
          <DelalunaContainer style={styles.box}>
            {isListStyleSection ? renderListContent() : renderTextContent()}
          </DelalunaContainer>
        </>
      ) : isBottleSection ? (
        <MessageInABottleComponent placeholder="Message to the universe" />
      ) : isHoriListSection ? (
        <View style={styles.newLoveRow}>
          {Array.isArray(content) ? content.map((item, index) => (
            <React.Fragment key={index}>
              <Text style={styles.newLoveText}>{item}</Text>
              {index < content.length - 1 && <Text style={styles.separator}>•</Text>}
            </React.Fragment>
          )) : <Text style={styles.newLoveText}>{content}</Text>}
        </View>
      ) : isListStyleSection ? (
        <DelalunaContainer>
          {renderListContent()}
        </DelalunaContainer>
      ) : (
        <DelalunaContainer>
          {renderTextContent()}
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
    marginBottom: 25,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5BC0BE",
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
  text: {
    fontSize: 14,
    lineHeight: 25,
    color: "#FFFFFF",
  },
  newLoveRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    padding: 15,
  },
  newLoveText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#FFFFFF",
    alignItems: "center",
  },
  separator: {
    fontSize: 16,
    color: "#FFFFFF",
    marginHorizontal: 6,
    alignSelf: "center",
  },
});