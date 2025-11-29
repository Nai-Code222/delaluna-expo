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
  TextInput,
  Keyboard,
} from "react-native";

import { router } from "expo-router";

import { httpsCallable } from "firebase/functions";

import AuthContext from "@/backend/auth-context";
import ConfirmDialog from "@/components/alerts/confirm-dialog";
import ConnectionsPlaceOfBirthField from "@/components/connection/connections-place-of-birth-field";
import ConnectionsTimeOfBirthField from "@/components/connection/connections-time-of-birth-field";
import DelalunaInputRow, {
  FieldConfig,
  FieldType,
} from "@/components/component-utils/delaluna-input-form.component";
import DelalunaToggle from "@/components/component-utils/delaluna-toggle.component";
import GlassButton from "@/components/buttons/glass-button";
import HeaderNav from "@/components/component-utils/header-nav";
import HomeSignsDisplay from "@/components/home/home-signs-display.component";
import toTitleCase from "@/utils/toTitleCase.util";
import useRenderBackground from "@/hooks/useRenderBackground";
import {
  PersonBirthData,
  PersonBirthUpdate,
} from "@/model/connection.types";
import { HEADER_HEIGHT } from "@/utils/responsive-header";
import { useUserProfile } from "@/hooks/useUserProfile";
import { verticalScale, scale, moderateScale } from "@/utils/responsive";

import { ThemeContext } from "../theme-context";
import { functions } from "../../firebaseConfig";
import { getAstroSigns } from "../../src/services/astrology-api.service";

