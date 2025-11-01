import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";

interface DelalunaSegmentedControlProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (option: string) => void;
}

export default function DelalunaSegmentedControl({
  label,
  options,
  value,
  onChange,
}: DelalunaSegmentedControlProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.segmentContainer}>
        {options.map((opt, i) => {
          const selected = value === opt;
          const showDivider = i !== options.length - 1;

          return (
            <React.Fragment key={opt}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onChange(opt)}
                style={[styles.option, selected && styles.selectedOption]}
              >
                <Text style={[styles.optionText, selected && styles.selectedText]}>
                  {opt}
                </Text>
              </TouchableOpacity>

              {showDivider && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: verticalScale(8),
  },
  label: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  segmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(40),
    borderWidth: 1.5,
    borderColor: "rgba(142, 68, 173, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  option: {
    flex: 1,
    paddingVertical: verticalScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  selectedOption: {
    backgroundColor: "#8E44AD",
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});
