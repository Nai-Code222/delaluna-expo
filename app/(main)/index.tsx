// app/screens/HomeScreen.tsx
import React, { useContext, useEffect, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AuthContext from '../backend/auth-context';
import HeaderNav from '../components/component-utils/header-nav';
import { ThemeContext } from "../theme-context";


export default function HomeScreen() {
  const { user, initializing } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const safeOffset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

    const { theme } = useContext(ThemeContext);

  // Cross-fade when theme/content becomes ready
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme]);

  // Auth guard (ThemeProvider already hydrated before first paint)
  useEffect(() => {
    if (!initializing && !user) router.replace('/(auth)/welcome');
  }, [initializing, user]);

  // Render helpers
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

  // While auth is initializing, keep spinner inside the themed background (no white flash)
  if (initializing) {
    return renderBackground(
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const goToProfile = () => router.replace('/(supporting)/profile.screen');

  return renderBackground(
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <ExpoStatusBar style="light" />
      <HeaderNav
        title="Home"
        leftIconName={undefined}
        onLeftPress={() => {}}
        rightIconSource={require('../assets/icons/avatar.png')}
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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, marginBottom: 8, color: '#fff' },
  email: { fontSize: 16, marginBottom: 20, color: '#ddd' },
});
