// app/index.tsx
import React from 'react';
import { View, Button, StyleSheet, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import PrimaryButton from '@/components/buttons/primaryButtonComponent';
import SecondaryButton from '@/components/buttons/secondaryButtonComponent';
import { TitleText } from '@/components/typography/TitleText';
import { BodyText } from '@/components/typography/BodyText';
import ButtonText from '@/components/typography/ButtonText';

const welcomeJson = require('../assets/animations/Pre comp 4.json');
const logoJson = require('../assets/animations/Pre comp 3_1.json');
export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Background */}
      <ImageBackground
        source={require('../assets/images/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      />
      {/* Animations */}
      <View style={styles.topContainer}>
      <LottieView
          source={welcomeJson}
          autoPlay
          style={{ width: 400, height: 300 }}
        />
        <LottieView
          source={logoJson}
          autoPlay
          style={{ width: 500, height: 500 }}
        />
      </View>

      {/* Buttons */}
      <View style={styles.bottomContainer}>
        <TitleText>
          <PrimaryButton
          title="Get Started"
          onPress={() => router.push('/signup')}
          style={{ marginBottom: 10 }}
          accessibilityLabel="Get Started"
          accessibilityHint="Navigate to the sign up screen"
          />
        </TitleText>
        

          <View
            style={{
              width: '80%',
              height: 1,
              backgroundColor: '#D4D6DD',
              marginVertical: 20,
            }}
          />

<ButtonText>
        <SecondaryButton
          title="Already a member?"
          linkString='Log In'
          onPress={() => router.push('/login')}
        />
        
        </ButtonText>
        <Button
          title="Continue as Guest"
          color="#FF9800"
          onPress={() => {
            // Handle guest login logic here
            console.log('Continue as Guest');
            router.push('/home');
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
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 20,
  },
});
