import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "@/app/theme-context";

type HeaderNavProps = {
  title?: string;

  /** Left side */
  leftIconName?: React.ComponentProps<typeof Ionicons>["name"];
  leftIconSource?: ImageSourcePropType;
  leftLabel?: string;
  onLeftPress?: () => void;

  /** Right side */
  rightIconName?: React.ComponentProps<typeof Ionicons>["name"];
  rightIconSource?: ImageSourcePropType;
  rightLabel?: string;
  onRightPress?: () => void;

  /** Override background or text colors */
  backgroundColor?: string;
  textColor?: string;
};

export default function HeaderNav({
  title,
  leftIconName,
  leftIconSource,
  leftLabel,
  onLeftPress,
  rightIconName,
  rightIconSource,
  rightLabel,
  onRightPress,
  backgroundColor,
  textColor,
}: HeaderNavProps) {
  const { theme } = useContext(ThemeContext);

  const bg = backgroundColor ?? theme.colors.headerBg;
  const tc = textColor ?? theme.colors.headerText;

  return (
    <>
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: bg }]} />
      <View style={[styles.navBar, { backgroundColor: bg }]}>
        {/* LEFT SIDE */}
        <TouchableOpacity onPress={onLeftPress} style={styles.sideButton}>
          {leftIconName ? (
            <Ionicons name={leftIconName} size={26} color={tc} />
          ) : leftIconSource ? (
            <Image source={leftIconSource} style={[styles.icon, { tintColor: tc }]} />
          ) : leftLabel ? (
            <Text style={[styles.buttonText, { color: tc }]}>{leftLabel}</Text>
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </TouchableOpacity>

        {/* TITLE */}
        {title ? (
          <Text style={[styles.title, { color: tc }]}>{title}</Text>
        ) : (
          <View style={styles.titlePlaceholder} />
        )}

        {/* RIGHT SIDE */}
        <TouchableOpacity onPress={onRightPress} style={styles.sideButton}>
          {rightIconName ? (
            <Ionicons name={rightIconName} size={26} color={tc} />
          ) : rightIconSource ? (
            <Image source={rightIconSource} style={[styles.icon, { tintColor: tc }]} />
          ) : rightLabel ? (
            <Text style={[styles.buttonText, { color: tc }]}>{rightLabel}</Text>
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
  },
  navBar: {
    height: 45,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  sideButton: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
  iconPlaceholder: {
    width: 26,
    height: 26,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  titlePlaceholder: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
  },
});
