// app/splash.tsx
import 'react-native-gesture-handler'; 
import 'expo-router/entry';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // added
import { useAuth } from '@/backend/auth-context';


export default function SplashScreen() {
  const animationRef = useRef<LottieView>(null);
  const { user, initializing } = useAuth();

  useEffect(() => {
    animationRef.current?.play();

    const timer = setTimeout(() => {
      router.replace('/(auth)/welcome'); // back to welcome screen
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Handle if user has previously logged in
  useEffect(() => {
    if (!initializing && user) {
      router.replace('/(main)');
    }
  }, [initializing, user]);

  return (
    <ImageBackground
      source={require('../app/assets/images/background.jpg')}
      style={styles.background}

      resizeMode="cover"
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.overlay}>
        <LottieView
          ref={animationRef}
          source={require('../app/assets/animations/splash-animation.json')}
          autoPlay
          loop={true}
          style={styles.animation}
        />
      </View>
    </ImageBackground>
  );}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 4, 4, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
     width: 600, 
     height: 600 
  },
});
