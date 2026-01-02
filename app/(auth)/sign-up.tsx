import "intl";
import "intl/locale-data/jsonp/en";
import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  Platform,
  Modal,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { UserCredential, sendEmailVerification, updateProfile } from "firebase/auth";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../src/backend/auth-context";
import LoadingScreen from "../../src/components/component-utils/loading-screen";
import ChatFlow, { StepConfig } from "../../src/components/sign-up/chat-flow";
import signUp, { buildDisplayName } from "../../src/services/auth.service";
import { verticalScale, scale, moderateScale } from "@/utils/responsive";
import finishUserSignup from "@/services/finishUserSignup.service";
import { validateAndCleanSignupPayload } from "@/schemas/signupAnswers.schema";
import { FinalSignupPayload } from "@/types/signup.types";
import { parseError } from "@/utils/errorParser";
import Constants from "expo-constants";
import { getTarotCardDraw } from "@/services/tarot-card.service";
import { generateHoroscope, generateHoroscopes } from "@/services/generate-horoscope.service";

// Safe fallback constants
const FALLBACK_PLACE_LABEL = "Greenwich, London, United Kingdom";
const FALLBACK_LAT = 51.4779;
const FALLBACK_LON = 0.0015;

export default function SignUpChatScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { authUser, initializing } = useAuth();

  const [confirmVisible, setConfirmVisible] = useState(false);
  const { width } = useWindowDimensions();
  const modalCardWidth = width > 640 ? "55%" : width > 480 ? "70%" : "86%";
  const [headerHeight, setHeaderHeight] = useState(0);

  const extra =
    (Constants.expoConfig as any)?.extra ??
    (Constants.manifest as any)?.extra;

  if (!extra) {
    throw new Error("❌ Missing Firebase config in Expo extra");
  }

  const USE_EMAIL_VERIFICATION = extra?.USE_EMAIL_VERIFICATION;

  const normalizeBirthdayToISO = (value: any): string => {
    const raw = String(value ?? "").trim();
    // already ISO yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // common US format MM/DD/YYYY
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const mm = m[1].padStart(2, "0");
      const dd = m[2].padStart(2, "0");
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    // last resort: try Date parse
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return raw; // let server validation catch
  };

  const normalizeBirthtimeToHHmm = (value: any): string | null => {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    // already HH:mm or HH:mm:ss
    const hms = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (hms) {
      const hh = hms[1].padStart(2, "0");
      const mm = hms[2];
      return `${hh}:${mm}`;
    }
    // common 12-hour format like 3:05 PM
    const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*([aApP][mM])$/);
    if (ampm) {
      let hh = parseInt(ampm[1], 10);
      const mm = ampm[2];
      const ap = ampm[3].toLowerCase();
      if (ap === "pm" && hh < 12) hh += 12;
      if (ap === "am" && hh === 12) hh = 0;
      return `${String(hh).padStart(2, "0")}:${mm}`;
    }
    return raw.length <= 8 ? raw : null;
  };

  // If already logged in → redirect to main app
  useEffect(() => {
    if (!initializing && authUser) {
      router.replace("/(main)");
    }
  }, [initializing, authUser]);

  // -------------------------
  //     SIGNUP PIPELINE
  // -------------------------

  const handleComplete = async (answers: FinalSignupPayload) => {
    let userCred: UserCredential | null = null;
    answers.birthday = normalizeBirthdayToISO(answers.birthday);
    answers.birthtime = normalizeBirthtimeToHHmm(answers.birthtime);
    console.log("🚀 Signup answers received:", answers);

    // Validate and clean signup payload
    const validation = validateAndCleanSignupPayload(answers);
    if (!validation.ok) {
      console.error("⚠️ Signup validation failed:", validation.errors);
      Alert.alert(
        "Invalid Information",
        "Some of your answers need correction before continuing."
      );
      return;
    }

    const cleaned = validation.data;
    console.log("🚀 Signup answers cleaned:", cleaned);

    try {
      setIsLoading(true);

      const {
        firstName,
        lastName,
        email,
        password,
        placeOfBirth,
      } = cleaned;

      // Always enforce fallback values AFTER validation
      const birthLat = cleaned.birthLat ?? FALLBACK_LAT;
      const birthLon = cleaned.birthLon ?? FALLBACK_LON;
      const safePlaceOfBirth = cleaned.placeOfBirth ?? FALLBACK_PLACE_LABEL;

      const trimmedEmail = String(email ?? "").trim();

      // STEP 1 — Create Auth User
      try {
        userCred = await signUp(trimmedEmail, password);
      } catch (signupErr) {
        const error = parseError(signupErr);
        console.error("❌ Firebase signup failed to Create Auth User:", error);

        Alert.alert("Signup Failed to create Auth User", error.message);
        setIsLoading(false);
        return; // stop pipeline — do not continue to steps 2–4
      }
      const fbUser = userCred.user;
      const uid = fbUser.uid;

      // STEP 2 — Update profile (displayName only)
      const displayName = buildDisplayName(firstName, lastName);

      await updateProfile(fbUser, { displayName });
      console.log("✅ Firebase Auth profile updated:", uid);


      // STEP 4 — Call Cloud Function "finishUserSignup"
      //  Build the server payload explicitly so TS does not try to force it into FinalSignupPayload
      const signupPayloadForServer: FinalSignupPayload = {
        ...cleaned,
        pronouns: cleaned.pronouns ?? "",
        birthtime: cleaned.birthtime ?? null,
        birthTimezone: cleaned.birthTimezone ?? null,
        currentTimezone: cleaned.currentTimezone ?? null,
        email: trimmedEmail,
        birthLat,
        birthLon,
        placeOfBirth: safePlaceOfBirth,
        themeKey: "default",
      };

      // create Firestore user doc using UserRecord
      const response = await finishUserSignup({
        uid,
        displayName,
        ...signupPayloadForServer,
      });

      console.log("✅ Firestore user doc created:", response);

      const cards = await getTarotCardDraw(
        uid,
        3,
      );

      await generateHoroscopes(uid, response.user.risingSign, response.user.sunSign, response.user.moonSign, cards);

      const isEmulator : boolean = extra?.USE_EMULATOR;
      router.replace("/index");
      return;

      // const actionCodeSettings = isEmulator
      //   ? undefined
      //   : {
      //     url: "delaluna://email-verification",
      //     iOS: {
      //       bundleId: "com.delaluna.answers",
      //     },
      //     android: {
      //       packageName: "com.delaluna.answers",
      //       installApp: true,
      //       minimumVersion: "12",
      //     },
      //     handleCodeInApp: true,
      //   };

      // STEP 4 — Email verification (based on toggle)
      // if (USE_EMAIL_VERIFICATION === "true") {
      //   console.log("📧 Email verification enabled — sending email…");
      //
      //   if (isEmulator) {
      //     console.log("⚠️ Auth Emulator detected — skipping sendEmailVerification (deep links unsupported)");
      //     simulateProgress(() => {
      //       router.replace("/index");
      //     });
      //   }
      //   else if (!isEmulator && fbUser != null && !fbUser.emailVerified) {
      //     await sendEmailVerification(fbUser, actionCodeSettings);
      //     // Go to pending screen instead of main
      //     simulateProgress(() => {
      //       router.replace("/verify-email-pending");
      //     });
      //   }
      //
      // } else {
      //   console.log("⚠️ Email verification disabled (DEV MODE) — skipping verification");
      //
      //   router.replace("/index");
      // }

    } catch (err) {
      const error = parseError(err);
      console.error("❌ Signup failed:", error);

      Alert.alert("Signup Error", error.message);
      setIsLoading(false);
    }
  };

  // fake progress animation for smooth loading UI
  const simulateProgress = (onDone: () => void) => {
    let p = 0;
    const interval = setInterval(() => {
      p += 0.25;
      setProgress(p);
      if (p >= 1) {
        clearInterval(interval);
        onDone();
      }
    }, 200);
  };

  const onCancelPress = () => {
    if (step > 0) setConfirmVisible(true);
    else router.replace("/welcome");
  };

  const confirmCancel = () => {
    setConfirmVisible(false);
    router.replace("/welcome");
  };

  if (isLoading || initializing) {
    return <LoadingScreen progress={progress} message="Setting up your stars..." />;
  }

  // UI + CHAT FLOW
  const steps: StepConfig[] = [
    {
      key: "firstName",
      renderQuestion: () =>
        `Hey, I’m glad you’re here! I just need a few quick things.\n\nWhat’s your name?`,
      inputType: "text",
      placeholder: "First name…",
    },
    {
      key: "lastName",
      renderQuestion: (a) =>
        `Alright, ${a.firstName || "[First Name]"}! And your last name?`,
      inputType: "text",
      placeholder: "Last name…",
    },
    {
      key: "pronouns",
      renderQuestion: (a) =>
        `What are your pronouns, ${a.firstName || "[First Name]"}?`,
      inputType: "choices",
      choices: ["She/Her", "He/Him", "They/Them", "Non Binary"],
    },
    {
      key: "birthday",
      renderQuestion: () => `What is your birthdate?`,
      inputType: "date",
    },
    {
      key: "birthtime",
      renderQuestion: () => `Do you know what time you were born?`,
      inputType: "time",
    },
    {
      key: "placeOfBirth",
      renderQuestion: () => `Where were you born?`,
      inputType: "location",
    },
    {
      key: "email",
      renderQuestion: () => `What’s your email?`,
      inputType: "email",
    },
    {
      key: "password",
      renderQuestion: () => `Almost there — create a password.`,
      inputType: "secure",
    },
    {
      key: "final",
      renderQuestion: () => `Your secrets are safe with us 🔐`,
      inputType: "final",
    },
  ];

  return (
    <ImageBackground
      source={require("@/assets/images/main-background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" translucent backgroundColor="transparent" />

          <BlurView intensity={10} tint="dark" style={styles.overlay}>
            {/* HEADER */}
            <View
              style={styles.header}
              onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            >
              {step > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setStep(step - 1);
                  }}
                >
                  <Text style={styles.goBackText}>← Go Back</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <TouchableOpacity onPress={onCancelPress}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* CHAT FLOW */}
            <View style={styles.chatFlowWrapper}>
              <ChatFlow
                steps={steps}
                onComplete={handleComplete}
                step={step}
                setStep={setStep}
                keyboardOffset={headerHeight}
              />
            </View>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>

      {/* CANCEL MODAL */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: modalCardWidth }]}>
            <Text style={styles.modalTitle}>Discard signup?</Text>
            <Text style={styles.modalBody}>
              Your answers will be lost. You can start again anytime.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={[styles.modalBtn, styles.btnGhost]}
              >
                <Text style={styles.btnGhostText}>Keep editing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmCancel}
                style={[styles.modalBtn, styles.btnDanger]}
              >
                <Text style={styles.btnDangerText}>Discard & Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    paddingTop: verticalScale(Platform.OS === "ios" ? 60 : 40),
    paddingHorizontal: scale(4),
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(8),
  },
  goBackText: {
    color: "#6FFFE9",
    fontSize: moderateScale(18),
    fontWeight: "500",
  },
  cancelText: {
    color: "#6FFFE9",
    fontSize: moderateScale(18),
    fontWeight: "500",
  },
  chatFlowWrapper: { flex: 1, width: "100%" },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(12),
  },
  modalCard: {
    borderRadius: scale(14),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: "rgba(20,20,24,0.92)",
    maxWidth: scale(500),
  },
  modalTitle: {
    color: "#fff",
    fontSize: moderateScale(18),
    fontWeight: "700",
    marginBottom: verticalScale(6),
    textAlign: "center",
  },
  modalBody: {
    color: "#cfd3dc",
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: verticalScale(16),
  },
  modalActions: {
    flexDirection: "row",
    gap: scale(12),
    justifyContent: "center",
  },
  modalBtn: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    minWidth: scale(140),
    alignItems: "center",
  },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.08)" },
  btnGhostText: { color: "#e6e9f0", fontWeight: "600" },
  btnDanger: { backgroundColor: "#ff4d4f" },
  btnDangerText: { color: "#fff", fontWeight: "700" },
});
