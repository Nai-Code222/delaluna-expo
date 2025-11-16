import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { scale, verticalScale, moderateScale } from "@/utils/responsive";

interface WeekDate {
  dayLabel: string;
  date: Date;
}
interface WeekDatePickerProps {
  onDateSelect?: (day: WeekDate) => void;
}

export default function WeekDatePicker({ onDateSelect }: WeekDatePickerProps) {
  const [today, setToday] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🕛 Auto-update at midnight
  const setMidnightTimer = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    timerRef.current = setTimeout(() => {
      const newToday = new Date();
      setToday(newToday);
      const index = weekDays.findIndex(
        (d) => d.date.toDateString() === newToday.toDateString()
      );
      setSelectedDay(index);
      setMidnightTimer(); // schedule next
    }, timeUntilMidnight);
  };

  useEffect(() => {
    setMidnightTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Build week
  const weekDays: WeekDate[] = useMemo(() => {
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const days: WeekDate[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        dayLabel: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
        date,
      });
    }
    return days;
  }, [today]);

  useEffect(() => {
    const index = weekDays.findIndex(
      (d) => d.date.toDateString() === today.toDateString()
    );
    setSelectedDay(index);
    fadeIn();
  }, [today]);

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleSelect = (index: number) => {
    setSelectedDay(index);
    fadeIn();
    onDateSelect?.(weekDays[index]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={weekDays}
        keyExtractor={(item) => item.date.toISOString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const isSelected = selectedDay === index;
          return (
            <TouchableOpacity
              style={styles.dayWrapper}
              onPress={() => handleSelect(index)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.dayItem,
                  isSelected && styles.selectedDay,
                  isSelected && { opacity: fadeAnim },
                ]}
              >
                <Text
                  style={[styles.dayLabel, isSelected && styles.selectedText]}
                >
                  {item.dayLabel}
                </Text>
                <Text
                  style={[styles.dayNumber, isSelected && styles.selectedText]}
                >
                  {item.date.getDate()}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0D0628",
    borderBottomWidth: 1,
    borderBottomColor: "#FFFFFF",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  listContent: {
    justifyContent: "space-between",
  },
  dayWrapper: {
    marginHorizontal: scale(4),
  },
  dayItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(10),
    borderRadius: scale(6),
  },
  selectedDay: {
    backgroundColor: "#A78BFA",
  },
  dayLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  dayNumber: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "400",
  },
  selectedText: {
    color: "#0D0628",
  },
});
