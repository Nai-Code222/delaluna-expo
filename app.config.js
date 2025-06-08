import 'dotenv/config';

export default {
  expo: {
    name: 'delaluna-expo',
    slug: 'delaluna-expo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './app/assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      eas: {
        projectId: '24610560-82da-4ee8-99d3-e51db4e8401c',
      },
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.delalunaanswers.app',
      googleServicesFile: './GoogleService-Info.plist',
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './app/assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.naicode022.delalunaexpo',
      googleServicesFile: './google-services.json',
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      'expo-dev-client',
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './app/assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },
  },
};
