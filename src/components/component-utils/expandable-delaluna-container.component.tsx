import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "@/utils/responsive";
import DelalunaContainer from "./delaluna-container.component";

interface ExpandableDelalunaContainerProps {
  title: string;
  subtitle?: string;
  expandedContent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "highlight" | "subtle";
  initiallyExpanded?: boolean;
}

export default function ExpandableDelalunaContainer({
  title,
  subtitle,
  expandedContent,
  style,
  variant = "default",
  initiallyExpanded = false,
}: ExpandableDelalunaContainerProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [contentHeight, setContentHeight] = useState(0);

  // Separate animations (no parallel native/JS mix)
  const fadeAnim = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;

  const toggleExpand = () => setExpanded((prev) => !prev);

  useEffect(() => {
    // Fade + rotate → native driver
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: expanded ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: expanded ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    // Height → JS driver only
    Animated.timing(heightAnim, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const containerHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const onContentLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) setContentHeight(height);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
      <DelalunaContainer
        variant={expanded ? "highlight" : variant}
        style={[styles.container, style]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Animated.View style={[styles.iconContainer, { transform: [{ rotate }] }]}>
            <Ionicons name="chevron-down" size={scale(18)} color="#FFFFFF" />
          </Animated.View>
        </View>

        {/* Expandable Content */}
        <Animated.View
          style={{
            height: containerHeight,
            overflow: "hidden",
            opacity: fadeAnim,
            marginTop: verticalScale(8),
          }}
        >
          <View onLayout={onContentLayout}>{expandedContent}</View>
        </Animated.View>
      </DelalunaContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(16),
    alignSelf: "stretch",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  title: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(2),
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(13),
    textAlign: "center",
  },
  iconContainer: {
    position: "absolute",
    right: scale(10),
    top: "40%",
  },
});
