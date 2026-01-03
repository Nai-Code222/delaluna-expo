import "dotenv/config";

export default {
  expo: {
    name: "Delaluna Answers",
    slug: "delaluna-expo",
    scheme: "delaluna",
    version: "2.0.0",
    orientation: "portrait",
    owner: "naicode022",
    icon: "./src/assets/images/delaluna_app_icon.png",
    splash: {
      image: "./src/assets/images/delaluna_app_icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    experiments: {
      typedRoutes: true
    },
    

    extra: {
      // local vs prod toggle
      USE_EMULATOR: "true",
      USE_EMAIL_VERIFICATION: "false",
      eas: {
        projectId: "24610560-82da-4ee8-99d3-e51db4e8401c"
      },

      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID
    },
    updates: {
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
      enabled: true,
      url: "https://u.expo.dev/24610560-82da-4ee8-99d3-e51db4e8401c"
    },
    runtimeVersion: {
      policy: "sdkVersion"
    },
    ios: {
      jsEngine: "hermes",
      supportsTablet: false,
      bundleIdentifier: "com.delaluna.answers",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      useFrameworks: "static"
    },
    android: {
      jsEngine: "hermes",
      package: "com.delaluna.answers",
      adaptiveIcon: {
        foregroundImage: "./src/assets/images/delaluna_app_icon.png",
        backgroundColor: "#ffffff"
      },
      softwareKeyboardLayoutMode: "resize"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./src/assets/images/delaluna_app_icon.png"
    },
    plugins: [
      "expo-localization",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "1.9.25"
          },
          ios: {
            useFrameworks: "static"
          }
        }
      ],
      "expo-dev-client",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./src/assets/images/delaluna_app_icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./src/assets/images/delaluna_app_icon.png",
          color: "#ffffff"
        }
      ]
    ]
  }
};
