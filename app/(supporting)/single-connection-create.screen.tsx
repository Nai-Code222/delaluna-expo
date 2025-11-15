import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";

import { ThemeContext } from "../theme-context";
import useRenderBackground from "../hooks/useRenderBackground";
import DelalunaToggle from "../components/component-utils/delaluna-toggle.component";
import DelalunaInputRow, {
  FieldConfig,
  FieldType,
} from "../components/component-utils/delaluna-input-form.component";
import HeaderNav from "../components/component-utils/header-nav";
import { useUserProfile } from "../hooks/useUserProfile";
import AuthContext from "../backend/auth-context";
import { scale, verticalScale } from "@/src/utils/responsive";
import { HEADER_HEIGHT } from "@/src/utils/responsive-header";
import toTitleCase from "../utils/toTitleCase.util";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";
import HomeSignsDisplay from "../components/home/home-signs-display.component";
import ConnectionsPlaceOfBirthField from "../components/connection/connections-place-of-birth-field";
import ConnectionsTimeOfBirthField from "../components/connection/connections-time-of-birth-field";
import GlassButton from "../components/buttons/glass-button";

const GREENWICH = {
  place: "Greenwich, UK",
  lat: 51.4769,
  lon: 0.0005,
  tzone: 0,
  time: "12:00",
};

