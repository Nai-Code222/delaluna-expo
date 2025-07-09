import React, { useContext, useEffect } from 'react'
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { auth } from '../../firebaseConfig'
import { signOut } from 'firebase/auth'
import { router } from 'expo-router'
import AuthContext from '@/app/backend/AuthContext'


const HomeScreen: React.FC = () => {
  const { user, initializing } = useContext(AuthContext)

  useEffect(() => {
    if (!initializing && !user) {
      router.replace('/welcome')
    }
  }, [user, initializing])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (initializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ImageBackground
      source={require('../assets/images/mainBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >

      <SafeAreaView style={styles.headerNav}>
        <Text style={styles.headerTitle}>Home</Text>
       
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Home!</Text>
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
  headerNav: {
    width: '100%',
    height: 60,
    backgroundColor: '#513877',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
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

export default HomeScreen
