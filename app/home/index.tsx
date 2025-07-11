// screens/HomeScreen.tsx

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
import { auth } from '../../firebaseConfig'
import { signOut } from 'firebase/auth'
import { router } from 'expo-router'
import AuthContext from '@/app/backend/AuthContext'
import HeaderNav from '../components/headerNav'

export default function HomeScreen() { 
  const { user, initializing } = useContext(AuthContext)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!initializing && !user) {
      router.replace('/welcome')
    }
  }, [user, initializing])

  const goToProfile = () => {
    setMenuOpen(false)
    router.push('/screens/profile.screen')
  }

  if (initializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Calculate dropdown top offset: safe-area + header height
  const safeAreaOffset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
  const headerHeight = 56  // same as HeaderNav.container height

  return (
    <ImageBackground
      source={require('../assets/images/mainBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Reusable HeaderNav */}
      <HeaderNav
        title="Home"
        onAvatarPress={() => goToProfile()}
      />

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome home!</Text>
        <Text style={styles.email}>
          {user ? `Logged in as: ${user.email}` : 'No user logged in.'}
        </Text>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    right: 16,
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
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
});