export default function SingleConnectionCreateScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { user: userRecord } = useUserProfile(user?.uid);
  const renderBackground = useRenderBackground();

  const [isMe, setIsMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstPerson, setFirstPerson] = useState<Record<string, any>>({});
  const [secondPerson, setSecondPerson] = useState<Record<string, any>>({});
  const [relationshipType, setRelationshipType] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  const getSignsCallable = httpsCallable(functions, "getSigns");

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  useEffect(() => {
    if (isMe && userRecord) {
      setFirstPerson({
        "First Name": toTitleCase(userRecord.firstName || ""),
        "Last Name": toTitleCase(userRecord.lastName || ""),
        "Sun Sign": toTitleCase(userRecord.sunSign || ""),
        "Moon Sign": toTitleCase(userRecord.moonSign || ""),
        "Rising Sign": toTitleCase(userRecord.risingSign || ""),
      });
    } else {
      setFirstPerson({});
    }
  }, [isMe, userRecord]);

  const birthFields: FieldConfig[] = [
    { label: "First Name", type: "text", placeholder: "Enter first name" },
    { label: "Last Name", type: "text", placeholder: "Enter last name" },
    { label: "Birthday", type: "date", placeholder: "MM/DD/YYYY" },
    { label: "Place of Birth", type: "location" },
    { label: "Time of Birth", type: "time", placeholder: "Select time" },
  ];

  const firstFields: FieldConfig[] = isMe
    ? Object.keys(firstPerson).map((label) => ({
        label,
        type: "text" as FieldType,
        value: firstPerson[label],
        editable: false,
      }))
    : birthFields;

  const sections = [
    { key: "first", title: "First Individual", toggle: true, fields: firstFields, onChange: setFirstPerson },
    { key: "second", title: "Second Individual", toggle: false, fields: birthFields, onChange: setSecondPerson },
  ];

  const relationshipOptions = ["consistent", "complicated", "toxic"];

  const isEmpty = (val: any) =>
    val == null || (typeof val === "string" && val.trim().length === 0);

  const fillDefaultsIfNeeded = (person: Record<string, any>) => {
    const cloned = { ...person };
    const place = cloned["Place of Birth"];
    const time = cloned["Time of Birth"];

    if (!place || place.toLowerCase().includes("i don't")) {
      cloned["Place of Birth"] = GREENWICH.place;
      cloned.birthLat = GREENWICH.lat;
      cloned.birthLon = GREENWICH.lon;
      cloned.birthTimezone = GREENWICH.tzone;
    }

    if (!time || time.toLowerCase().includes("i don't")) {
      cloned["Time of Birth"] = GREENWICH.time;
    }

    return cloned;
  };

  const validatePerson = (person: Record<string, any>, label: string) => {
    const required = ["First Name", "Last Name", "Birthday", "Place of Birth", "Time of Birth"];
    const missing = required.filter((f) => isEmpty(person[f]));
    if (missing.length > 0) {
      Alert.alert("Missing Information", `${label}: please enter ${missing.join(", ")}.`);
      return false;
    }
    return true;
  };

  // ‼️ render
  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <HeaderNav title="New Connection" leftLabel="Cancel" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Calculating and saving connection...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
          <FlatList
            data={sections}
            keyExtractor={(item) => item.key}
            style={{ backgroundColor: "transparent" }}
            contentContainerStyle={{
              paddingTop: HEADER_HEIGHT + 5,
              paddingBottom: verticalScale(25),
            }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={styles.section}>
                <View style={styles.userRow}>
                  <Text style={styles.text}>{item.title}</Text>
                  {item.toggle && (
                    <DelalunaToggle label="Me" value={isMe} onToggle={setIsMe} />
                  )}
                </View>

                <View style={styles.divider} />

                {item.key === "first" && isMe ? (
                  <View style={styles.meCard}>
                    <Text style={styles.meName}>
                      {toTitleCase(userRecord?.firstName || "")} {toTitleCase(userRecord?.lastName || "")}
                    </Text>
                    <HomeSignsDisplay
                      sun={userRecord?.sunSign}
                      moon={userRecord?.moonSign}
                      rising={userRecord?.risingSign}
                    />
                  </View>
                ) : (
                  item.fields.map((field) => {
                    if (field.label === "Place of Birth") {
                      return (
                        <ConnectionsPlaceOfBirthField
                          key={field.label}
                          value={
                            item.key === "first"
                              ? firstPerson["Place of Birth"]
                              : secondPerson["Place of Birth"]
                          }
                          onChange={(values) =>
                            item.onChange((prev: any) => ({ ...prev, ...values }))
                          }
                        />
                      );
                    }

                    if (field.label === "Time of Birth") {
                      return (
                        <ConnectionsTimeOfBirthField
                          key={field.label}
                          value={
                            item.key === "first"
                              ? firstPerson["Time of Birth"]
                              : secondPerson["Time of Birth"]
                          }
                          onChange={(values) =>
                            item.onChange((prev: any) => ({ ...prev, ...values }))
                          }
                        />
                      );
                    }

                    return (
                      <DelalunaInputRow
                        key={field.label}
                        fields={[
                          {
                            ...field,
                            value:
                              item.key === "first"
                                ? firstPerson[field.label]
                                : secondPerson[field.label],
                          },
                        ]}
                        onChange={(values) =>
                          item.onChange((prev: any) => ({ ...prev, ...values }))
                        }
                      />
                    );
                  })
                )}

                {/* ⭐ RELATIONSHIP TYPE INSIDE LIST (no purple gap) */}
                <View style={styles.relationshipRow}>
                  {relationshipOptions.map((option) => {
                    const iconSource =
                      option === "consistent"
                        ? require("../assets/icons/satisfied_icon_words.png")
                        : option === "complicated"
                          ? require("../assets/icons/neutral_icon_words.png")
                          : require("../assets/icons/dissatisfied_icon_words.png");

                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.relationshipButton,
                          relationshipType === option &&
                            styles.relationshipSelected,
                        ]}
                        onPress={() => setRelationshipType(option)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={iconSource}
                          style={[
                            styles.relationshipIcon,
                            relationshipType === option &&
                              styles.relationshipIconSelected,
                          ]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            ListFooterComponent={
              <View style={[styles.footerSections, { backgroundColor: "transparent" }]}>
                <GlassButton title={"Thassit"} onPress={() => {}} />
              </View>
            }
          />
        </KeyboardAvoidingView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  mainContent: {
    paddingHorizontal: scale(14),
  },
  section: {
    width: "100%",
    marginBottom: verticalScale(25),
    gap: verticalScale(10),
    backgroundColor: "transparent",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: verticalScale(8),
  },
  meCard: {
    padding: verticalScale(20),
    borderRadius: scale(12),
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
  },
  meName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },

  /* ⭐ Relationship selection (inside sections) */
  relationshipRow: {
    flexDirection: "row",
    marginTop: verticalScale(10),
    height: 80,
    backgroundColor: "transparent",
  },

  relationshipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: scale(10),
    marginHorizontal: scale(5),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(10),
  },
  relationshipSelected: {
    backgroundColor: "rgba(142,68,173,0.7)",
    borderColor: "#FFFFFF",
  },
  relationshipIcon: {
    width: scale(70),
    height: scale(70),
    opacity: 0.85,
    tintColor: "rgba(255,255,255,0.85)",
  },
  relationshipIconSelected: { opacity: 1, tintColor: "#FFFFFF" },

  footerSections: {
    marginTop: verticalScale(20),
    paddingBottom: verticalScale(20),
    backgroundColor: "transparent",
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#FFFFFF", marginTop: 12, fontSize: 16 },
});
