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
import { Image } from "react-native";

interface GetConnectionRequest {
  userId: string;
  isMe: boolean;
  relationshipType: string;
  firstPerson: Record<string, any>;
  secondPerson: Record<string, any>;
}

interface GetConnectionResponse {
  connectionId: string;
  success: boolean;
  message: string;
}

export default function SingleConnectionCreateScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { user: userRecord } = useUserProfile(user?.uid);
  const renderBackground = useRenderBackground();

  const [isMe, setIsMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstPerson, setFirstPerson] = useState<Record<string, string | number | boolean>>({});
  const [secondPerson, setSecondPerson] = useState<Record<string, string | number | boolean>>({});
  const [relationshipType, setRelationshipType] = useState<string | null>(null);
  const getConnection = httpsCallable<GetConnectionRequest, GetConnectionResponse>(
    functions,
    "getConnection"
  );


  const fade = useRef(new Animated.Value(0)).current;
  const router = useRouter();

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
    { label: "First Name", type: "text", placeholder: "Enter first name" },
    { label: "Last Name", type: "text", placeholder: "Enter last name" },
    { label: "Birthday", type: "date", placeholder: "MM/DD/YYYY" },
    { label: "Place of Birth", type: "location", placeholder: "Search city..." },
    { label: "Time of Birth", type: "time", placeholder: "Select time", hasUnknownToggle: true },
  ];

  

// Auto-fill when “Me” is toggled
useEffect(() => {
  if (isMe && userRecord) {
    console.log("👤 Auto-filling with userRecord:", userRecord);

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

const userFields = React.useMemo((): FieldConfig[] => [
  { label: "First Name", type: "text", placeholder: String(firstPerson["First Name"] || "Enter last name") },
  { label: "Last Name", type: "text", placeholder: String(firstPerson["Last Name"] || "Enter last name") },
  { label: "Sun Sign", type: "text", placeholder: String(firstPerson["Sun Sign"] || "e.g., Leo" )},
  { label: "Moon Sign", type: "text", placeholder: String(firstPerson["Moon Sign"] || "e.g., Aries") },
  { label: "Rising Sign", type: "text", placeholder: String(firstPerson["Rising Sign"] ||"e.g., Sagittarius") },
], [firstPerson]);



  const firstIndividualFields = isMe
    ? userFields.map((f) => ({
      ...f,
      value: firstPerson[f.label] as string,
      editable: false,
    }))
    : nonUserFields;

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

  const relationshipOptions = ["consistent", "it’s complicated", "toxic"];

  const handleSaveConnection = async () => {
    if (!user?.uid || !relationshipType) return;

    try {
      setLoading(true);

      const res = await getConnection({
        userId: user.uid,
        isMe,
        relationshipType,
        firstPerson,
        secondPerson,
      });

      const connectionId = res.data?.connectionId;
      if (!connectionId) throw new Error("No connection ID returned");

      const ref = doc(db, "users", user.uid, "connections", connectionId);

      // Watch for Firestore updates
      const unsubscribe = onSnapshot(ref, (snap) => {
        const data = snap.data();
        if (!data) return;

        if (data.status === "complete" && data.result) {
          unsubscribe();
          setLoading(false);
          router.push({
            pathname: "/single-connection-view.screen",
            params: { connectionId },
          });
        }
      });
    } catch (err) {
      console.error("❌ Error saving connection:", err);
      setLoading(false);
    }
  };


  function handleCancel(): void {
    const isEmpty = (form: Record<string, any>) =>
      !Object.values(form || {}).some((val) => val && String(val).trim() !== "");

    const firstEmpty = isEmpty(firstPerson);
    const secondEmpty = isEmpty(secondPerson);

    if (isMe && secondEmpty) {
      return router.replace("/connections");
    }

    if (!isMe && (firstEmpty || secondEmpty)) {
      return router.replace("/connections");
    }

    Alert.alert(
      "Discard changes?",
      "You have unsaved information. Are you sure you want to go back?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => router.replace("/connections"),
        },
      ]
    );
  }


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
    display: "flex",
    flexDirection: "row",
    height: 90
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
  relationshipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  relationshipTextSelected: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
  },
  toggleRow: {
    marginTop: verticalScale(10),
    marginLeft: scale(115),
    gap: verticalScale(6),
    alignItems: "flex-start",
    zIndex: 10,
    elevation: 10,
  },
  relationshipContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  relationshipIcon: {
    width: scale(75),
    height: scale(75),
    opacity: 0.8,
    marginRight: scale(8),
    tintColor: "rgba(255,255,255,0.85)", // slight tint for unified tone
  },
  relationshipIconSelected: {
    opacity: 1,
    tintColor: "#FFFFFF", // pure white glow when selected
  },
});
