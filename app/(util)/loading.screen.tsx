// src/components/component-utils/loading-screen.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground } from 'react-native';
import { scale, verticalScale } from '@/utils/responsive';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

export default function LoadingScreen({ progress = 0, message = "Loading..." }: LoadingScreenProps) {
  return (
    <ImageBackground
      source={require('@/assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#5BC0BE" />
        
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
        
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 4, 4, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  message: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: '600',
    marginTop: verticalScale(20),
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: verticalScale(30),
    width: '80%',
    maxWidth: scale(300),
  },
  progressBar: {
    height: verticalScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5BC0BE',
    borderRadius: scale(4),
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
});