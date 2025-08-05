// screens/HomeScreen.tsx
import 'react-native-gesture-handler'; 
import 'expo-router/entry';
import React, { useContext, useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Platform,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { auth } from '../../firebaseConfig'
import { router } from 'expo-router'
import AuthContext from '@/app/backend/AuthContext'
import HeaderNav from '../components/headerNav'
import ProfileScreen from '../screens/profile.screen'
import { ThemeContext } from '../themecontext';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user, initializing } = useContext(AuthContext)
  const insets = useSafeAreaInsets()
  const safeOffset = Platform.OS === 'android'
    ? StatusBar.currentHeight || 0
    : insets.top
  const HEADER_HEIGHT = 50;
  const { theme } = useContext(ThemeContext);


  useEffect(() => {
    if (!initializing && !user) {
      router.replace('/welcome')
    }
  }, [user, initializing])

  if (initializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  function goToProfile(): void {
    router.replace('/screens/profile.screen')
  }

  // Helper to render background using theme
  function renderBackground(children: React.ReactNode) {
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={styles.background}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      );
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
          style={styles.background}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View style={[styles.background, { backgroundColor: theme.colors.background }]}>
        {children}
      </View>
    );
  }

  return renderBackground(
    <View style={styles.container}>
      <HeaderNav
        title="Home"
        leftIconName={undefined}
        onLeftPress={() => {}}
        rightIconSource={require('../assets/icons/Avatar.png')}
        onRightPress={goToProfile}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Home!</Text>
        <Text style={styles.email}>
          {user
            ? `Logged in as: ${user.email}`
            : 'No user logged in.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 24, marginBottom: 8, color: '#fff' },
  email: { fontSize: 16, marginBottom: 20, color: '#ddd' },
})

