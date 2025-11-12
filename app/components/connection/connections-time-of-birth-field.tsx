import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DelalunaToggle from "../component-utils/delaluna-toggle.component";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";
import { applyUnknownTime } from "@/src/utils/answers.helpers";

interface ConnectionsTimeOfBirthFieldProps {
  value?: string;
  onChange: (values: Record<string, any>) => void;
}

export default function ConnectionsTimeOfBirthField({
  value,
  onChange,
}: ConnectionsTimeOfBirthFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isUnknown, setIsUnknown] = useState(false);

  const handleConfirm = (date: Date) => {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    const formatted = `${h}:${m}`;
    onChange({
      "Time of Birth": formatted,
      isBirthTimeUnknown: false,
    });
    setShowPicker(false);
  };

  const handleUnknownToggle = (val: boolean) => {
    setIsUnknown(val);
    if (val) {
      const updated = applyUnknownTime({});
      onChange(updated);
    } else {
      onChange({
        "Time of Birth": "",
        isBirthTimeUnknown: false,
      });
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>Time of Birth</Text>

        <View style={styles.rightContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.inputBox}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.text, !value && { opacity: 0.6 }]}>
              {isUnknown ? "I don't know" : value || "Select time"}
            </Text>
          </TouchableOpacity>

          <View style={styles.toggleInline}>
            <DelalunaToggle
              label="I don’t know"
              value={isUnknown}
              onToggle={handleUnknownToggle}
            />
          </View>
        </View>
      </View>

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
  },
  inputBox: {
  paddingVertical: verticalScale(4),
  justifyContent: "center",
},
  text: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
  },
  toggleInline: {
    marginTop: verticalScale(8),  // consistent toggle gap
    paddingLeft: scale(4),        // aligns toggle text with field text
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  }
});
