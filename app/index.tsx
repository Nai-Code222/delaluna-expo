// app/splash.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    animationRef.current?.play();

    const timer = setTimeout(() => {
      router.replace('/welcome'); // back to welcome screen
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/background.jpg')}
      style={styles.background}

      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <LottieView
          ref={animationRef}
          source={require('../../assets/animations/splash-animation.json')}
          autoPlay
          loop={true}
          style={styles.animation}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 4, 4, 0.45)', // optional tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
     width: 600, 
     height: 600 
  },
});
