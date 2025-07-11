// app/login.tsx
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
  Platform,
} from 'react-native'
import { auth } from '../firebaseConfig'
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import '../firebaseConfig'
import SecondaryButtonComponent from '@/app/components/buttons/secondaryButtonComponent'
import { router, useRouter } from 'expo-router'
import AlertModal from '@/app/components/alerts/AlertModal'
import LoadingScreen from '@/app/components/utils/LoadingScreen'
import { useAuth } from '@/app/backend/AuthContext';


export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { user, initializing } = useAuth();
  const router = useRouter();


useEffect(() => {
  if (!initializing && user) {
    router.replace('/home');
  }
}, [initializing, user]);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCheckingAuth(false);
      if (user) {
        router.replace('/home');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (initializing) return <LoadingScreen message="Initializing..." progress={0} />;

  const handleLogin = async () => {

    try {
      await signInWithEmailAndPassword(auth, email, password)
      setLoginAttempts(0);
      router.push('/home')
    } catch (error: any) {
      const msg = 
      error.code === 'auth/invalid-email'   ? 'That email looks wrong.'
    : error.code === 'auth/user-not-found'   ? 'No account for that email.'
    : error.code === 'auth/wrong-password'   ? 'Password incorrect.' : 'Something went wrong—please try again.';

      
      setLoginAttempts(prev => prev + 1);
      if (loginAttempts < 3) {
        setErrorMessage(error.message);
        setShowErrorModal(true);
      } 
      else  if (loginAttempts >= 3) {
        Alert.alert(
          'Forgot Password?',
          'It seems you are having trouble logging in. Would you like to reset your password?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Reset Password',
              onPress: () => router.push('/screens/forgotPassword.screen'),
            },
          ]
        )
      }
    }
  }

  return (
    <ImageBackground
      source={require('../app/assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >

      <AlertModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

      {/* 1) Logo Container */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../app/assets/images/delaluna_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <BlurView intensity={90} tint="dark" style={styles.card}>
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
            <Text style={styles.welcomeText}>Welcome!</Text>
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
                <Text style={styles.forgotPassword} onPress={() => router.push('/screens/forgotPassword.screen')}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <SecondaryButtonComponent
              title="Not a member? "
              linkString='Sign up'
              onPress={() => router.push('/signup')}
            />
          </View>
        </LinearGradient>
      </BlurView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
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
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
      },
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.24)',
        borderRadius: 20,
      },
    }),
    gap: 25,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  logo: {
    width: '70%',
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
    fontFamily: 'Poppins',
    ...Platform.select({
      ios: {
        fontSize: 40,
      },
      android: {
        fontSize: 30,
      },
    }),
    fontWeight: '500',
    marginBottom: 24,
  },
  form: {
    width: '90%',
  },
  textField: {
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    }),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.6)',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    color: 'white',
  },
  input: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  forgotPassword: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    textAlign: 'right',
    margin: 8,
  },
  loginButton: {
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 40,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        marginTop: 10,
      },
      android: {
        marginTop: 20,
      },
    }),

  },
  loginButtonText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
})
