import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  FlatList, // 👈 replaced ScrollView
  TouchableOpacity,
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

export default function SingleConnectionCreateScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { user: userRecord } = useUserProfile(user?.uid);
  const renderBackground = useRenderBackground();

  const [isMe, setIsMe] = useState(true);
  const [firstPerson, setFirstPerson] = useState<Record<string, string | number | boolean>>({});
  const [secondPerson, setSecondPerson] = useState<Record<string, string | number | boolean>>({});

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  const nonUserFields: FieldConfig[] = [
    { label: "First Name", type: "text" as FieldType, placeholder: "Enter first name" },
    { label: "Last Name", type: "text" as FieldType, placeholder: "Enter last name" },
    { label: "Birthday", type: "date" as FieldType, placeholder: "MM/DD/YYYY" },
    { label: "Place of Birth", type: "location" as FieldType, placeholder: "Search city..." },
    { label: "Time of Birth", type: "time" as FieldType, placeholder: "Select time", hasUnknownToggle: true },
  ];

  const userFields: FieldConfig[] = [
    { label: "First Name", type: "text" as FieldType, placeholder: "Enter first name" },
    { label: "Last Name", type: "text" as FieldType, placeholder: "Enter last name" },
    { label: "Sun Sign", type: "text" as FieldType, placeholder: "e.g., Leo" },
    { label: "Moon Sign", type: "text" as FieldType, placeholder: "e.g., Aries" },
    { label: "Rising Sign", type: "text" as FieldType, placeholder: "e.g., Sagittarius" },
  ];

  // Auto-fill first person data when toggle is "Me"
  useEffect(() => {
    if (isMe && userRecord) {
      setFirstPerson({
        "First Name": userRecord.firstName ?? "",
        "Last Name": userRecord.lastName ?? "",
        "Sun Sign": userRecord.sunSign ?? "",
        "Moon Sign": userRecord.moonSign ?? "",
        "Rising Sign": userRecord.risingSign ?? "",
      });
    } else {
      setFirstPerson({});
    }
  }, [isMe, userRecord]);

  const firstIndividualFields = isMe
    ? userFields.map((f) => ({
        ...f,
        value: firstPerson[f.label] as string,
        editable: false,
      }))
    : nonUserFields;

  // Prepare list data for FlatList
  const sections = [
    {
      key: "first",
      title: "First Individual",
      toggle: true,
      fields: firstIndividualFields,
      onChange: setFirstPerson,
    },
    {
      key: "second",
      title: "Second Individual",
      toggle: false,
      fields: nonUserFields,
      onChange: setSecondPerson,
    },
  ];

  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <HeaderNav title="New Connection" leftLabel="Cancel" rightLabel="Save" />
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[styles.mainContent, { paddingTop: HEADER_HEIGHT + 10 }]}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <View style={styles.userRow}>
              <Text style={styles.text}>{item.title}</Text>
              {item.toggle && (
                <DelalunaToggle label="Me" value={isMe} onToggle={setIsMe} />
              )}
            </View>
            <View style={styles.divider} />
            <DelalunaInputRow fields={item.fields} onChange={item.onChange} />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addText}>+ Add Relationship Type</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    paddingBottom: verticalScale(40),
  },
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
  footer: {
    alignItems: "center",
    marginTop: verticalScale(20),
  },
  addBtn: {
    borderWidth: 1,
    borderColor: "#FFFFFF90",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
