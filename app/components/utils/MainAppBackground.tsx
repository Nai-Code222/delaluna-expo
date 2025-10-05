// components/GradientBackground.tsx
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GradientBackgroundProps = {
  style?: ViewStyle;
  children?: React.ReactNode;
};

export default function GradientBackground({
  style,
  children,
}: GradientBackgroundProps) {
  return (
    <LinearGradient
      // the three stops from your Figma
      colors={['#2D1B42', '#3B235A', '#5A3E85']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,          // fill its parent
  },
});
// This is a reusable gradient background component that can be used in various parts of the app.