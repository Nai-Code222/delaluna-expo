import React, { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  moveFraction?: number; // how much of the screen moves (0–1)
}

/**
 * ResponsiveKeyboardWrapper
 * Smoothly animates content up/down when keyboard appears,
 * preventing harsh jumps while keeping top layout intact.
 */
export default function ResponsiveKeyboardWrapper({
  children,
  style,
  backgroundColor = "#2D1B42",
  moveFraction = 0.3,
}: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const height = e?.endCoordinates?.height ?? 0;
      setKeyboardHeight(height);
      Animated.timing(translateAnim, {
        toValue: -height * moveFraction,
        duration: Platform.OS === "ios" ? 250 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const onHide = () => {
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvt, onShow);
    const hideSub = Keyboard.addListener(hideEvt, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [moveFraction, translateAnim]);

  const keyboardVerticalOffset =
    Platform.OS === "ios" ? insets.top : 0;

  return (
    <KeyboardAvoidingView
      style={[
        styles.fill,
        { backgroundColor },
        style,
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <Animated.View
        style={[
          styles.fill,
          { transform: [{ translateY: translateAnim }] },
        ]}
      >
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
