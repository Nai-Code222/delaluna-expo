// app/screens/HomeScreen.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AuthContext from '@/app/backend/AuthContext';
import HeaderNav from '../components/utils/headerNav';
import { ThemeContext } from '../themecontext';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const { user, initializing } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const safeOffset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

  const { theme, setThemeKey } = useContext(ThemeContext);
  const [themeLoading, setThemeLoading] = useState(true);

  // Cross-fade when theme/content becomes ready
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  // Fetch server theme in background; always fall back to default
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (user?.uid) {
          const db = getFirestore();
          const snap = await getDoc(doc(db, 'users', user.uid));
          const key = snap.exists() && snap.data().themeKey ? snap.data().themeKey : 'default';
          if (!cancelled) await setThemeKey(key);
        } else if (!cancelled) {
          await setThemeKey('default');
        }
      } catch {
        if (!cancelled) await setThemeKey('default');
      } finally {
        if (!cancelled) setThemeLoading(false);
      }
    };

    run();

    if (!initializing && !user) router.replace('/welcome');
    return () => {
      cancelled = true;
    };
  }, [user?.uid, initializing]);

  // Helper to render background using current theme
  const renderBackground = (children: React.ReactNode) => {
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground source={theme.backgroundImage} style={styles.background} resizeMode="cover">
          {children}
        </ImageBackground>
      );
    }
    if (theme.backgroundType === 'gradient' && theme.gradient) {
      const angle = theme.gradient.angle ?? 0;
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{
            x: Math.cos((angle * Math.PI) / 180),
            y: Math.sin((angle * Math.PI) / 180),
          }}
          style={styles.background}
        >
          {children}
        </LinearGradient>
      );
    }
    return <View style={[styles.background, { backgroundColor: theme.colors.background }]}>{children}</View>;
  };

  // 🔑 IMPORTANT: even while loading, wrap the spinner with renderBackground
  if (initializing || themeLoading) {
    return renderBackground(
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const goToProfile = () => router.replace('/screens/profile.screen');

  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <HeaderNav
        title="Home"
        leftIconName={undefined}
        onLeftPress={() => {}}
        rightIconSource={require('../assets/icons/Avatar.png')}
        onRightPress={goToProfile}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Home!</Text>
        <Text style={styles.email}>{user ? `Logged in as: ${user.email}` : 'No user logged in.'}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  background: { flex: 1, width: '100%', height: '100%' },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // no background here — the parent renderBackground provides it
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, marginBottom: 8, color: '#fff' },
  email: { fontSize: 16, marginBottom: 20, color: '#ddd' },
});
