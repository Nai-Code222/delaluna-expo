// app/utils/ZoomOut.tsx
import React, { useEffect, useState } from 'react';
import {
  View, useWindowDimensions, Platform, Keyboard, Dimensions, LayoutAnimation,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type FitMode = 'contain' | 'width' | 'height';

type Props = {
  baseWidth: number;
  baseHeight: number;
  minScale?: number;           // e.g., 0.87
  maxScale?: number;           // NEW: allow upscale on large screens, e.g., 1.12
  keyboardAwareIOS?: boolean;
  fit?: FitMode;               // 'width' removes side slivers on small screens
  gutter?: number;             // NEW: horizontal safe-area padding (px), e.g., 16
  children: React.ReactNode;
};

export default function ZoomOut({
  baseWidth,
  baseHeight,
  minScale = 0.87,
  maxScale = 1,               // default keeps previous behavior (no upscale)
  keyboardAwareIOS = true,
  fit = 'contain',
  gutter = 0,
  children,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [kb, setKb] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !keyboardAwareIOS) return;
    const screenH = Dimensions.get('screen').height;
    const onChange = (e: any) => {
      const endY = e?.endCoordinates?.screenY ?? screenH;
      const kbHeight = Math.max(0, screenH - endY);
      const pad = Math.max(0, kbHeight - insets.bottom);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKb(pad);
    };
    const sub = Keyboard.addListener('keyboardWillChangeFrame', onChange);
    return () => sub.remove();
  }, [insets.bottom, keyboardAwareIOS]);

  // respect safe areas + optional keyboard + horizontal gutters
  const availW = Math.max(0, width - insets.left - insets.right - gutter * 2);
  const availH = Math.max(0, height - insets.top - insets.bottom - kb);

  const sW = availW / baseWidth;
  const sH = availH / baseHeight;

  // base scale by fit mode (without clamping)
  let desired =
    fit === 'width'  ? sW :
    fit === 'height' ? sH :
    Math.min(sW, sH);

  // if width-fit would overflow vertically, fall back to contain
  if (fit === 'width'  && baseHeight * desired > availH) desired = Math.min(sW, sH);
  if (fit === 'height' && baseWidth  * desired > availW) desired = Math.min(sW, sH);

  // final clamp: allow upscale up to maxScale, and never below minScale
  const scale = Math.min(Math.max(desired, minScale), maxScale);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter }}>
        <View style={{ width: baseWidth, height: baseHeight, transform: [{ scale }] }}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}
