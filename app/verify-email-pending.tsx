import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getAuth, reload, sendEmailVerification } from "firebase/auth";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function VerifyEmailPendingScreen() {
  const router = useRouter();
  const auth = getAuth();

  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const user = auth.currentUser;
  const email = user?.email ?? "your email";

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        setChecking(true);
        await reload(auth.currentUser!);
        setChecking(false);

        if (auth.currentUser?.emailVerified) {
          router.replace("/email-verified-success");
        }
      } catch (err) {
        setChecking(false);
      }
    }, 5000);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, []);

  const resendEmail = async () => {
    if (!user) return;
    setResending(true);

    try {
      await sendEmailVerification(user, {
        url: "delaluna://email-verification",
        handleCodeInApp: true,
        iOS: { bundleId: "com.delaluna.answers" },
        android: { packageName: "com.delaluna.answers", installApp: true, minimumVersion: "12" }
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <LinearGradient
        colors={["#0a0a0f", "#1c1c29", "#3a3a55"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SafeAreaView style={styles.container}>
          <LottieView
            source={require('@/assets/animations/galaxy.json')}
            autoPlay
            loop={false}
            style={{ width: 180, height: 180, marginBottom: 10 }}
          />
          <Text style={styles.header}>Check Your Email ✉️</Text>
          <Text style={styles.sub}>
            I’ve sent a verification link to{" "}
            <Text style={styles.email}>{email}</Text>.
          </Text>

          <Text style={styles.sub}>
            Tap the link in your inbox to verify your account.
          </Text>

          <ActivityIndicator size="large" color="#6FFFE9" style={{ marginTop: 30 }} />

          <Text style={styles.checking}>
            {checking ? "Checking verification..." : "Waiting for verification…"}
          </Text>

          <TouchableOpacity
            onPress={resendEmail}
            disabled={resending}
            style={styles.resendBtn}
          >
            <Text style={styles.resendText}>
              {resending ? "Resending…" : "Resend Verification Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/login")} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  header: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 14,
  },
  sub: {
    fontSize: 15,
    color: "#cfcfcf",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  email: {
    color: "#6FFFE9",
    fontWeight: "700",
  },
  checking: {
    color: "#999",
    marginTop: 20,
  },
  resendBtn: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  resendText: {
    color: "#6FFFE9",
    fontSize: 15,
    fontWeight: "600",
  },
  backToLogin: {
    marginTop: 20,
  },
  backToLoginText: {
    color: "#cfcfcf",
    fontSize: 14,
  },
  loginButton: {
    marginTop: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  loginButtonText: {
    color: "#6FFFE9",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});