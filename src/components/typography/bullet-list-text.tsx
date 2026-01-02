import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BulletListProps {
  items: string[];
  bullet?: string;
}

export function BulletList({ items, bullet = "•" }: BulletListProps) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.bullet}>{bullet}</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
  width: "100%",
  paddingVertical: 12,
},
  row: {
  width: "100%",
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: 10,
},
  bullet: {
  width: 18,
  marginRight: 8,
  fontSize: 16,
  lineHeight: 22,
  color: "#FFFFFF",
},
text: {
  flex: 1,
  flexWrap: "wrap",
  fontSize: 14,
  lineHeight: 22,
  color: "#FFFFFF",
},
});