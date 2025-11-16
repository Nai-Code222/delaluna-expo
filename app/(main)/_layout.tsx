// app/home/_layout.tsx
import React, { useContext, useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Image, ImageBackground, StyleSheet, Platform, View, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme-context';
import useRenderBackground from '@/hooks/useRenderBackground';


export default function HomeLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useContext(ThemeContext);

  const IOS_TABBAR_BASE_HEIGHT = 40;
  const ANDROID_TABBAR_BASE_HEIGHT = 60;
  const isIOS = Platform.OS === 'ios';
  const baseHeight = isIOS ? IOS_TABBAR_BASE_HEIGHT + insets.bottom : ANDROID_TABBAR_BASE_HEIGHT;
  const paddingBottom = isIOS ? insets.bottom : 8;
  const renderBackground = useRenderBackground();
  const fade = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [theme]);

  return renderBackground(
    <Tabs
      screenOptions={{
        headerShown: false,
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
            <Image source={require('@/assets/icons/home.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('@/assets/icons/connections.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="transits"
        options={{
          title: 'Transits',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('@/assets/icons/transits.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Image source={require('@/assets/icons/chat.png')} style={[styles.icon, { tintColor: color, width: size, height: size }]} />
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
