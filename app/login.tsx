// app/login.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Image, KeyboardAvoidingView, Platform, Keyboard, Alert,
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import SecondaryButtonComponent from '@/app/components/buttons/secondaryButtonComponent';
import { useRouter } from 'expo-router';
import LoadingScreen from '@/app/components/utils/LoadingScreen';
import { useAuth } from '@/app/backend/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from './themecontext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false); // prevents race with useAuth redirect

  const { user, initializing } = useAuth();
  const router = useRouter();
  const { setThemeKey } = useContext(ThemeContext);
  const db = getFirestore();
  const passwordRef = React.useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight(); // unconditionally call the hook
  const KVO = headerHeight || insets.top; // offset for iOS

  // Track keyboard visibility
  const [kbVisible, setKbVisible] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvt, () => setKbVisible(true));
    const s2 = Keyboard.addListener(hideEvt, () => setKbVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  // Only auto-redirect if we're NOT in the middle of our controlled login flow
  useEffect(() => {
    if (!skipAutoRedirect && !initializing && user) {
      router.replace('/home');
    }
  }, [initializing, user, skipAutoRedirect]);

  if (initializing) return <LoadingScreen message="Initializing..." progress={0} />;

  // Fetch user's theme with a timeout, falling back to locally-cached theme
  const resolveThemeBeforeNavigate = async (uid: string): Promise<string> => {
    const fetchFromFirestore = async () => {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() && snap.data().themeKey ? String(snap.data().themeKey) : 'default';
    };

    // race Firestore against a timeout
    const timeoutMs = 3000;
    const themeKey = await Promise.race<string>([
      fetchFromFirestore(),
      new Promise<string>(async (resolve) => {
        setTimeout(async () => {
          // timed out → use cached global theme or default
          const cached = (await AsyncStorage.getItem('themeKey')) || 'default';
          resolve(cached);
        }, timeoutMs);
      }),
    ]);

    return themeKey;
  };

  const handleLogin = async () => {
    if (loading) return;

    const emailTrim = email.trim();
    const pwdTrim = password.trim();

    if (!emailTrim && !pwdTrim) {
      Alert.alert('Invalid Login', 'Email and password are required.');
      return;
    }
    if (!emailTrim) { Alert.alert('Invalid Login', 'Please enter your email.'); return; }
    if (!pwdTrim) { Alert.alert('Invalid Login', 'Please enter your password.'); return; }

    try {
      setLoading(true);
      setSkipAutoRedirect(true);
      const cred = await signInWithEmailAndPassword(auth, emailTrim, pwdTrim);
      const uid = cred.user.uid;
      const key = await resolveThemeBeforeNavigate(uid);
      await Promise.resolve(setThemeKey(key));
      router.replace('/home');
    } catch (e: any) {
      const code = e?.code ?? '';
      const invalidCredCodes = new Set([
        'auth/invalid-credential',
        'auth/invalid-login-credentials',
        'auth/wrong-password',
        'auth/invalid-password',
        'auth/user-not-found',
        'auth/invalid-email',
      ]);
      if (invalidCredCodes.has(code)) {
        Alert.alert('Login failed', 'Incorrect email or password. Please try again.', [{ text: 'OK' }], { cancelable: true });
      } else {
        Alert.alert('Login failed', e?.message ?? 'Login failed.');
      }
    } finally {
      setLoading(false);
      setSkipAutoRedirect(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#2D1B42' }}
      behavior={kbVisible && Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={KVO}
    >
      {/* Layer a full-bleed background so it also covers KAV padding */}
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require('../app/assets/images/background.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Foreground content stays the same */}
        <View style={{ flex: 1 }}>
          <View style={styles.logoContainer}>
            <Image source={require('../app/assets/images/delaluna_logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <BlurView intensity={90} tint="dark" style={styles.card}>
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(128,128,128,0.05)', 'rgba(0,0,0,0.05)']}
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
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  <TextInput
                    ref={passwordRef}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry
                    style={styles.textField}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />

                  <TouchableOpacity onPress={() => router.replace('/screens/forgot-password.screen')}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.loginButton, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
                  <Text style={styles.loginButtonText}>{loading ? 'Signing in…' : 'Login'}</Text>
                </TouchableOpacity>

                <SecondaryButtonComponent
                  title="Not a member? "
                  linkString="Sign up"
                  onPress={() => router.replace('/signup')}
                />
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    // normalize the backdrop container and center the scaled canvas
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D1B42',
  },
  logoContainer: { flex: 1, width: '100%', height: '60%', alignItems: 'center', justifyContent: 'flex-end' },
  card: {
    width: '100%', flexGrow: 1,
    ...Platform.select({
      ios: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25 },
      android: { backgroundColor: 'rgba(255, 255, 255, 0.24)', borderRadius: 20 },
    }),
    gap: 25, paddingHorizontal: 20, paddingVertical: 24, justifyContent: 'space-between',
  },
  logo: { width: '70%', height: '50%' },
  bodyContainer: { width: '100%', marginTop: 24, marginBottom: 30, alignItems: 'center', flex: 1, justifyContent: 'space-between' },
  welcomeText: {
    color: 'white',
    fontFamily: 'Poppins',
    ...Platform.select({ ios: { fontSize: 40 }, android: { fontSize: 30 } }),
    fontWeight: '500',
    marginBottom: 24,
  },
  form: { width: '90%' },
  textField: {
    ...Platform.select({ ios: { backgroundColor: 'rgba(255, 255, 255, 0.1)' }, android: { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }),
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(142, 68, 173, 0.6)', marginBottom: 16, paddingHorizontal: 16, height: 48, color: 'white',
  },
  forgotPassword: { color: 'white', fontSize: 13, fontFamily: 'Inter', fontWeight: '600', textAlign: 'right', margin: 8 },
  loginButton: {
    width: '80%', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 40, paddingVertical: 12, alignItems: 'center', marginBottom: 16, justifyContent: 'center',
    ...Platform.select({ ios: { marginTop: 10 }, android: { marginTop: 20 } }),
  },
  loginButtonText: { color: 'white', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600' },
  signUpText: { color: 'white', fontSize: 15, fontFamily: 'Inter', fontWeight: '600', textAlign: 'center', margin: 8 },
});
