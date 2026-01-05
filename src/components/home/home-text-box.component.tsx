import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import MessageInABottleComponent from "../component-utils/message-in-a-bottle.component";
import DelalunaContainer from "../component-utils/delaluna-container.component";
import TarotCardImageFrame from "./tarot-card-image-view.component";
import { BulletList } from "../typography/bullet-list-text";
import { DrawnTarotCard } from "@/types/tarot-cards.type";

interface HomeTextBoxProps {
  title: string;
  content?: string | string[];
  style?: ViewStyle;
  cards?: DrawnTarotCard[]; 
  reversed?: boolean;   // 🌙 prepare for reversed cards
}

export default function HomeTextBox({
  title,
  content = "",
  style,
  cards,
}: HomeTextBoxProps) {

  const isBottleSection = title.toLowerCase().includes("in a bottle");
  const isTarotSection = title.toLowerCase().includes("today") && title.toLowerCase().includes("card");
  const isListStyleSection = Array.isArray(content);
  const isNewLoveSection = title.toLowerCase().includes("new love") || title.toLowerCase().includes("lucky numbers");

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
      <Text style={styles.title}>{title}</Text>

      {isTarotSection ? (
        <>
          {/* TAROT IMAGE */}
          {cards && cards.length > 0 ? (
            <TarotCardImageFrame
              cardNumber={cards.map(c => c.id)}
              reversed={cards.map(c=> c.reversed)}
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
      ) : isNewLoveSection ? (
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5BC0BE",
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
