import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";

// Enable smooth animations on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export default function TestConnectionSetUpScreen() {
  const router = useRouter();

  const [showSetup, setShowSetup] = useState(false);

  const [isMe, setIsMe] = useState(true);

  // 👤 Names
  const [personOneFirst, setPersonOneFirst] = useState("User");
  const [personOneLast, setPersonOneLast] = useState("");
  const [personTwoFirst, setPersonTwoFirst] = useState("");
  const [personTwoLast, setPersonTwoLast] = useState("");

  // 🌞 Person 1 signs
  const [userSun, setUserSun] = useState("Virgo");
  const [userMoon, setUserMoon] = useState("Sagittarius");
  const [userRising, setUserRising] = useState("Aquarius");

  // 💫 Person 2 signs
  const [partnerSun, setPartnerSun] = useState("Sagittarius");
  const [partnerMoon, setPartnerMoon] = useState("Pisces");
  const [partnerRising, setPartnerRising] = useState("Pisces");

  // 🎲 Random sign generator
  const randomSign = () =>
    ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)];

  const handleStartSetup = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSetup(true);
  };

  const handleToggleMe = (val: boolean) => {
    setIsMe(val);

    if (val) {
      setPersonOneFirst("User");
      setPersonOneLast("");
    } else {
      setPersonOneFirst("");
      setPersonOneLast("");
    }
  };

  // 🎲 RANDOMIZE NAMES + SIGNS
  const handleRandomize = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (isMe) {
      // Person 1 is "User"
      setPersonOneFirst("User");
      setPersonOneLast("");

      // Person 2 becomes Indiv 2
      setPersonTwoFirst("Indiv");
      setPersonTwoLast("2");
    } else {
      // Person 1 becomes Indiv 1
      setPersonOneFirst("Indiv");
      setPersonOneLast("1");

      // Person 2 becomes Indiv 2
      setPersonTwoFirst("Indiv");
      setPersonTwoLast("2");
    }

    // Randomize signs for both
    setUserSun(randomSign());
    setUserMoon(randomSign());
    setUserRising(randomSign());

    setPartnerSun(randomSign());
    setPartnerMoon(randomSign());
    setPartnerRising(randomSign());
  };

  const handleGenerate = () => {
    const payload = {
      isMe,
      personOneFirst,
      personOneLast,
      personTwoFirst,
      personTwoLast,
      userSun,
      userMoon,
      userRising,
      partnerSun,
      partnerMoon,
      partnerRising,
    };

    router.replace({
      pathname: "/(test-supporting)/get-connection-results-test.screen",
      params: {
        data: JSON.stringify(payload),
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>


      {/* STEP 2: Connection Setup Form */}
        <View style={styles.formBox}>
          {/* ME Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Use “Me” as first person</Text>
            <Switch
              value={isMe}
              onValueChange={handleToggleMe}
              trackColor={{ false: "#333", true: "#5BC0BE" }}
              thumbColor={isMe ? "#6FFFE9" : "#999"}
            />
          </View>

          {/* PERSON 1 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isMe ? "You" : "Person One"}
            </Text>

            {!isMe && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#666"
                  value={personOneFirst}
                  onChangeText={setPersonOneFirst}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#666"
                  value={personOneLast}
                  onChangeText={setPersonOneLast}
                />
              </>
            )}

            <SignPicker label="Sun" value={userSun} onChange={setUserSun} />
            <SignPicker label="Moon" value={userMoon} onChange={setUserMoon} />
            <SignPicker
              label="Rising / Ascendant"
              value={userRising}
              onChange={setUserRising}
            />
          </View>

          {/* PERSON 2 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Person Two</Text>

            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={personTwoFirst}
              onChangeText={setPersonTwoFirst}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#666"
              value={personTwoLast}
              onChangeText={setPersonTwoLast}
            />

            <SignPicker label="Sun" value={partnerSun} onChange={setPartnerSun} />
            <SignPicker
              label="Moon"
              value={partnerMoon}
              onChange={setPartnerMoon}
            />
            <SignPicker
              label="Rising / Ascendant"
              value={partnerRising}
              onChange={setPartnerRising}
            />
          </View>

          {/* RANDOMIZE BUTTON */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#3A506B" }]}
            onPress={handleRandomize}
          >
            <Text style={styles.buttonText}>🎲 Randomize</Text>
          </TouchableOpacity>

          {/* GENERATE BUTTON */}
          <TouchableOpacity style={styles.button} onPress={handleGenerate}>
            <Text style={styles.buttonText}>🔮 Generate Compatibility</Text>
          </TouchableOpacity>
        </View>

    </ScrollView>
  );
}

/* 🔭 Reusable Sign Picker */
function SignPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.picker}
          dropdownIconColor="#6FFFE9"
        >
          {ZODIAC_SIGNS.map((sign) => (
            <Picker.Item key={sign} label={sign} value={sign} color="#fff" />
          ))}
        </Picker>
      </View>
    </View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#000",
    paddingTop: 15,
  },
  formBox: {
    width: "100%",
    backgroundColor: "#1C2541",
    borderRadius: 12,
    padding: 5,
    
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#6FFFE9",
    fontWeight: "700",
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleLabel: {
    color: "#fff",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#0A0F2C",
    color: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#5BC0BE",
    padding: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#5BC0BE",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    color: "#fff",
    backgroundColor: "#1C2541",
  },
  button: {
    backgroundColor: "#5BC0BE",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
