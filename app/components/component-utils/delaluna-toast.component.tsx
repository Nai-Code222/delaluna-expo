import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, Text, View, StyleSheet, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * 💫 Context-based global toast system
 * Usage:
 *   const { showToast } = useDelalunaToast();
 *   showToast("✅ Connection saved!");
 */

const ToastContext = createContext<{ showToast: (message: string) => void }>({
  showToast: () => {},
});

export const DelalunaToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setMessage(msg);
    setVisible(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
              ],
            },
          ]}
        >
          <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.toastGradient}>
            <Text style={styles.toastText}>{message}</Text>
          </LinearGradient>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useDelalunaToast = () => useContext(ToastContext);

/* 🎨 Styles */
const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: "48%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
    elevation: 10,
  },
  toastGradient: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 50,
    shadowColor: "#fff",
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  toastText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.4,
  },
});
