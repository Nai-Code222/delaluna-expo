import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { scale, verticalScale, moderateScale } from "@/utils/responsive";
import DelalunaToggle from "../component-utils/delaluna-toggle.component";

const DEFAULT_TIME = "12:00 PM"; // 12-hour default

interface ConnectionsTimeOfBirthFieldProps {
  value?: string;
  onChange: (values: Record<string, any>) => void;
}

export default function ConnectionsTimeOfBirthField({
  value,
  onChange,
}: ConnectionsTimeOfBirthFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isUnknown, setIsUnknown] = useState(
    value?.toLowerCase()?.includes("i don't") ?? false
  );

  /** Convert date → 12hr time */
  const formatTime12hr = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours || 12; // 0 → 12

    return `${hours}:${minutes} ${ampm}`;
  };

  /** When user picks time */
  const handleConfirm = (date: Date) => {
    const formatted = formatTime12hr(date);

    onChange({
      "Time of Birth": formatted,
      isBirthTimeUnknown: false,
    });

    setShowPicker(false);
    setIsUnknown(false);
  };

  /** Toggle: I don’t know */
  const handleUnknownToggle = (val: boolean) => {
    setIsUnknown(val);

    if (val) {
      // Show "I don't know" to user, but store Greenwich fallback
      onChange({
        "Time of Birth": "I don't know",
        isBirthTimeUnknown: true,
        defaultBirthTime: DEFAULT_TIME,
      });
    } else {
      // Reset UI
      onChange({
        "Time of Birth": "",
        isBirthTimeUnknown: false,
      });
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* MAIN ROW */}
      <View
        style={[
          styles.row,
          isUnknown && { opacity: 0.4 },
        ]}
        pointerEvents={isUnknown ? "none" : "auto"}
      >
        <Text style={styles.label}>Time of Birth</Text>

        <View style={styles.rightContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.inputBox}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.text}>
              {isUnknown ? "I don't know" : value || "Select time"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* I DON'T KNOW TOGGLE BELOW FIELD */}
      <View style={styles.toggleRow}>
        <DelalunaToggle
          label="I don’t know"
          value={isUnknown}
          onToggle={handleUnknownToggle}
        />
      </View>

      {/* TIME PICKER */}
      <DateTimePickerModal
        isVisible={showPicker}
        mode="time"
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onConfirm={handleConfirm}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: verticalScale(10),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(5),
    borderWidth: 1.5,
    borderColor: "rgba(142,68,173,0.6)",
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
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
  inputBox: {
    paddingVertical: verticalScale(5),
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
  },
  toggleRow: {
    alignSelf: "flex-end",
    marginTop: verticalScale(10),
    marginRight: scale(5),
  },
});
