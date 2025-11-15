import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "@/src/utils/responsive";

export type DelalunaPasswordInputProps = TextInputProps & {
  containerStyle?: object;
  inputStyle?: object;
  iconSize?: number;
};

const DelalunaPasswordInput = forwardRef<TextInput, DelalunaPasswordInputProps>(
  (
    {
      containerStyle,
      inputStyle,
      secureTextEntry,
      iconSize = scale(20),
      ...rest
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);

    // animated fade between icons
    const opacityAnim = new Animated.Value(1);

    const toggleVisibility = () => {
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setVisible((v) => !v);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        <View style={styles.field}>
          <TextInput
            ref={ref}
            {...rest}
            secureTextEntry={secureTextEntry ?? !visible}
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.input, inputStyle, { paddingRight: 55 }]} // ← fixed padding to avoid jump
          />

          {/* Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleVisibility}
            onPressIn={() => {}} // prevents blur
            style={styles.iconContainer}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ opacity: opacityAnim }}>
              <Ionicons
                name={visible ? "eye" : "eye-off"}
                size={iconSize}
                color="#FFFFFF"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

DelalunaPasswordInput.displayName = "DelalunaPasswordInput";

export default DelalunaPasswordInput;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  field: {
    position: "relative",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(142, 68, 173, 0.6)",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    color: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  iconContainer: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    width: 40, /// ← FIXED WIDTH (no movement / no jump)
    justifyContent: "center",
    alignItems: "center",
  },
});
