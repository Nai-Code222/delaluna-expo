import { scale } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons"; 
import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
} from "react-native";

export type PasswordInputFieldProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  togglePercent?: number; // 0..1 (default 0.25)
};

const PasswordInputField = forwardRef<TextInput, PasswordInputFieldProps>(
  (
    { containerStyle, style, inputStyle, secureTextEntry, togglePercent = 0.25, ...rest },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const [toggleW, setToggleW] = useState(0);

    const onToggleLayout = (e: LayoutChangeEvent) => {
      if (toggleW === 0) setToggleW(e.nativeEvent.layout.width);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        <View style={[styles.field, style]}>
          {/* Text input */}
          <TextInput
            ref={ref}
            {...rest}
            secureTextEntry={secureTextEntry ?? !visible}
            style={[
              styles.input,
              inputStyle,
              { paddingRight: Math.max(toggleW, 50) + 10 },
            ]}
            multiline={false}
            numberOfLines={1}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* Toggle icon */}
          <TouchableOpacity
            onLayout={onToggleLayout}
            activeOpacity={0.7}
            style={[
              styles.toggleWrap,
              {
                width: `${Math.min(Math.max(togglePercent, 0.15), 0.4) * 100}%`,
              },
            ]}
            onPressIn={() => setVisible((v) => !v)} // Prevent losing focus
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={visible ? "eye" : "eye-off"}
              size={scale(20)}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

PasswordInputField.displayName = "PasswordInputField";
export default PasswordInputField;

const styles = StyleSheet.create({
  container: { width: "100%" },
  field: {
    position: "relative",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(142, 68, 173, 0.6)",
    justifyContent: "center",
  },
  input: {
    color: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  toggleWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
