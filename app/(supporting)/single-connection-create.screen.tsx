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
import { functions, db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";
import HomeSignsDisplay from "../components/home/home-signs-display.component";
import ConnectionsPlaceOfBirthField from "../components/connection/connections-place-of-birth-field";
import ConnectionsTimeOfBirthField from "../components/connection/connections-time-of-birth-field";

// Default fallback when user toggles “I don’t know”
const GREENWICH = {
  place: "Greenwich, UK",
  lat: 51.4769,
  lon: 0.0005,
  tzone: 0,
  time: "12:00",
};

interface CallableResponse {
  success: boolean;
  connectionId: string;
  userSigns?: { sun: string; moon: string; rising: string };
  partnerSigns?: { sun: string; moon: string; rising: string };
}

interface AstroSigns {
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
}

export default function SingleConnectionCreateScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { user: userRecord } = useUserProfile(user?.uid);
  const renderBackground = useRenderBackground();
  const router = useRouter();

  const [isMe, setIsMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstPerson, setFirstPerson] = useState<Record<string, any>>({});
  const [secondPerson, setSecondPerson] = useState<Record<string, any>>({});
  const [relationshipType, setRelationshipType] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  const getConnection = httpsCallable<any, CallableResponse>(
    functions,
    "getConnection"
  );
  const getSignsCallable = httpsCallable(functions, "getSigns");

  // Fade animation
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  // Auto-fill "Me" info
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
    {
      label: "Time of Birth",
      type: "time",
      placeholder: "Select time",
    },
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
    {
      key: "first",
      title: "First Individual",
      toggle: true,
      fields: firstFields,
      onChange: setFirstPerson,
    },
    {
      key: "second",
      title: "Second Individual",
      toggle: false,
      fields: birthFields,
      onChange: setSecondPerson,
    },
  ];

  const relationshipOptions = ["consistent", "complicated", "toxic"];

  // Helpers
  const isEmpty = (val: any) =>
    val == null || (typeof val === "string" && val.trim().length === 0);

  const fillDefaultsIfNeeded = (person: Record<string, any>) => {
    const cloned = { ...person };
    const placeRaw = cloned["Place of Birth"];
    const timeRaw = cloned["Time of Birth"];

    const needsPlace =
      !placeRaw ||
      (typeof placeRaw === "string" && placeRaw.toLowerCase().includes("i don"));
    const needsTime =
      !timeRaw ||
      (typeof timeRaw === "string" && timeRaw.toLowerCase().includes("i don"));

    if (needsPlace) {
      cloned["Place of Birth"] = GREENWICH.place;
      cloned.birthLat = GREENWICH.lat;
      cloned.birthLon = GREENWICH.lon;
      cloned.birthTimezone = GREENWICH.tzone;
    }
    if (needsTime) cloned["Time of Birth"] = GREENWICH.time;

    return cloned;
  };

  const validatePerson = (person: Record<string, any>, label: string) => {
    const required = [
      "First Name",
      "Last Name",
      "Birthday",
      "Place of Birth",
      "Time of Birth",
    ];
    const missing = required.filter((f) => isEmpty(person[f]));
    if (missing.length > 0) {
      Alert.alert(
        "Missing Information",
        `${label}: please enter ${missing.join(", ")}.`
      );
      return false;
    }
    return true;
  };

  const extractAstroParams = (person: Record<string, any>) => {
    try {
      const rawBirthdayDate = new Date(person["Birthday"]);
      const rawBirthtimeDate = new Date(
        `${person["Birthday"]} ${person["Time of Birth"]}`
      );
      const mm = rawBirthdayDate.getMonth() + 1;
      const dd = rawBirthdayDate.getDate();
      const yyyy = rawBirthdayDate.getFullYear();
      const hh24 = rawBirthtimeDate.getHours();
      const mn = rawBirthtimeDate.getMinutes();
      const offset = -rawBirthtimeDate.getTimezoneOffset() / 60;

      const lat = person.birthLat ?? GREENWICH.lat;
      const lon = person.birthLon ?? GREENWICH.lon;
      const tzone = person.birthTimezone ?? GREENWICH.tzone;

      return {
        day: dd,
        month: mm,
        year: yyyy,
        hour: hh24,
        min: mn,
        lat,
        lon,
        tzone: offset || tzone,
      };
    } catch (e) {
      console.error("Failed to extract astro params:", e);
      return null;
    }
  };

  const getAstroSigns = async (params: any) => {
    const res = await getSignsCallable(params);
    return res.data;
  };

  const handleGetSigns = async () => {
    if (!user?.uid) return;
    if (!relationshipType) {
      Alert.alert("Select a connection type");
      return;
    }

    const filledSecond = fillDefaultsIfNeeded(secondPerson);
    const okSecond = validatePerson(filledSecond, "Second person");
    if (!okSecond) return;

    let filledFirst = firstPerson;
    if (!isMe) {
      filledFirst = fillDefaultsIfNeeded(firstPerson);
      const okFirst = validatePerson(filledFirst, "First person");
      if (!okFirst) return;
    }

    try {
      setLoading(true);

      const secondParams = extractAstroParams(filledSecond);
      const secondSigns: AstroSigns = secondParams
        ? ((await getAstroSigns(secondParams)) as AstroSigns)
        : ({} as AstroSigns);

      let firstSigns: AstroSigns = {};
      if (!isMe) {
        const firstParams = extractAstroParams(filledFirst);
        if (firstParams)
          firstSigns = (await getAstroSigns(firstParams)) as AstroSigns;
      } else {
        firstSigns = {
          sunSign: userRecord?.sunSign,
          moonSign: userRecord?.moonSign,
          risingSign: userRecord?.risingSign,
        };
      }
    } catch (err: any) {
      console.error("Error creating connection:", err);
      setLoading(false);
      Alert.alert(
        "Unable to save connection",
        err?.message || "Try again in a moment."
      );
    }
  };

  // Render
  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <HeaderNav
        title="New Connection"
        leftLabel="Cancel"
        rightLabel="Save"
        onRightPress={handleGetSigns}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            Calculating and saving connection...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={HEADER_HEIGHT + 20}
        >
          <FlatList
            data={sections}
            keyExtractor={(item) => item.key}
            contentContainerStyle={[
              styles.mainContent,
              {
                paddingTop: HEADER_HEIGHT + 10,
                paddingBottom: verticalScale(120),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={styles.section}>
                <View style={styles.userRow}>
                  <Text style={styles.text}>{item.title}</Text>
                  {item.toggle && (
                    <DelalunaToggle
                      label="Me"
                      value={isMe}
                      onToggle={setIsMe}
                    />
                  )}
                </View>

                <View style={styles.divider} />

                {item.key === "first" && isMe ? (
                  <View style={styles.meCard}>
                    <Text style={styles.meName}>
                      {toTitleCase(userRecord?.firstName || "")}{" "}
                      {toTitleCase(userRecord?.lastName || "")}
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
                            item.onChange((prev: any) => ({
                              ...prev,
                              ...values,
                            }))
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
                            item.onChange((prev: any) => ({
                              ...prev,
                              ...values,
                            }))
                          }
                        />
                      );
                    }

                    return (
                      <DelalunaInputRow
                        key={field.label}
                        fields={[field]}
                        onChange={item.onChange}
                      />
                    );
                  })
                )}
              </View>
            )}
            ListFooterComponent={
              <View style={styles.footer}>
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
            }
          />
        </KeyboardAvoidingView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", backgroundColor: "transparent" },
  mainContent: { paddingHorizontal: scale(14) },
  section: {
    width: "100%",
    marginBottom: verticalScale(30),
    gap: verticalScale(10),
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 5,
  },
  text: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
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
  footer: {
    alignItems: "center",
    marginTop: verticalScale(20),
    flexDirection: "row",
    height: 90,
  },
  relationshipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: scale(10),
    paddingVertical: verticalScale(10),
    marginHorizontal: scale(5),
    alignItems: "center",
  },
  relationshipSelected: {
    backgroundColor: "rgba(142,68,173,0.7)",
    borderColor: "#FFFFFF",
  },
  relationshipIcon: {
    width: scale(75),
    height: scale(75),
    opacity: 0.8,
    tintColor: "rgba(255,255,255,0.85)",
  },
  relationshipIconSelected: { opacity: 1, tintColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#FFFFFF", marginTop: 12, fontSize: 16 },
});
