import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Animated,
  Platform,
  UIManager,
  type DimensionValue,
} from "react-native";
import { scale, verticalScale, moderateScale } from "@/utils/responsive";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CompatibilityProgressBarProps {
  keywordLabel: string;
  keywordDefinition?: string;
  scoreValue: number;
  /** Delay for cascade animation (ms) */
  delay?: number;
  /** Only animate if true — e.g. first generated report */
  shouldAnimateOnFirstLoad?: boolean;
}

export default function CompatibilityProgressBarComponent({
  keywordLabel,
  keywordDefinition,
  scoreValue,
  delay = 0,
  shouldAnimateOnFirstLoad = false,
}: CompatibilityProgressBarProps) {
  const [showDefinition, setShowDefinition] = useState(false);
  const animatedWidth = useRef(new Animated.Value(shouldAnimateOnFirstLoad ? 0 : scoreValue)).current;

  const getColor = (value: number) => {
    if (value <= 25) return "#FF3333"; // Red
    if (value <= 50) return "#FF7F00"; // Orange
    if (value <= 75) return "#FFD700"; // Yellow
    return "#00FF66"; // Green
  };

  const progressColor = getColor(scoreValue);

  useEffect(() => {
    if (shouldAnimateOnFirstLoad) {
      Animated.timing(animatedWidth, {
        toValue: Math.min(scoreValue, 100),
        duration: 800,
        delay,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(scoreValue);
    }
  }, [scoreValue, shouldAnimateOnFirstLoad]);

  const toggleDefinition = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowDefinition((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <TouchableOpacity onPress={toggleDefinition} activeOpacity={0.8}>
          <Text style={styles.label}>{keywordLabel}</Text>
        </TouchableOpacity>
        <Text style={styles.percentText}>{`${Math.round(scoreValue)}%`}</Text>
      </View>

      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }) as DimensionValue,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>

      {showDefinition && keywordDefinition ? (
        <View style={styles.definitionBox}>
          <Text style={styles.definition}>{keywordDefinition}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(16),
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(14),
    textDecorationLine: "underline",
  },
  percentText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: moderateScale(13),
  },
  barBackground: {
    width: "100%",
    height: verticalScale(8),
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: moderateScale(10),
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: moderateScale(10),
  },
  definitionBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: moderateScale(10),
    marginTop: verticalScale(6),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
  },
  definition: {
    color: "#C5AFFF",
    fontSize: moderateScale(12),
    lineHeight: moderateScale(15),
  },
});
