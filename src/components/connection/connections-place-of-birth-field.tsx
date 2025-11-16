import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import ConnectionLocationAutocomplete from "./connection-location-autocomplete.component";
import { scale, verticalScale, moderateScale } from "@/utils/responsive";
import { isIDK } from "@/utils/answers.helpers";

const DEFAULT_PLACE = {
  label: "Greenwich, London, United Kingdom",
  lat: 51.4779,
  lon: 0.0015,
  timezone: "Europe/London",
};

interface Props {
  value: string;
  onChange: (values: Record<string, any>) => void;
}

export default function ConnectionsPlaceOfBirthField({ value, onChange }: Props) {
  const [isUnknown, setIsUnknown] = useState(false);

  /** When user selects from results */
  const handleSelect = (place: any) => {
    setIsUnknown(false);
    onChange({
      "Place of Birth": place.label,
      isPlaceOfBirthUnknown: false,
      birthLat: place.lat,
      birthLon: place.lon,
      birthTimezone: place.timezone,
    });
  };

  /** When user types */
  const handleInputChange = (text: string) => {
    // user typed I don't know
    if (isIDK(text)) {
      setIsUnknown(true);

      // UI shows IDK, DB receives default fallback
      onChange({
        "Place of Birth": DEFAULT_PLACE.label,
        isPlaceOfBirthUnknown: true,
        birthLat: DEFAULT_PLACE.lat,
        birthLon: DEFAULT_PLACE.lon,
        birthTimezone: DEFAULT_PLACE.timezone,
      });
      return;
    }

    // normal entry
    setIsUnknown(false);
    onChange({
      "Place of Birth": text,
      isPlaceOfBirthUnknown: false,
    });
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
            defaultLocation={{
              label: "I don't know",
              lat: DEFAULT_PLACE.lat,
              lon: DEFAULT_PLACE.lon,
              timezone: DEFAULT_PLACE.timezone,
            }}
          />
        </View>
      </View>
    </View>
  );
}

/* 🎨 Styles preserved */
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(8),
    borderWidth: 1.5,
    borderColor: "rgba(142,68,173,0.6)",
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    marginBottom: verticalScale(16),
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
    paddingLeft: scale(5),
    justifyContent: "center",
  },
});
