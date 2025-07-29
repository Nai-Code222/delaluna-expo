import 'dotenv/config';

export default {
  expo: {
    name: 'delaluna-expo',
    slug: 'delaluna-expo',
    jsEngine: 'jsc',
    ios: { jsEngine: 'hermes' },
    android: { jsEngine: 'hermes' },
    version: '2.0.0',
    orientation: 'portrait',
    icon: './app/assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    owner: "naicode022",
    updates: {
      url: "https://u.expo.dev/24610560-82da-4ee8-99d3-e51db4e8401c"
    },
    runtimeVersion: "2.0.0",


    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
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
      package: 'com.delalunaanswers.app',
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
