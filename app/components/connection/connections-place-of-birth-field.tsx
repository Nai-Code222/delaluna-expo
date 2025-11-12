import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import ConnectionLocationAutocomplete from "./connection-location-autocomplete.component";
import DelalunaToggle from "../component-utils/delaluna-toggle.component";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";
import { isIDK, applyUnknownPlace } from "@/src/utils/answers.helpers";

interface ConnectionsPlaceOfBirthFieldProps {
  value: string;
  onChange: (values: Record<string, any>) => void;
}

export default function ConnectionsPlaceOfBirthField({
  value,
  onChange,
}: ConnectionsPlaceOfBirthFieldProps) {
  const [isUnknown, setIsUnknown] = useState(false);

  const handleSelect = (place: {
    label: string;
    lat: number;
    lon: number;
    timezone: string;
  }) => {
    onChange({
      "Place of Birth": place.label,
      birthLat: place.lat,
      birthLon: place.lon,
      birthTimezone: place.timezone,
      isPlaceOfBirthUnknown: false,
    });
  };

  const handleInputChange = (text: string) => {
    if (isIDK(text)) {
      const updated = applyUnknownPlace({});
      setIsUnknown(true);
      onChange(updated);
    } else {
      onChange({ "Place of Birth": text });
    }
  };

  const handleUnknownToggle = (val: boolean) => {
    setIsUnknown(val);
    if (val) {
      const updated = applyUnknownPlace({});
      onChange(updated);
    } else {
      // Reset when toggled off
      onChange({
        "Place of Birth": "",
        birthLat: undefined,
        birthLon: undefined,
        birthTimezone: undefined,
        isPlaceOfBirthUnknown: false,
      });
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>Place of Birth</Text>

        <View style={styles.rightContainer}>
          <ConnectionLocationAutocomplete
            value={isUnknown ? "I don't know" : value}
            onSelect={handleSelect}
            onInputChange={handleInputChange}
          />

          <View style={styles.toggleInline}>
            <DelalunaToggle
              label="I don’t know"
              value={isUnknown}
              onToggle={handleUnknownToggle}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(8),
    borderWidth: 1.5,
    borderColor: "rgba(142,68,173,0.6)",
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    marginBottom: verticalScale(16),  // uniform stack spacing
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
    flex: 0.9,
  },
  rightContainer: {
    flex: 1.3,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
    paddingLeft: scale(12),       // unified spacing
    paddingBottom: verticalScale(2),
    paddingVertical: verticalScale(4),
    justifyContent: "center",
  },
  toggleInline: {
    marginTop: verticalScale(8),  // consistent toggle gap
    paddingLeft: scale(4),        // aligns toggle text with field text
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  }
});
