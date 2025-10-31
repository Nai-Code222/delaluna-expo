import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";

export default function DateSwitcher() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: set midnight timer
  const setMidnightTimer = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    timerRef.current = setTimeout(() => {
      setSelectedDate(new Date());
      setMidnightTimer(); // schedule next refresh
    }, timeUntilMidnight);
  };

  useEffect(() => {
    setMidnightTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Fade transition
  const fadeTransition = (newDate: Date) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start(() => setSelectedDate(newDate));
  };

  // Navigation
  const goPrevious = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    fadeTransition(newDate);
  };
  const goNext = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    fadeTransition(newDate);
  };

  // Restrict to Yesterday / Today / Tomorrow
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const disableLeft = selectedDate <= yesterday;
  const disableRight = selectedDate >= tomorrow;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={goPrevious}
        disabled={disableLeft}
        style={styles.iconButton}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={scale(20)}
          color={disableLeft ? "rgba(255,255,255,0.4)" : "#FFFFFF"}
        />
      </TouchableOpacity>

      <Animated.Text style={[styles.dateText, { opacity: fadeAnim }]}>
        {formatDate(selectedDate)}
      </Animated.Text>

      <TouchableOpacity
        onPress={goNext}
        disabled={disableRight}
        style={styles.iconButton}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-forward"
          size={scale(20)}
          color={disableRight ? "rgba(255,255,255,0.4)" : "#FFFFFF"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    paddingHorizontal: scale(13),
    paddingVertical: verticalScale(4),
    backgroundColor: "#0D0628",
    gap: scale(3),
  },
  iconButton: {
    paddingHorizontal: scale(4),
    paddingVertical: verticalScale(2),
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "500",
    textAlign: "center",
  },
});
