import React from 'react';
import { View, Button, StyleSheet, ImageBackground, useWindowDimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import PrimaryButton from '@/app/components/buttons/primaryButtonComponent';
import SecondaryButton from '@/app/components/buttons/secondaryButtonComponent';
import { TitleText } from '@/app/components/typography/TitleText';
import ButtonText from '@/app/components/typography/ButtonText';
import welcomeJson from '../app/assets/animations/Pre comp 4.json';
import logoJson from '../app/assets/animations/Pre comp 3_1.json';
import { scale, verticalScale, moderateScale } from '../src/utils/responsive';

export default function Welcome() {
  const { width } = useWindowDimensions();
  // Responsive animation sizing (caps ensure no runaway growth on tablets)
  const animationSize = Math.min(width * 0.6, scale(300));
  const logoWidth = Math.min(width * 0.8, scale(400));
  const logoHeight = logoWidth * 1.25; // preserves approximate aspect ratio
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
          style={{ width: animationSize, height: animationSize }}
        />
        <LottieView
          source={logoJson}
          autoPlay
          style={{ width: logoWidth, height: logoHeight }}
        />
      </View>
      <View style={styles.bottomContainer}>
        <TitleText>
          <PrimaryButton
            title="Get Started"
            onPress={() => router.replace('/signup')}
            style={{ marginBottom: verticalScale(10) }}
            accessibilityLabel="Get Started"
            accessibilityHint="Navigate to the sign up screen"
          />
        </TitleText>
        <View
          style={{
            width: '80%',
            height: StyleSheet.hairlineWidth,
            backgroundColor: '#D4D6DD',
            marginVertical: verticalScale(20),
          }}
        />
        <ButtonText>
          <SecondaryButton
            title="Already a member?"
            linkString="Log In"
            onPress={() => router.replace('/login')}
          />
        </ButtonText>
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
    paddingHorizontal: scale(16),
  },
  bottomContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: verticalScale(40),
    gap: verticalScale(20),
    paddingHorizontal: scale(24),
  },
});
