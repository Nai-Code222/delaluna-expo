// src/components/alerts/confirm-dialog.tsx
import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function ConfirmDialog({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <BlurView intensity={45} tint="dark" style={styles.blurWrapper}>
            <LinearGradient
              colors={["#6a11cb", "#2575fc"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <Pressable style={[styles.button, styles.stayButton]} onPress={onCancel}>
                  <Text style={styles.stayText}>Stay</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.discardButton]}
                  onPress={onConfirm}
                >
                  <Text style={styles.discardText}>Discard</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialogContainer: {
    width: "78%",
    borderRadius: 22,
    overflow: "hidden",
  },
  blurWrapper: {
    borderRadius: 22,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 50,
    alignItems: "center",
  },
  stayButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  discardButton: {
    backgroundColor: "rgba(255,0,72,0.9)",
  },
  stayText: {
    color: "#1C2541",
    fontWeight: "700",
    fontSize: 15,
  },
  discardText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
