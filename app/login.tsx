// app/login.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Image, Platform, KeyboardAvoidingView,
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
import ZoomOut from '@/app/utils/ZoomOut';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [skipAutoRedirect, setSkipAutoRedirect] = useState(false); // prevents race with useAuth redirect

  const { user, initializing } = useAuth();
  const router = useRouter();
  const { setThemeKey } = useContext(ThemeContext);
  const db = getFirestore();
  const passwordRef = React.useRef<TextInput>(null);

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
    setFormError(null);
    const emailTrim = email.trim();
    const pwdTrim = password.trim();
    // Show both errors if both fields are empty
    if (!emailTrim && !pwdTrim) {
      setEmailError('Email is required.');
      setPasswordError('Password is required.');
      return;
    }
    if (!emailTrim) { setEmailError('Email is required.'); return; }
    if (!pwdTrim) { setPasswordError('Password is required.'); return; }
    setEmailError(null); setPasswordError(null);

    try {
      setLoading(true);
      setSkipAutoRedirect(true); // temporarily disable the auto-redirect effect

      // 1) Sign in
      const cred = await signInWithEmailAndPassword(auth, emailTrim, pwdTrim);
      const uid = cred.user.uid;

      // 2) Resolve the FINAL theme BEFORE navigating (no visual switch)
      const key = await resolveThemeBeforeNavigate(uid);

      // 3) Apply theme (context persists it); then navigate
      await Promise.resolve(setThemeKey(key)); // in case your setter becomes async later
      router.replace('/home');
    } catch (e: any) {
      if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/invalid-password' || e?.code === 'auth/user-not-found') {
        setFormError('Incorrect email or password. Please try again.');
      } else {
        setFormError(e?.message ?? 'Login failed.');
      }
    } finally {
      setLoading(false);
      setSkipAutoRedirect(false);
    }
  };

  return (
  <SafeAreaView style={{ flex: 1 }} pointerEvents="none">
    {/* Background only decorates; don't steal touches */}
    <ImageBackground
      source={require('../app/assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
      
    />
    {/* Foreground interactive layer */}
    <View pointerEvents="auto" style={StyleSheet.absoluteFill}>
      <ZoomOut baseWidth={390} baseHeight={780} minScale={0.85} keyboardAwareIOS>
        <BlurView intensity={90} tint="dark" style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(128,128,128,0.05)', 'rgba(0,0,0,0.05)']}
            locations={[0, 0.49, 1]}
            start={[0, 0]}
            end={[0, 1]}
            style={{ flex: 1, borderRadius: Platform.OS === 'ios' ? 25 : 20, overflow: 'hidden' }}
          >
            <View style={styles.bodyContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../app/assets/images/delaluna_logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

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
                {emailError && <Text style={styles.errorText}>{emailError}</Text>}

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
                {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                {formError && <Text style={styles.errorText}>{formError}</Text>}

                <TouchableOpacity onPress={() => router.replace('/screens/forgot-password.screen')}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', gap: 10 }}>
                <TouchableOpacity style={[styles.loginButton, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
                  <Text style={styles.loginButtonText}>{loading ? 'Signing in…' : 'Login'}</Text>
                </TouchableOpacity>

                <SecondaryButtonComponent
                  title="Not a member? "
                  linkString="Sign up"
                  onPress={() => router.replace('/signup')}
                />
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </ZoomOut>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#2D1B42' },

  // This fills the 390x780 "design canvas" and will be uniformly scaled
  card: {
    width: 390,
    height: 780,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.24)',
    borderRadius: Platform.OS === 'ios' ? 25 : 20,
  },

  bodyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20, // avoid space-between; the baseHeight defines layout
  },

  // Keep the logo from hogging vertical space
  logoContainer: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', maxHeight: 140 },
  logo: { width: '70%', aspectRatio: 3.2 },

  welcomeText: {
    color: 'white',
    fontFamily: 'Poppins',
    ...Platform.select({ ios: { fontSize: 40 }, android: { fontSize: 30 } }),
    fontWeight: '500',
  },

  form: { width: '90%' },

  textField: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.6)',
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 56, // Base touch target (scales down to ~48 at minScale 0.85)
    color: 'white',
  },

  forgotPassword: { color: 'white', fontSize: 13, fontFamily: 'Inter', fontWeight: '600', textAlign: 'right', margin: 8 },

  loginButton: {
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 40,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // base; after 0.85 scale ≈ 47.6 (still tappable)
  },
  loginButtonText: { color: 'white', fontSize: 20, fontFamily: 'Poppins', fontWeight: '600' },
  errorText: { color: 'red', fontSize: 15, marginBottom: 8, marginLeft: 4 },
});
