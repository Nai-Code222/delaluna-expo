import React, { useEffect, useRef } from 'react';

import { View, StyleSheet, ImageBackground } from 'react-native';

import { router } from 'expo-router';

import LottieView from 'lottie-react-native';
import { Buffer } from "buffer";
import { StatusBar } from 'expo-status-bar';

import { scale } from '@/utils/responsive';

import { useAuth } from '../src/backend/auth-context';

global.Buffer = Buffer;

//TODO: Add Animation back in

export default function SplashScreen() {
  const animationRef = useRef<LottieView>(null);
  const { authUser, initializing } = useAuth();

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
      router.replace(authUser ? '/(main)' : '/(auth)/welcome');
      //router.replace('/test-signs' as unknown as any); // TEMP SKIP AUTH FOR TESTING
    });
  }, [authUser, initializing]);

  return (

    <ImageBackground
      source={require('@/assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        {/* <LottieView
              source={require('@/assets/animations/splash-loop.json')}
              autoPlay
              loop
              style={styles.animation}  // absolute fill inside top container
            /> */}
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
