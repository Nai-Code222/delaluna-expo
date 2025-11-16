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

interface ConnectionsTimeOfBirthFieldProps {
  value?: string;
  onChange: (values: Record<string, any>) => void;
}

export default function ConnectionsTimeOfBirthField({
  value,
  onChange,
}: ConnectionsTimeOfBirthFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  /** When user picks a real time */
  const handleConfirm = (date: Date) => {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");

    onChange({
      "Time of Birth": `${h}:${m}`,
      isBirthTimeUnknown: false,
    });

    setShowPicker(false);
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
            <Text style={styles.text}>
              {value ? value : "Select time"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Picker */}
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
  },
  inputBox: {
    paddingVertical: verticalScale(5),
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
  },
});
