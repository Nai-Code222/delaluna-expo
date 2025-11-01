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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "@/app/theme-context";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";

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

  /** ⬆️ Start header right below the status bar */
  const topInset = Platform.OS === "ios" ? insets.top : StatusBar.currentHeight ?? 0;

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: bg,
            paddingTop: topInset,
            position: "absolute",
            top: 0, // ✅ Always just below the status bar
            left: 0,
            right: 0,
          },
        ]}
      >
        <View style={styles.navBar}>
          {/* LEFT SIDE */}
          <View style={styles.sideContainer}>
            <TouchableOpacity onPress={onLeftPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {leftIconName ? (
                <Ionicons name={leftIconName} size={moderateScale(22)} color={tc} />
              ) : leftIconSource ? (
                <Image source={leftIconSource} style={[styles.icon, { tintColor: tc }]} />
              ) : leftLabel ? (
                <Text style={[styles.sideText, { color: tc }]}>{leftLabel}</Text>
              ) : (
                <View style={styles.placeholder} />
              )}
            </TouchableOpacity>
          </View>

          {/* CENTER TITLE */}
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: tc }]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* RIGHT SIDE */}
          <View style={styles.sideContainer}>
            <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {rightIconName ? (
                <Ionicons name={rightIconName} size={moderateScale(22)} color={tc} />
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    zIndex: 10,
  },
  navBar: {
    height: Platform.OS === "ios" ? 45 : 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(10),
  },
  sideContainer: {
    width: scale(60), // ✅ fixed width for symmetrical sides
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    position: "absolute", // ✅ makes title perfectly centered
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
  },
  icon: {
    width: scale(24),
    height: scale(24),
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
