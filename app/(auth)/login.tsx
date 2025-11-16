// app/login.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getFirestore, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { StatusBar } from 'expo-status-bar';
import { DateTime } from 'luxon';

import { useAuth } from '../../src/backend/auth-context';
import SecondaryButtonComponent from '../../src/components/buttons/secondary-button-component';
import LoadingScreen from '../../src/components/component-utils/loading-screen';

// ⭐ UPDATED PASSWORD INPUT
import DelalunaPasswordInput from '../../src/components/component-utils/password-input-field';

import { updateUserDoc } from '../../src/services/user.service';
import { ThemeContext } from '../theme-context';
import { verticalScale } from '@/utils/responsive';
import { auth } from '../../firebaseConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false);

  const { user, initializing } = useAuth();
  const router = useRouter();
  const { setThemeKey } = useContext(ThemeContext);
  const db = getFirestore();

  // ⭐ This ref is used by the NEXT button from Email
  const passwordRef = useRef<TextInput>(null);

  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  // Track keyboard visibility for KAV
  const [kbVisible, setKbVisible] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const s1 = Keyboard.addListener(showEvt, () => setKbVisible(true));
    const s2 = Keyboard.addListener(hideEvt, () => setKbVisible(false));

    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  useEffect(() => {
    if (!skipAutoRedirect && !initializing && user) {
      router.replace('/');
    }
  }, [initializing, user, skipAutoRedirect]);

  if (initializing)
    return <LoadingScreen message="Initializing..." progress={0} />;

  const resolveThemeBeforeNavigate = async (uid: string): Promise<string> => {
    const fetchFromFirestore = async () => {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() && snap.data().themeKey
        ? String(snap.data().themeKey)
        : 'default';
    };

    const timeoutMs = 3000;

    return Promise.race<string>([
      fetchFromFirestore(),
      new Promise<string>(async (resolve) => {
        setTimeout(async () => {
          const cached = (await AsyncStorage.getItem('themeKey')) || 'default';
          resolve(cached);
        }, timeoutMs);
      }),
    ]);
  };

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() && !password.trim()) {
      return Alert.alert('Invalid Login', 'Email and password are required.');
    }
    if (!email.trim()) {
      return Alert.alert('Invalid Login', 'Please enter your email.');
    }
    if (!password.trim()) {
      return Alert.alert('Invalid Login', 'Please enter your password.');
    }

    try {
      setLoading(true);
      setSkipAutoRedirect(true);

      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );

      const uid = cred.user.uid;
      const nowUtc = DateTime.utc();

      await updateUserDoc(uid, {
        lastLoginDate: nowUtc.toFormat('MM/dd/yyyy hh:mm:ss a ZZZZ'),
        lastLoginAt: serverTimestamp(),
      });

      const key = await resolveThemeBeforeNavigate(uid);
      await Promise.resolve(setThemeKey(key));

      router.replace('/(main)');
    } catch (e: any) {
      const invalidCredCodes = new Set([
        'auth/invalid-credential',
        'auth/invalid-login-credentials',
        'auth/wrong-password',
        'auth/invalid-password',
        'auth/user-not-found',
        'auth/invalid-email',
      ]);

      if (invalidCredCodes.has(e?.code)) {
        Alert.alert('Login failed', 'Incorrect email or password.');
      } else {
        Alert.alert('Login failed', e?.message ?? 'Login failed.');
      }
    } finally {
      setLoading(false);
      setSkipAutoRedirect(false);
    }
  };

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={kbVisible && Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ImageBackground
          source={require('@/assets/images/background.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={{ flex: 1 }}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/delaluna_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <BlurView
            intensity={90}
            tint="dark"
            style={[
              styles.card,
              kbVisible ? { flexGrow: 2 } : { flexGrow: 1 }
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.05)',
                'rgba(128,128,128,0.05)',
                'rgba(0,0,0,0.05)',
              ]}
              locations={[0, 0.49, 1]}
              style={StyleSheet.absoluteFillObject}
            >
              <View style={styles.bodyContainer}>

                <View style={styles.form}>
                  {/* EMAIL */}
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    style={styles.textField}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />

                  {/* PASSWORD */}
                  <DelalunaPasswordInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    returnKeyType="done"
                    blurOnSubmit={false}
                    onSubmitEditing={handleLogin}
                  />

                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={() =>
                      router.replace('/(supporting)/forgot-password.screen')
                    }
                  >
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && { opacity: 0.6 }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing in…' : 'Login'}
                  </Text>
                </TouchableOpacity>

                <SecondaryButtonComponent
                  title="Not a member? "
                  linkString="Sign up"
                  onPress={() => router.replace('/(auth)/sign-up')}
                />
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create(
  {
    background: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoContainer: { flex: 1, width: '100%', height: '60%', alignItems: 'center', justifyContent: 'flex-end', },
    card: { width: '100%', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 25, paddingHorizontal: 10, paddingVertical: 15, justifyContent: 'space-between', },
    logo: { width: '70%', height: '65%' },
    bodyContainer: { width: '100%', marginTop: 85, marginBottom: 20, alignItems: 'center', flex: 1, justifyContent: 'space-between', gap: 15, },
    form: { width: '90%', height: 45, justifyContent: 'center', gap: 5, marginTop: 25, },
    textField: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(142,68,173,0.6)', marginBottom: 16, paddingHorizontal: 16, height: 48, color: 'white', },
    forgotPassword: { color: 'white', fontSize: 13, fontFamily: 'Inter', fontWeight: '600', textAlign: 'right', margin: 10, },
    forgotPasswordButton: { alignSelf: 'flex-end', }, loginButton: { width: '80%', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 40, paddingVertical: 15, justifyContent: 'center', alignItems: 'center', marginTop: verticalScale(Platform.OS === 'ios' ? 35 : 40), },
    loginButtonText: { color: 'white', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600', }
  }
);