export default function SingleConnectionCreateScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { user: userRecord } = useUserProfile(user?.uid);
  const renderBackground = useRenderBackground();
  const [isMe, setIsMe] = useState(true);
  const [loading, setLoading] = useState(false);

  /** FIRST PERSON */
  const [firstPerson, setFirstPerson] = useState<PersonBirthData>({
    "First Name": "",
    "Last Name": "",
    Birthday: "",
    "Place of Birth": "",
    "Time of Birth": "",
  });

  /** SECOND PERSON */
  const [secondPerson, setSecondPerson] = useState<PersonBirthData>({
    "First Name": "",
    "Last Name": "",
    Birthday: "",
    "Place of Birth": "",
    "Time of Birth": "",
  });

  /** Birth fields */
  const birthFields: FieldConfig[] = [
    { label: "First Name", type: "text", placeholder: "Enter first name" },
    { label: "Last Name", type: "text", placeholder: "Enter last name" },
    { label: "Pronouns", type: "pronouns", placeholder: "Select Pronouns" },
    { label: "Birthday", type: "date", placeholder: "MM/DD/YYYY" },
    { label: "Place of Birth", type: "location" },
    { label: "Time of Birth", type: "time", placeholder: "Select time" },
  ];

  type PersonKey = "first" | "second";

  const firstNameRef = useRef<TextInput>(null);
  const firstLastNameRef = useRef<TextInput>(null);
  const firstLocationRef = useRef<{
    dismissSuggestions: () => void;
    focus: () => void;
  }>(null);

  const secondNameRef = useRef<TextInput>(null);
  const secondLastNameRef = useRef<TextInput>(null);
  const secondLocationRef = useRef<{
    dismissSuggestions: () => void;
    focus: () => void;
  }>(null);

  const dismissAllSuggestions = () => {
    firstLocationRef.current?.dismissSuggestions();
    secondLocationRef.current?.dismissSuggestions();
  };

  const [relationshipType, setRelationshipType] = useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;

  /** Fade on theme change */
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  const focusableOrder: Record<PersonKey, string[]> = {
    first: ["First Name", "Last Name", "Pronouns"],
    second: ["First Name", "Last Name", "Pronouns"],
  };

  const getRefs = (personKey: PersonKey) =>
    personKey === "first"
      ? {
        firstName: firstNameRef,
        lastName: firstLastNameRef,
        placeOfBirth: firstLocationRef,
      }
      : {
        firstName: secondNameRef,
        lastName: secondLastNameRef,
        placeOfBirth: secondLocationRef,
      };

  const focusField = (personKey: PersonKey, label: string) => {
    if (label !== "Place of Birth") {
      dismissAllSuggestions();
    }

    const refs = getRefs(personKey);

    switch (label) {
      case "First Name":
        refs.firstName.current?.focus();
        break;
      case "Last Name":
        refs.lastName.current?.focus();
        break;
      case "Pronouns":
        Keyboard.dismiss();
        break;
      case "Place of Birth":
        refs.placeOfBirth.current?.focus();
        break;
      default:
        break;
    }
  };

  const getNextFocusableLabel = (personKey: PersonKey, label: string) => {
    const order = focusableOrder[personKey];
    const idx = order.indexOf(label);
    return idx === -1 ? null : order[idx + 1] || null;
  };

  const handleSubmitEditing = (personKey: PersonKey, label: string) => {
    const nextLabel = getNextFocusableLabel(personKey, label);
    if (nextLabel) {
      focusField(personKey, nextLabel);
    } else {
      Keyboard.dismiss();
    }
  };

  /** Populate ME with signs */
  /** Ensure ME fields never contain boolean */
  const sanitizeValue = (val: any): string | number | undefined =>
    typeof val === "boolean" ? "" : val;

  /** ME fields (LOCKED) */
  const firstFields: FieldConfig[] = isMe
    ? Object.keys(firstPerson).map((label) => ({
      label,
      type: "text" as FieldType,
      value: sanitizeValue(firstPerson[label as keyof PersonBirthData]),
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

  const relationshipOptions = ["consistent", "it's complicated", "toxic"];

  const isEmpty = (val: any) => {
    return val == null || (typeof val === "string" && val.trim().length === 0);
  };

  const personHasData = (person: PersonBirthData) => {
    return Object.values(person).some(
      (val) => val != null && String(val).trim() !== ""
    );
  };

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<null | (() => void)>(null);

  const handleCancel = () => {
    const hasFirstData = personHasData(firstPerson);
    const hasSecondData = personHasData(secondPerson);
    console.log(hasFirstData);
    console.log("First Person: ", firstPerson);
    if (isMe && !hasSecondData) {

      router.replace('/(main)/connections');

    } else if (!isMe && !hasFirstData && !hasSecondData) {
      router.replace('/(main)/connections');
    } else {
      // show confirmation dialog
      setPendingConfirm(() => () => router.replace('/(main)/connections'));
      setShowDiscardDialog(true);
    }
  };


  /** Validate required fields */
  const validatePerson = (person: PersonBirthData, label: string) => {
    const required: (keyof PersonBirthData)[] = [
      "First Name",
      "Last Name",
      "Pronouns",
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

  const handleSaveConnection = async () => {
    dismissAllSuggestions();
    setLoading(true);

    try {
      // VALIDATION
      if (!isMe) {
        if (!validatePerson(firstPerson, "First Person")) {
          setLoading(false);
          return;
        }
      }

      if (!validatePerson(secondPerson, "Second Person")) {
        setLoading(false);
        return;
      }

      if (!relationshipType) {
        Alert.alert("Missing Relationship Type", "Please select a relationship type.");
        setLoading(false);
        return;
      }

      // -----------------------------
      //  BIRTH PARAM EXTRACTOR
      // -----------------------------
      const extractBirthParams = (person: PersonBirthData) => {
        if (!person.Birthday) throw new Error("Birthday is missing");
        if (!person["Time of Birth"]) throw new Error("Time of Birth is missing");

        const { birthLat, birthLon, birthTimezone } = person;

        // Strict validation so TS knows these exist
        if (birthLat == null || birthLon == null || birthTimezone == null) {
          throw new Error(
            "Place of Birth must include latitude, longitude, and timezone."
          );
        }

        const [month, day, year] = person.Birthday.split("/").map(Number);
        const [hour, min] = person["Time of Birth"].split(":").map(Number);

        return {
          day,
          month,
          year,
          hour,
          min,
          lat: birthLat,
          lon: birthLon,
          tzone: Number(birthTimezone),
        };
      };

      let enrichedFirst;

      if (isMe) {
        // Use logged-in user's saved signs + identity
        enrichedFirst = {
          "First Name": userRecord?.firstName || "",
          "Last Name": userRecord?.lastName || "",
          Pronouns: userRecord?.pronouns || "",
          sunSign: userRecord?.sunSign,
          moonSign: userRecord?.moonSign,
          risingSign: userRecord?.risingSign,
        };
      } else {
        // Extract & calculate signs for a manually-entered first person
        const firstBirthParams = extractBirthParams(firstPerson);
        const firstSigns = await getAstroSigns(firstBirthParams);
        enrichedFirst = { ...firstPerson, ...firstSigns };

      }

      //  LOG  enrichedFirst: {"First Name": "Delaluna", "Last Name": "Answers", "Pronouns": "They/Them", "moonSign": "Cancer", "risingSign": "Pisces", "sunSign": "Sagittarius"}
      console.log("enrichedFirst:", enrichedFirst);

      const secondBirthParams = extractBirthParams(secondPerson);


      // -----------------------------
      //  GET SIGNS (First only if NOT Me)
      // -----------------------------
      let enrichedSecond = { ...secondPerson };
      console.log("enrichedSecond:", enrichedSecond);

      // Signs → {"first": {"First Name": "Delaluna", "Last Name": "Answers", "Pronouns": "They/Them", "moonSign": "Cancer", "risingSign": "Pisces", "sunSign": "Sagittarius"}}
      // "second": {"Birthday": "11/26/2025", "First Name": "h", "Last Name": "f", "Place of Birth": "Australia, Australia", "Pronouns": "She/Her", "Time of Birth": "7:23 PM", "birthLat": -24.7761086, "birthLon": 134.755, "birthTimezone": "Australia/Darwin", "isBirthTimeUnknown": false, "isPlaceOfBirthUnknown": false}}
      console.log("Signs →", { first: enrichedFirst});
      const secondSigns = await getAstroSigns(secondBirthParams);
      console.log("Signs →", { second: enrichedSecond });

      // if (!isMe && firstBirthParams) {
      //   const firstSigns = await getAstroSigns(firstBirthParams);
      //   enrichedFirst = { ...firstPerson, ...firstSigns };
      // }

      // const secondSigns = await getAstroSigns(secondBirthParams);
      // enrichedSecond = { ...secondPerson, ...secondSigns };

      // console.log("Signs →", { first: enrichedFirst, second: enrichedSecond });

      // STOP HERE — next step is getConnection + navigation

    } catch (err) {
      console.error("❌ Error saving connection:", err);
      Alert.alert("Error", "Something went wrong creating this connection.");
    }

    setLoading(false);
  };



  return renderBackground(
    <>
      <HeaderNav
        title="New Connection"
        rightLabel="Cancel"
        onRightPress={handleCancel}
      />
      <Animated.View style={[styles.container, { opacity: fade }]}>
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
                paddingTop: HEADER_HEIGHT + verticalScale(5),
                paddingBottom: verticalScale(20),
              }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View style={styles.section}>
                  <View style={styles.userRow}>
                    <Text style={styles.titleText}>{item.title}</Text>

                    {item.toggle && (
                      <DelalunaToggle label="Me" value={isMe} onToggle={setIsMe} />
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
                  ) :
                    (
                      /** Render fields */
                      (() => {
                        const personKey = item.key as PersonKey;

                        return item.fields.map((field) => {
                          const value = sanitizeValue(
                            personKey === "first"
                              ? firstPerson[field.label as keyof PersonBirthData]
                              : secondPerson[field.label as keyof PersonBirthData]
                          );

                          const inputRef =
                            field.label === "First Name"
                              ? personKey === "first"
                                ? firstNameRef
                                : secondNameRef
                              : field.label === "Last Name"
                                ? personKey === "first"
                                  ? firstLastNameRef
                                  : secondLastNameRef
                                : undefined;

                          const nextExists =
                            field.type === "text" &&
                            !!getNextFocusableLabel(personKey, field.label);

                          const returnKeyType =
                            field.type === "text"
                              ? nextExists
                                ? "next"
                                : "done"
                              : undefined;

                          const onSubmitEditing =
                            field.type === "text"
                              ? () => handleSubmitEditing(personKey, field.label)
                              : undefined;

                          if (field.label === "Place of Birth") {
                            return (
                              <ConnectionsPlaceOfBirthField
                                key={field.label}
                                value={
                                  personKey === "first"
                                    ? firstPerson["Place of Birth"] ?? ""
                                    : secondPerson["Place of Birth"] ?? ""
                                }
                                onChange={(values: PersonBirthUpdate) =>
                                  item.onChange((prev: PersonBirthData) => ({
                                    ...prev,
                                    ...values,
                                  }))
                                }
                                ref={personKey === "first" ? firstLocationRef : secondLocationRef}
                                onRequestDismiss={() => dismissAllSuggestions()}
                                returnKeyType={returnKeyType}
                                blurOnSubmit={!nextExists}
                                onSubmitEditing={() =>
                                  handleSubmitEditing(personKey, field.label)
                                }
                              />
                            );
                          }

                          if (field.label === "Time of Birth") {
                            return (
                              <ConnectionsTimeOfBirthField
                                key={field.label}
                                value={
                                  personKey === "first"
                                    ? firstPerson["Time of Birth"]
                                    : secondPerson["Time of Birth"]
                                }
                                onChange={(values: PersonBirthUpdate) =>
                                  item.onChange((prev: PersonBirthData) => ({
                                    ...prev,
                                    ...values,
                                  }))
                                }
                                onRequestDismiss={() => dismissAllSuggestions()}
                              />
                            );
                          }

                          return (
                            <DelalunaInputRow
                              key={field.label}
                              fields={[
                                {
                                  ...field,
                                  value,
                                  inputRef,
                                  returnKeyType,
                                  blurOnSubmit: field.type === "text" ? false : undefined,
                                  onSubmitEditing,
                                },
                              ]}
                              onChange={(values: PersonBirthUpdate) =>
                                item.onChange((prev: PersonBirthData) => ({
                                  ...prev,
                                  ...values,
                                }))
                              }
                            />
                          );
                        });
                      })()
                    )}



                  {item.key === "second" && (
                    <View style={styles.relationshipRow}>
                      {relationshipOptions.map((option) => {
                        const key = option.toLowerCase();

                        const iconSource =
                          key === "consistent"
                            ? require("@/assets/icons/satisfied_icon_words.png")
                            : key === "it's complicated"
                              ? require("@/assets/icons/neutral_icon_words.png")
                              : require("@/assets/icons/dissatisfied_icon_words.png");

                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.relationshipButton,
                              relationshipType === option && styles.relationshipSelected,
                            ]}
                            onPress={() => {
                              dismissAllSuggestions();
                              setRelationshipType(option);
                            }}
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
                  )}
                </View>
              )}
              ListFooterComponent={
                <View style={styles.footerSections}>
                  <GlassButton title="Thassit" onPress={handleSaveConnection} />
                </View>
              }
            />
          </KeyboardAvoidingView>
        )}
        <ConfirmDialog
          visible={showDiscardDialog}
          title="Discard Changes?"
          message="You have unsaved changes. Are you sure you want to leave?"
          onCancel={() => {
            setShowDiscardDialog(false);
            setPendingConfirm(null);
          }}
          onConfirm={() => {
            pendingConfirm?.();
            setShowDiscardDialog(false);
            setPendingConfirm(null);
          }}
        />
      </Animated.View>
    </>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
    paddingTop: verticalScale(25),
  },
  section: {
    width: "100%",
    paddingHorizontal: scale(10),
    paddingBottom: verticalScale(20),
    marginBottom: verticalScale(10),
    backgroundColor: "transparent",
    gap: verticalScale(15),
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: verticalScale(6),
  },
  meCard: {
    borderRadius: scale(10),
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    gap: verticalScale(10),
    padding: scale(15),
  },
  meName: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  relationshipRow: {
    flexDirection: "row",
    height: verticalScale(85),
    marginTop: verticalScale(5),
  },
  relationshipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: scale(10),
    marginHorizontal: scale(5),
    alignItems: "center",
    justifyContent: "center",
  },
  relationshipSelected: {
    backgroundColor: "rgba(142,68,173,0.7)",
    borderColor: "#FFFFFF",
  },
  relationshipIcon: {
    width: scale(65),
    height: scale(65),
    opacity: 0.8,
    tintColor: "rgba(255,255,255,0.85)",
  },
  relationshipIconSelected: {
    opacity: 1,
    tintColor: "#FFFFFF",
  },
  footerSections: {
    paddingBottom: verticalScale(35),
    alignItems: "center",
    gap: verticalScale(15),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: moderateScale(16),
  },
});
