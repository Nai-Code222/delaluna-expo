// profile screen
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useAuth } from '@/app/backend/AuthContext'
import { router } from 'expo-router'
import HeaderNav from '../components/headerNav'
import { auth } from '../../firebaseConfig'
import { signOut } from 'firebase/auth'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import LoadingScreen from '@/app/components/utils/LoadingScreen'
import AlertModal from '@/app/components/alerts/AlertModal'

export default function ProfileScreen() {
  const { user, initializing } = useAuth()
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (initializing) return
    if (!user) {
      router.replace('/welcome')
    }
  }, [user, initializing])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.replace('/welcome')
    } catch (error) {
      setErrorMessage('Logout failed. Please try again.')
      setShowErrorModal(true)
    }
  }

  if (initializing) {
    return <LoadingScreen message="Loading profile..." progress={0} />
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNav title="Profile" onAvatarPress={() => {}} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#513877', '#6A4C93']}
          style={[styles.gradient, { paddingTop: insets.top }]}
        >
          <BlurView intensity={50} style={styles.blurContainer}>
            <Text style={styles.username}>{user?.email}</Text>
          </BlurView>
        </LinearGradient>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
      <AlertModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#513877',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  blurContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    padding: 20,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff4757',
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})