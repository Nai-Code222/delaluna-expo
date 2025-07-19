// app/home/_layout.tsx
import React from 'react'
import { Tabs } from 'expo-router'
import { Image, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeLayout() {
  const insets = useSafeAreaInsets()
  // define your two base heights
  const IOS_TABBAR_BASE_HEIGHT = 40
  const ANDROID_TABBAR_BASE_HEIGHT = 60

  // pick the right one & compute padding
  const isIOS = Platform.OS === 'ios'
  const baseHeight = isIOS
    ? IOS_TABBAR_BASE_HEIGHT + insets.bottom
    : ANDROID_TABBAR_BASE_HEIGHT
  const paddingBottom = isIOS ? insets.bottom : 8
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#513877',
          borderTopColor: 'transparent',
          height: baseHeight,
          paddingBottom,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#BCA8F4',
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
})
