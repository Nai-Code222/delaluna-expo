// app/home/_layout.tsx
import React, { useContext, useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Image, ImageBackground, StyleSheet, Platform, View, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '@/app/ThemeContext'; // ← match file case/path
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(ThemeContext);

  const IOS_TABBAR_BASE_HEIGHT = 40;
  const ANDROID_TABBAR_BASE_HEIGHT = 60;
  const isIOS = Platform.OS === 'ios';
  const baseHeight = isIOS ? IOS_TABBAR_BASE_HEIGHT + insets.bottom : ANDROID_TABBAR_BASE_HEIGHT;
  const paddingBottom = isIOS ? insets.bottom : 8;

  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [theme]);

  function renderBackground(children: React.ReactNode) {
    const content = <Animated.View style={[styles.fill, { opacity: fade }]}>{children}</Animated.View>;

    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground source={theme.backgroundImage} style={styles.fill} resizeMode="cover">
          {content}
        </ImageBackground>
      );
    }
    if (theme.backgroundType === 'gradient' && theme.gradient) {
      const angle = theme.gradient.angle ?? 0;
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: Math.cos((angle * Math.PI) / 180), y: Math.sin((angle * Math.PI) / 180) }}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      );
    }
    return <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>{content}</View>;
  }

  return renderBackground(
    <Tabs
      screenOptions={{
        headerShown: false,
        // ✅ This one is supported on your Tabs type
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: {
          backgroundColor: theme.colors.headerBg,
          borderTopColor: 'transparent',
          height: baseHeight,
          paddingBottom,
        },
        tabBarActiveTintColor: theme.colors.activeTab,
        tabBarInactiveTintColor: theme.colors.inactiveTabs,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/icons/home.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/icons/connections.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="transits"
        options={{
          title: 'Transits',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/icons/transits.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('../assets/icons/chat.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { resizeMode: 'contain' },
  fill: { flex: 1 },
});
