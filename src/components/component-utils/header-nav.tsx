import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { scale, moderateScale } from "@/utils/responsive";
import { HEADER_HEIGHT } from "@/utils/responsive-header";
import { ThemeContext } from "../../../app/theme-context";

type HeaderNavProps = {
  title?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftIconName?: React.ComponentProps<typeof Ionicons>["name"];
  rightIconName?: React.ComponentProps<typeof Ionicons>["name"];
  leftIconSource?: ImageSourcePropType;
  rightIconSource?: ImageSourcePropType;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
};

export default function HeaderNav({
  title,
  leftLabel,
  rightLabel,
  leftIconName,
  rightIconName,
  leftIconSource,
  rightIconSource,
  onLeftPress,
  onRightPress,
  backgroundColor,
  textColor,
}: HeaderNavProps) {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  const bg = backgroundColor ?? theme.colors.headerBg;
  const tc = textColor ?? theme.colors.headerText;
  const navHeight = HEADER_HEIGHT - insets.top;
  const iconScale = 30;

  return (
    <>
      {/* 🌙 StatusBar appearance */}
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* 🔝 Absolute header positioned below the status bar */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: "transparent",
            height: HEADER_HEIGHT,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={[styles.navBar, { height: navHeight }]}>
          {/* LEFT SIDE */}
          <TouchableOpacity onPress={onLeftPress} style={styles.sideContainer}>
            {leftIconName ? (
              <Ionicons name={leftIconName} size={moderateScale(iconScale)} color={tc} />
            ) : leftIconSource ? (
              <Image source={leftIconSource} style={[styles.icon, { tintColor: tc }]} />
            ) : leftLabel ? (
              <Text style={[styles.sideText, { color: tc }]}>{leftLabel}</Text>
            ) : (
              <View style={styles.placeholder} />
            )}
          </TouchableOpacity>

          {/* TITLE */}
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: tc }]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* RIGHT SIDE */}
          <TouchableOpacity onPress={onRightPress} style={styles.sideContainer}>
            {rightIconName ? (
              <Ionicons name={rightIconName} size={moderateScale(iconScale)} color={tc} />
            ) : rightIconSource ? (
              <Image source={rightIconSource} style={[styles.icon, { tintColor: tc }]} />
            ) : rightLabel ? (
              <Text style={[styles.sideText, { color: tc }]}>{rightLabel}</Text>
            ) : (
              <View style={styles.placeholder} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 4, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(10),
  },
  sideContainer: {
    width: scale(80),
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: moderateScale(18),
    fontWeight: Platform.select({ ios: "700", android: "600" }),
    includeFontPadding: false,
    textAlignVertical: "center",
    letterSpacing: 0.2,
  },
  icon: {
    width: scale(30),
    height: scale(30),
    resizeMode: "contain",
  },
  placeholder: {
    width: scale(24),
    height: scale(24),
  },
  sideText: {
    fontSize: moderateScale(15),
    fontWeight: "500",
    includeFontPadding: false,
  },
});
