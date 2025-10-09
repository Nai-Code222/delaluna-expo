import React from 'react';
import { View, StyleSheet, ImageBackground, useWindowDimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { scale, verticalScale } from '@/src/utils/responsive';
import TitleText from '@/app/components/typography/title-text';
import PrimaryButton from '@/app/components/buttons/primary-button-component';
import SecondaryButton from '@/app/components/buttons/secondary-button-component';
import ButtonText from '@/app/components/typography/button-text';

export default function Welcome() {
  const { width } = useWindowDimensions();
  const logoW = Math.min(width * 0.72, scale(360));
  const logoH = logoW * 0.95; // adjust to your logo aspect
  

  return (
    <View style={styles.container}>
      {/* background image */}
      <ImageBackground
        source={require('../assets/images/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* TOP: animation fills, logo centered on top */}
      <View style={styles.topContainer}>
        <LottieView
          source={require('../assets/animations/galaxy.json')}
          autoPlay
          loop
          style={styles.topAnimation}  // absolute fill inside top container
        />

        {/* centered logo (over the animation) */}
        <View style={styles.logoWrap}>
          <LottieView
            source={require('../assets/animations/logo.json')}
            autoPlay
            loop={false}
            style={{ width: '100%', aspectRatio: 1 / 0.95 /* W/H */, height: undefined }}

          />
        </View>
      </View>

      {/* BOTTOM: buttons */}
      <View style={styles.bottomContainer}>
        <TitleText>
          Welcome to {'\n'} <TitleText>Delaluna</TitleText>
        </TitleText>

        <PrimaryButton
          title="Get Started"
          onPress={() => router.replace('/(auth)/sign-up')}
        />

        <View style={styles.divider} />

        <ButtonText>
          <SecondaryButton
            title="Already a member?"
            linkString="Log In"
            onPress={() => router.replace('/(auth)/login')}
          />
        </ButtonText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },

  topContainer: {
    flex: 3.5,                 // keep logo centered here
    position: 'relative',
    paddingBottom: verticalScale(50),   // ↓ was larger; reduces gap
  },

  bottomContainer: {
  flex: 1.3,
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: verticalScale(2),
  paddingBottom: verticalScale(25),
  gap: verticalScale(15),
  paddingHorizontal: scale(24),

  // pull the whole block upward
  marginTop: -verticalScale(90),   // ↑ increase magnitude to move closer
},
  // animation fills top container
  topAnimation: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  // center the logo in the middle of the top container
  logoWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  divider: {
  width: '80%',
  height: StyleSheet.hairlineWidth,
  backgroundColor: '#D4D6DD',
  marginVertical: verticalScale(12), // was 20
},
});
