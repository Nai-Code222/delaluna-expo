import 'dotenv/config';
import { withProjectBuildGradle } from 'expo/config-plugins';

// Injects a Compose compiler version that matches Kotlin 1.9.25 across all modules
function withComposeCompilerVersion(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const stamp = '/* compose-compiler-override injected */';
    if (cfg.modResults.contents.includes(stamp)) return cfg;

    cfg.modResults.contents += `

${stamp}
subprojects { p ->
  // Set composeOptions.kotlinCompilerExtensionVersion wherever Compose is enabled
  [ 'com.android.application', 'com.android.library' ].each { pid ->
    p.plugins.withId(pid) {
      def androidExt = p.extensions.findByName('android')
      if (androidExt && androidExt.hasProperty('composeOptions')) {
        androidExt.composeOptions { kotlinCompilerExtensionVersion = "1.5.15" }
      }
    }
  }
  // Also force the artifact to resolve to 1.5.15
  configurations.all {
    resolutionStrategy.eachDependency { d ->
      if (d.requested.group == "androidx.compose.compiler" && d.requested.name == "compiler") {
        d.useVersion("1.5.15")
      }
    }
  }
}
`;
    return cfg;
  });
}

export default withComposeCompilerVersion({
  expo: {
    name: 'delaluna-expo',
    slug: 'delaluna-expo',
    version: '2.0.0',
    orientation: 'portrait',
    icon: './app/assets/images/delaluna_app_icon.png',
    splash: {
      image: './app/assets/images/delaluna_app_icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    owner: 'naicode022',
    updates: { url: 'https://u.expo.dev/24610560-82da-4ee8-99d3-e51db4e8401c' },
    runtimeVersion: '2.0.0',

    extra: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
      eas: { projectId: '24610560-82da-4ee8-99d3-e51db4e8401c' },
    },

    ios: {
      jsEngine: 'jsc',
      supportsTablet: true,
      bundleIdentifier: 'com.app.delaluna-answers',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      jsEngine: 'jsc',
      softwareKeyboardLayoutMode: 'resize',
      adaptiveIcon: {
        foregroundImage: './app/assets/images/delaluna_app_icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.app.delaluna_answers',
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/delaluna_app_icon.png',
    },

    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            // kotlinVersion: '1.9.25', // leave as is if prebuild insists
          },
          ios: { useFrameworks: 'static' },
        },
      ],
      'expo-dev-client',
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './app/assets/images/delaluna_app_icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],

    experiments: { typedRoutes: true },
  },
});
