// app/home/_layout.tsx
import React, { useContext } from 'react'
import { Tabs } from 'expo-router'
import { Image, ImageBackground, StyleSheet, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeContext } from '../themecontext'
import { LinearGradient } from 'expo-linear-gradient'

export default function HomeLayout() {
  const insets = useSafeAreaInsets()
  const { theme } = useContext(ThemeContext)
  const IOS_TABBAR_BASE_HEIGHT = 40
  const ANDROID_TABBAR_BASE_HEIGHT = 60
  const isIOS = Platform.OS === 'ios'
  const baseHeight = isIOS
    ? IOS_TABBAR_BASE_HEIGHT + insets.bottom
    : ANDROID_TABBAR_BASE_HEIGHT
  const paddingBottom = isIOS ? insets.bottom : 8

  // Helper to render background
  function renderBackground(children: React.ReactNode) {
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={styles.absoluteFill}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      )
    }
    if (theme.backgroundType === 'gradient' && theme.gradient) {
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{
            x: Math.cos((theme.gradient.angle ?? 0) * Math.PI / 180),
            y: Math.sin((theme.gradient.angle ?? 0) * Math.PI / 180),
          }}
          style={styles.absoluteFill}
        >
          {children}
        </LinearGradient>
      )
    }
    return (
      <View style={[styles.absoluteFill, { backgroundColor: theme.colors.background }]}>
        {children}
      </View>
    )
  }

  return renderBackground(
    <Tabs
      screenOptions={{
        headerShown: false,
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
            <Image
              source={require('../assets/icons/home.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/icons/connections.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transits"
        options={{
          title: 'Transits',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/icons/transits.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/icons/chat.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  icon: {
    resizeMode: 'contain',
  },
  absoluteFill: {
    flex: 1,
  },
})
