// app/login.tsx
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
} from 'react-native'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import '../firebaseConfig' // Ensure you have initialized Firebase in this file
import SecondaryButtonComponent from '@/components/buttons/secondaryButtonComponent'
import { router } from 'expo-router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const auth = getAuth()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      Alert.alert('Success', 'You are logged in!')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <ImageBackground
      source={require('../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* 1) Logo Container */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/delaluna_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <BlurView intensity={80} tint="dark" style={styles.card}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.05)',
            'rgba(128,128,128,0.05)',
            'rgba(0,0,0,0.05)',
          ]}
          locations={[0, 0.49, 1]}
          start={[0, 0]}
          end={[0, 1]}
          style={StyleSheet.absoluteFillObject}
        >
          <View style={styles.bodyContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <View style={styles.form}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                style={styles.textField}
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                style={styles.textField}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <SecondaryButtonComponent
              title="Not a member? "
              linkString='Signup'
              onPress={() => router.push('/signup')}
            />
          </View>
        </LinearGradient>
      </BlurView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  // Styles remain unchanged
  background: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: '#2D1B42',
    justifyContent: 'space-between',
    gap: 35,
  },
  logoContainer: {
    flex: 1,
    width: '100%',
    height: '60%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.44)',
    borderRadius: 25,
    gap: 25,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  logo: {
    width: '90%',
    height: '50%',
  },
  bodyContainer: {
    width: '100%',
    marginTop: 24,
    marginBottom: 24,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  welcomeText: {
    color: 'white',
    fontSize: 48,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 24,
  },
  form: {
    width: '90%',
  },
  textField: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.6)',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  forgotPassword: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    textAlign: 'right',
  },
  loginButton: {
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 40,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
})
