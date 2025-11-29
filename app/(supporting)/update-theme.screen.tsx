// app/(supporting)/ChangeThemeScreen.tsx
import React, { useContext, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ThemeContext } from "../theme-context";
import { LinearGradient } from "expo-linear-gradient";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import HeaderNav from "@/components/component-utils/header-nav";
import { auth } from "../../firebaseConfig";
import { db } from '../../firebaseConfig';


type Params = { userID: string };

export default function ChangeThemeScreen() {
  const { theme, setThemeKey, themes } = useContext(ThemeContext);
  const router = useRouter();
  const originalKey = useRef<string | null>(null);
  const params = useLocalSearchParams<Params>();

  /** 🧠 Save original theme only once on mount */
  useEffect(() => {
    if (originalKey.current === null) {
      originalKey.current = theme.key;
    }
  }, []);

  /** 🎨 Handle select + apply */
  const handleSelect = (key: string) => setThemeKey(key);

  const handleApply = async () => {
    const userID = params.userID;
    console.log("Applying theme:", theme.key);

    if (userID) {
      try {
        await setDoc(
          doc(db, "users", auth.currentUser!.uid),
          { themeKey: theme.key },
          { merge: true }
        );
        console.log("✅ Theme updated successfully");
      } catch (err) {
        console.error("❌ Failed to save themeKey:", err);
      }
    }
    router.replace("/(supporting)/profile.screen");
  };

  const handleCancel = () => {
    if (originalKey.current) setThemeKey(originalKey.current);
    router.replace("/(supporting)/profile.screen");
  };

  /** 🌈 Background helper */
  const renderBackground = (children: React.ReactNode) => {
    if (theme.backgroundType === "image" && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={styles.absoluteFill}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      );
    }
    if (theme.backgroundType === "gradient" && theme.gradient) {
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{
            x: Math.cos((theme.gradient.angle ?? 0) * Math.PI / 180),
            y: Math.sin((theme.gradient.angle ?? 0) * Math.PI / 180),
          }}
          style={styles.absoluteFill}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View
        style={[
          styles.absoluteFill,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {children}
      </View>
    );
  };

  /** 📱 Render */
  return renderBackground(
    <View style={[styles.container, { backgroundColor: "transparent" }]}>
      {/* Dynamic StatusBar based on theme */}
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />


      {/* Absolute Header */}
      <HeaderNav
        title="Change Color Theme"
        leftIconName="arrow-back"
        onLeftPress={handleCancel}
        rightLabel="Apply"
        onRightPress={handleApply}
        backgroundColor={theme.colors.headerBg}
        textColor={theme.colors.headerText}
      />

      {/* Scrollable Theme List */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={Object.values(themes)}
        keyExtractor={(t) => t.key}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => {
          const isSelected = item.key === theme.key;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleSelect(item.key)}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: item.colors.headerBg },
                  isSelected && {
                    borderWidth: 2,
                    borderColor: theme.colors.headerText,
                  },
                ]}
              />
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {item.key.charAt(0).toUpperCase() + item.key.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  container: { flex: 1 },
  listContent: {
    paddingTop: 90, // space below the header
    paddingBottom: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    borderBottomWidth: 1,
    marginHorizontal: 16,
    opacity: 0.2,
    borderColor: "rgba(255,255,255,0.3)",
  },
});
