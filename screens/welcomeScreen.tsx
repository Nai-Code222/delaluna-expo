// screens/WelcomeScreen.tsx
import React from 'react';
import {
  View,
  Button,
  StyleSheet,
  ImageBackground
} from 'react-native';
import LottieView from 'lottie-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/app/navigation/auth-navigator';
import PrimaryButton from '@/components/buttons/primaryButtonComponent';

const welcomeJson = require('../assets/animations/Pre comp 4.json');

// Tell TS what routes we have on this stack
type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Background */}
      <ImageBackground
        source={require('../assets/images/backgroundImg.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* Lottie */}
      <View style={styles.topContainer}>
        <LottieView
          source={welcomeJson}
          autoPlay
          loop
          style={{ width: 300, height: 300 }}
        />
      </View>

      {/* Buttons */}
      <View style={styles.bottomContainer}>
        <PrimaryButton
          title="Get Started"
          onPress={() => navigation.navigate('Login')}
          style={{ marginBottom: 20 }}
          accessibilityLabel="Get Started"
          accessibilityHint="Navigate to the login screen"
          />
        <Button
          title="Sign Up"
          color="#2196F3"
          onPress={() => navigation.navigate('Signup')}
        />
        <Button
          title="Continue as Guest"
          color="#FF9800"
          onPress={() => {
            /* if you want guest to skip auth:
               navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            */
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  topContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
});
