import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from './backend/auth-context';
import { Buffer } from "buffer";
import { scale } from '@/src/utils/responsive';
global.Buffer = Buffer;

export default function SplashScreen() {
  const animationRef = useRef<LottieView>(null);
  const { user, initializing } = useAuth();

  useEffect(() => {
    animationRef.current?.play();

    const minTimer = new Promise(resolve => setTimeout(resolve, 1200));
    const authReady = new Promise(resolve => {
      const interval = setInterval(() => {
        if (!initializing) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });

    Promise.all([minTimer, authReady]).then(() => {
      if (user) {
        router.replace('/(main)');
      } else {
        router.replace('/(auth)/welcome');
      }
    });
  }, [user, initializing]);

  return (

    <ImageBackground
      source={require('./assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        <LottieView
              source={require('./assets/animations/splash-loop.json')}
              autoPlay
              loop
              style={styles.animation}  // absolute fill inside top container
            />
      </View>
      <StatusBar style="light" />

    </ImageBackground>

  );
}

const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFillObject },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 4, 4, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: { width: scale(600), height: scale(800), aspectRatio: 1 / 1, },
});
