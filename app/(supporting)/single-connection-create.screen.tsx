// app/(supporting)/single-connection-create.screen.tsx
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
  Alert,
  Image,
} from "react-native";
import { DateTime } from "luxon";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";
import { functions, db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { ThemeContext } from "../theme-context";
import useRenderBackground from "../hooks/useRenderBackground";
import DelalunaToggle from "../components/component-utils/delaluna-toggle.component";
import DelalunaInputRow, { FieldConfig } from "../components/component-utils/delaluna-input-form.component";
import HeaderNav from "../components/component-utils/header-nav";
import { useUserProfile } from "../hooks/useUserProfile";
import AuthContext from "../backend/auth-context";
import { scale, verticalScale } from "@/src/utils/responsive";
import { HEADER_HEIGHT } from "@/src/utils/responsive-header";
import toTitleCase from "../utils/toTitleCase.util";

/* -------------------------------------------------
   🔮 Interfaces aligned with backend
---------------------------------------------------*/
interface ConnectionPersonInput {
  firstName: string;
  lastName: string;
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}

interface GetConnectionRequest {
  userId: string;
  isMe: boolean;
  relationshipType: string;
  firstPerson: ConnectionPersonInput;
  secondPerson: ConnectionPersonInput;
}

interface GetConnectionResponse {
  connectionId: string;
  success: boolean;
  message: string;
}

/* -------------------------------------------------
   🪩 Component
---------------------------------------------------*/
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
  const unsubscribeRef = useRef<() => void>();

  const getConnection = httpsCallable<GetConnectionRequest, GetConnectionResponse>(
    functions,
    "getConnection"
  );

  /* -----------------------------------------------
     🌀 Fade-in animation
  -------------------------------------------------*/
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  /* -----------------------------------------------
     👤 Auto-fill user data when “Me” toggled
  -------------------------------------------------*/
  useEffect(() => {
    if (isMe && userRecord) {
      setFirstPerson({
        "First Name": toTitleCase(userRecord.firstName || ""),
        "Last Name": toTitleCase(userRecord.lastName || ""),
        "Sun Sign": toTitleCase(userRecord.sunSign || ""),
        "Moon Sign": userRecord.moonSign || "",
        "Rising Sign": userRecord.risingSign || "",
      });
    } else if (!isMe) {
      setFirstPerson({});
    }
  }, [isMe, userRecord]);

  /* -----------------------------------------------
     🗓️ Form fields
  -------------------------------------------------*/
  const nonUserFields: FieldConfig[] = [
    { label: "First Name", type: "text", placeholder: "Enter first name" },
    { label: "Last Name", type: "text", placeholder: "Enter last name" },
    { label: "Birthday", type: "date", placeholder: "MM/DD/YYYY" },
    { label: "Place of Birth", type: "location", placeholder: "Search city..." },
    { label: "Time of Birth", type: "time", placeholder: "Select time", hasUnknownToggle: true },
  ];

  const userFields: FieldConfig[] = [
    { label: "First Name", type: "text", placeholder: "Enter first name" },
    { label: "Last Name", type: "text", placeholder: "Enter last name" },
    { label: "Sun Sign", type: "text", placeholder: "e.g., Leo" },
    { label: "Moon Sign", type: "text", placeholder: "e.g., Aries" },
    { label: "Rising Sign", type: "text", placeholder: "e.g., Sagittarius" },
  ];

  const firstIndividualFields = isMe
    ? userFields.map((f) => ({
        ...f,
        value: firstPerson[f.label] as string,
        editable: false,
      }))
    : nonUserFields;

  const sections = [
    { key: "first", title: "First Individual", toggle: true, fields: firstIndividualFields, onChange: setFirstPerson },
    { key: "second", title: "Second Individual", toggle: false, fields: nonUserFields, onChange: setSecondPerson },
  ];

  const relationshipOptions = ["consistent", "it’s complicated", "toxic"];

  /* -----------------------------------------------
     🧩 Convert form to backend structure
  -------------------------------------------------*/
  const formatForBackend = (person: Record<string, any>): ConnectionPersonInput => {
    const parsedDate = DateTime.fromFormat(person["Birthday"] || "", "MM/dd/yyyy");
    const [hourRaw, minuteRaw] = (person["Time of Birth"] || "12:00")
      .split(":")
      .map((n: string) => parseInt(n, 10));

    return {
      firstName: person["First Name"] || "",
      lastName: person["Last Name"] || "",
      day: parsedDate.day || 1,
      month: parsedDate.month || 1,
      year: parsedDate.year || 2000,
      hour: hourRaw || 12,
      min: minuteRaw || 0,
      lat: person.lat || 30.2672,
      lon: person.lon || -97.7431,
      tzone: person.tzone || -5,
    };
  };

  /* -----------------------------------------------
     💾 Save + Firestore watch
  -------------------------------------------------*/
  const handleSaveConnection = async () => {
    if (!user?.uid || !relationshipType) {
      Alert.alert("Missing Info", "Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);
      console.log("🚀 Creating connection...");

      const res = await getConnection({
        userId: user.uid,
        isMe,
        relationshipType,
        firstPerson: formatForBackend(firstPerson),
        secondPerson: formatForBackend(secondPerson),
      });

      const connectionId = res.data?.connectionId;
      if (!connectionId) throw new Error("No connection ID returned");

      console.log("🪩 Connection started:", connectionId);

      // Clean up old listener before adding new one
      if (unsubscribeRef.current) unsubscribeRef.current();

      const ref = doc(db, "users", user.uid, "connections", connectionId);
      const unsubscribe = onSnapshot(ref, (snap) => {
        const data = snap.data();
        if (!data) return;

        console.log("🔁 Firestore update:", data.status);

        if (data.status === "complete" && data.result) {
          unsubscribe();
          setLoading(false);
          console.log("✅ Compatibility ready!");
          router.push({
            pathname: "/single-connection-view.screen",
            params: { connectionId },
          });
        }
      });

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error("❌ Error saving connection:", err);
      Alert.alert("Error", "Failed to create connection. Try again.");
      setLoading(false);
    }
  };

  /* -----------------------------------------------
     🚪 Cancel logic
  -------------------------------------------------*/
  const handleCancel = () => {
    const isEmpty = (form: Record<string, any>) =>
      !Object.values(form || {}).some((val) => val && String(val).trim() !== "");

    const firstEmpty = isEmpty(firstPerson);
    const secondEmpty = isEmpty(secondPerson);

    if ((isMe && secondEmpty) || (!isMe && (firstEmpty || secondEmpty))) {
      return router.replace("/connections");
    }

    Alert.alert(
      "Discard changes?",
      "You have unsaved information. Are you sure you want to go back?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", style: "destructive", onPress: () => router.replace("/connections") },
      ]
    );
  };

  /* -----------------------------------------------
     🪶 Render
  -------------------------------------------------*/
  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <HeaderNav title="New Connection" leftLabel="Cancel" onLeftPress={handleCancel} rightLabel="Save" onRightPress={handleSaveConnection} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>✨ Calculating Compatibility...</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.mainContent, { paddingTop: HEADER_HEIGHT + 10 }]}
          renderItem={({ item }) => (
            <View style={styles.section}>
              <View style={styles.userRow}>
                <Text style={styles.text}>{item.title}</Text>
                {item.toggle && <DelalunaToggle label="Me" value={isMe} onToggle={setIsMe} />}
              </View>
              <View style={styles.divider} />
              <DelalunaInputRow fields={item.fields} onChange={item.onChange} />
            </View>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {relationshipOptions.map((option) => {
                const iconSource =
                  option === "consistent"
                    ? require("../assets/icons/satisfied_icon_words.png")
                    : option === "it’s complicated"
                    ? require("../assets/icons/neutral_icon_words.png")
                    : require("../assets/icons/dissatisfied_icon_words.png");

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.relationshipButton,
                      relationshipType === option && styles.relationshipSelected,
                    ]}
                    onPress={() => setRelationshipType(option)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.relationshipContent}>
                      <Image
                        source={iconSource}
                        style={[
                          styles.relationshipIcon,
                          relationshipType === option && styles.relationshipIconSelected,
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          }
        />
      )}
    </Animated.View>
  );
}

/* -------------------------------------------------
   🎨 Styles
---------------------------------------------------*/
const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", backgroundColor: "transparent" },
  mainContent: { paddingHorizontal: scale(14), paddingBottom: verticalScale(40) },
  section: { width: "100%", marginBottom: verticalScale(30), gap: verticalScale(10) },
  userRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: 5 },
  text: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: verticalScale(8) },
  footer: { alignItems: "center", marginTop: verticalScale(20), flexDirection: "row", height: 90 },
  relationshipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: scale(10),
    paddingVertical: verticalScale(10),
    marginHorizontal: scale(5),
    alignItems: "center",
  },
  relationshipSelected: { backgroundColor: "rgba(142,68,173,0.7)", borderColor: "#FFFFFF" },
  relationshipContent: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  relationshipIcon: { width: scale(75), height: scale(75), opacity: 0.8, tintColor: "rgba(255,255,255,0.85)" },
  relationshipIconSelected: { opacity: 1, tintColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#FFFFFF", marginTop: 12, fontSize: 16 },
});
