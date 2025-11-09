import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";
import splitConnectionId from "@/app/utils/splitConnectionId.util";
import { Ionicons } from "@expo/vector-icons";


interface ConnectionListItemProps {
  connection: any;
  onPress?: () => void;
}

export default function ConnectionListItem({ connection, onPress }: ConnectionListItemProps) {
  const { first, second } = splitConnectionId(connection.id);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>
          {first}  <Ionicons
                    name="heart"
                    size={scale(12)}
                    color= "#FFFFFF"
                  />  {second}
        </Text>
        <Text style={styles.statusText}>{connection.relationshipType}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(10),
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: verticalScale(2) },
  },
  textContainer: {
    alignItems: "center",
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusText: {
    color: "#C5AFFF",
    fontSize: moderateScale(13),
    fontWeight: "500",
    marginTop: verticalScale(3),
  },
});
