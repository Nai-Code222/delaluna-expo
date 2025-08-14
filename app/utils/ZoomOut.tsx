import React, { useEffect, useState } from 'react';
import {
  View, useWindowDimensions, Platform, Keyboard, Dimensions, LayoutAnimation, StyleProp, ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  baseWidth: number;     // e.g. 390 for iPhone 14 width
  baseHeight: number;    // e.g. 780 total content height you designed for
  minScale?: number;     // clamp so text/taps stay usable (0.85 is safe)
  keyboardAwareIOS?: boolean; // shrink a bit when iOS keyboard shows
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export default function ZoomOut({
  baseWidth,
  baseHeight,
  minScale = 0.85,
  keyboardAwareIOS = true,
  style,
  children,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [kb, setKb] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !keyboardAwareIOS) return;
    const screenH = Dimensions.get('screen').height;

    const onChange = (e: any) => {
      const endY = e.endCoordinates?.screenY ?? screenH;
      const kbHeight = Math.max(0, screenH - endY);
      const pad = Math.max(0, kbHeight - insets.bottom); // avoid double-counting home indicator
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKb(pad);
    };

    const sub = Keyboard.addListener('keyboardWillChangeFrame', onChange);
    return () => sub.remove();
  }, [insets.bottom, keyboardAwareIOS]);

  const availW = Math.max(0, width - insets.left - insets.right);
  const availH = Math.max(0, height - insets.top - insets.bottom - kb);

  const scale = Math.max(minScale, Math.min(1, availW / baseWidth, availH / baseHeight));

  return (
    <SafeAreaView style={[{ flex: 1 }, style]} edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: baseWidth, height: baseHeight, transform: [{ scale }] }}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}
