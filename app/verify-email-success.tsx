import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function EmailVerifiedSuccessScreen() {
  const router = useRouter();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2500);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(timer);
  }, []);

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
          <Text style={styles.header}>✨ Email Verified!</Text>
          <Text style={styles.sub}>
            Your Delaluna account is officially confirmed.
          </Text>

          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          <Text style={styles.redirect}>Redirecting to login…</Text>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  header: {
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
    marginBottom: 14,
    fontWeight: "600",
  },
  sub: {
    fontSize: 16,
    color: "#cfcfcf",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  redirect: {
    marginTop: 20,
    color: "#999",
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