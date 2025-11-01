
import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import DelalunaContainer from "../component-utils/delaluna-container.component";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TransitCardProps {
  title: string;
  summary: string;
  details: string;
}

export default function TransitCard({ title, summary, details }: TransitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);

    Animated.timing(fadeAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={toggleExpand}>
      <DelalunaContainer
        variant={expanded ? "highlight" : "default"}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>

        {expanded && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.details}>{details}</Text>
          </Animated.View>
        )}
      </DelalunaContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  header: { alignItems: "center" },
  title: { color: "#FFF", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  summary: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center" },
  details: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 20,
  },
});
