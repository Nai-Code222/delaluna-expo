import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ConnectionLocationAutocomplete from "./connection-location-autocomplete.component";
import { scale, verticalScale, moderateScale } from "@/utils/responsive";

interface Props {
  value: string;
  onChange: (values: Record<string, any>) => void;
}

export default function ConnectionsPlaceOfBirthField({ value, onChange }: Props) {
  /** When user selects from autocomplete */
  const handleSelect = (place: any) => {
    onChange({
      "Place of Birth": place.label,
      birthLat: place.lat,
      birthLon: place.lon,
      birthTimezone: place.timezone,
    });
  };

  /** When user types */
  const handleInputChange = (text: string) => {
    onChange({
      "Place of Birth": text,
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>Place of Birth</Text>

        <View style={styles.rightContainer}>
          <ConnectionLocationAutocomplete
            value={value}
            onSelect={handleSelect}
            onInputChange={handleInputChange}
            onResultsVisibilityChange={() => {}}
            onSubmitRequest={() => {}}
          />
        </View>
      </View>
    </View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(5),
    borderWidth: 1.5,
    borderColor: "rgba(142,68,173,0.6)",
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    marginBottom: verticalScale(5),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
    flex: 0.9,
  },
  rightContainer: {
    flex: 1.3,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
    paddingLeft: scale(10),
    justifyContent: "center",
  },
});
