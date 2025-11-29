import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getAstroSigns } from "@/services/astrology-api.service";
import { useRouter } from 'expo-router';

// Enable smooth animations on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export default function TestSignsScreen() {
  const [showSetup, setShowSetup] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMe, setIsMe] = useState(true);
  const router = useRouter();

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

  const handleStartSetup = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSetup(true);
    setShowResults(false);
  };

  const handleGenerate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSetup(false);
    setShowResults(true);
    console.log("🪩 Generating Compatibility:");
    console.log("Person 1:", { personOneFirst, personOneLast, userSun, userMoon, userRising });
    console.log("Person 2:", { personTwoFirst, personTwoLast, partnerSun, partnerMoon, partnerRising });
  };

  const handleToggleMe = (val: boolean) => {
    setIsMe(val);
    if (val) {
      setPersonOneFirst("User");
      setPersonOneLast("");
    } else {
      setPersonOneFirst("");
    }
  };

  function randomBirth() {
  return {
    day: Math.floor(Math.random() * 28) + 1,
    month: Math.floor(Math.random() * 12) + 1,
    year: Math.floor(Math.random() * 35) + 1970,
    hour: Math.floor(Math.random() * 24),
    min: Math.floor(Math.random() * 60),
  };
}

  const handleTestSigns = async () => {
  
  const birth = randomBirth();
  let returnedSigns;

  const sentBirth = {
    ...birth,
    lat: 34.9984,
    lon: -91.9837,
    tzone: -5,
  };

  setLoading(true);
  setError(null);

  try {
    const data = await getAstroSigns(sentBirth);
    returnedSigns = data;
  } catch (e: any) {
    setError(e.message || "Unknown error");
  } finally {
    setLoading(false);

    router.replace({
      pathname: "/(test-supporting)/get-signs-tests.screen",
      params: {
        sent: JSON.stringify(sentBirth),
        returned: JSON.stringify(returnedSigns),
      },
    });
  }
};

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>💫 Test Actions</Text>

      <TouchableOpacity
            style={[styles.button, { marginTop: 20, backgroundColor: "#3A506B" }]}
            onPress={handleTestSigns}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>✨ Run getSigns Test</Text>
            )}
      </TouchableOpacity>

      {/* STEP 1: Create Setup */}
      {!showSetup && !showResults && (
        <TouchableOpacity style={styles.button} onPress={handleStartSetup}>
          <Text style={styles.buttonText}>💞 Run Connection Test</Text>
        </TouchableOpacity>
      )}

      {/* STEP 2: Setup Form */}
      {showSetup && (
        <View style={styles.formBox}>
          {/* ME TOGGLE */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Use “Me” as first person</Text>
            <Switch
              value={isMe}
              onValueChange={handleToggleMe}
              trackColor={{ false: "#333", true: "#5BC0BE" }}
              thumbColor={isMe ? "#6FFFE9" : "#999"}
            />
          </View>

          {/* PERSON 1 INFO */}
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

          {/* PERSON 2 INFO */}
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
            <SignPicker label="Moon" value={partnerMoon} onChange={setPartnerMoon} />
            <SignPicker
              label="Rising / Ascendant"
              value={partnerRising}
              onChange={setPartnerRising}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleGenerate}>
            <Text style={styles.buttonText}>🔮 Generate Compatibility</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 3: Results */}
      {showResults && (
        <View style={styles.resultBox}>
          <Text style={styles.resultHeader}>🌟 Compatibility Breakdown</Text>

          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>☀️ Sun</Text>
            <Text style={styles.resultValue}>{userSun} × {partnerSun}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>🌙 Moon</Text>
            <Text style={styles.resultValue}>{userMoon} × {partnerMoon}</Text>
          </View>
          <View style={styles.resultPair}>
            <Text style={styles.resultLabel}>⬆️ Rising</Text>
            <Text style={styles.resultValue}>{userRising} × {partnerRising}</Text>
          </View>

          
        </View>
      )}

      {error && <Text style={styles.error}>Error: {error}</Text>}
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
          onValueChange={(itemValue) => onChange(itemValue)}
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
    padding: 24,
  },
  title: {
    color: "#6FFFE9",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 45,
  },
  formBox: {
    width: "100%",
    backgroundColor: "#1C2541",
    borderRadius: 12,
    padding: 16,
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
  resultBox: {
    backgroundColor: "#1C2541",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    marginTop: 20,
  },
  resultHeader: {
    color: "#6FFFE9",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  resultPair: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resultLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  resultValue: {
    color: "#C5AFFF",
    fontSize: 15,
  },
  error: {
    color: "#ff4d4f",
    marginTop: 10,
  },
});
