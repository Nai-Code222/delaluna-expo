// components/PrimaryButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { BlurView }          from 'expo-blur';
import { LinearGradient }    from 'expo-linear-gradient';

interface Props extends TouchableOpacityProps {
  title: string;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({
  title,
  onPress,
  style,
  ...rest
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.wrapper, style]}
      {...rest}
    >
      {/* 1px gradient border (Figma stops 0%, 54%, 100%) */}
      <LinearGradient
        colors={[
          'rgba(255,255,255)',    // 0% white
          'rgba(255, 255, 255, 0)'  // 100% 77% white
        ]}
        style={styles.border}
      >
        {/* Frosted glass panel */}
        <BlurView intensity={20} tint="dark" style={styles.glass}>
          {/* Diagonal white→transparent fill (0%→100%) */}
          <LinearGradient
            colors={[
              'rgba(255,255,255)',    // 0% white
              'rgb(255, 255, 255)'  // 100% 77% white
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.text}>{title.toUpperCase()}</Text>
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create<{
  wrapper: ViewStyle;
  border:  ViewStyle;
  glass:   ViewStyle;
  text:    TextStyle;
}>({
  wrapper: {
    width: 327,
    height: 54,
    borderRadius: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  border: {
    flex: 1,
    borderRadius: 40,
    padding: StyleSheet.hairlineWidth, // exactly 1 physical pixel
    overflow: 'hidden',
  },
  glass: {
    flex: 1,
    borderRadius: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
