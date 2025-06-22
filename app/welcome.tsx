import React from 'react';
import { View, Button, StyleSheet, ImageBackground } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import PrimaryButton from '@/app/components/buttons/primaryButtonComponent';
import SecondaryButton from '@/app/components/buttons/secondaryButtonComponent';
import { TitleText } from '@/app/components/typography/TitleText';
import ButtonText from '@/app/components/typography/ButtonText';
import welcomeJson from '../app/assets/animations/Pre comp 4.json';
import logoJson from '../app/assets/animations/Pre comp 3_1.json';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../app/assets/images/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      />
      <View style={styles.topContainer}>
        <LottieView
          source={welcomeJson}
          autoPlay
          style={{ width: 300, height: 300 }}
        />
        <LottieView
          source={logoJson}
          autoPlay
          style={{ width: 400, height: 500 }}
        />
      </View>
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
            linkString="Log In"
            onPress={() => router.push('/login')}
          />
        </ButtonText>
        <Button
          title="Continue as Guest"
          color="#FF9800"
          onPress={() => {
            console.log('Continue as Guest');
            router.push('/home');
          }}
        />
      </View>
    </View>
  );
}

// ...styles remain unchanged...

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
