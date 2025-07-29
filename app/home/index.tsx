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
import { getAuth, signOut } from 'firebase/auth'
import { router } from 'expo-router'
import AuthContext from '@/app/backend/AuthContext'
import HeaderNav from '../components/headerNav'
import ProfileScreen from '../screens/profile.screen'

export default function HomeScreen() {
  const { user, initializing } = useContext(AuthContext)
  const insets = useSafeAreaInsets()
  const safeOffset = Platform.OS === 'android'
    ? StatusBar.currentHeight || 0
    : insets.top
  const HEADER_HEIGHT = 50


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
    //console.log("User: ", getAuth().currentUser?.uid);
    //router.replace('/screens/profile.screen')
    signOut(auth)
    router.replace('/welcome')
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/mainBackground.png')}
        style={styles.background}
        resizeMode="cover"
      >
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
      </ImageBackground>
    </View>
  )
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

