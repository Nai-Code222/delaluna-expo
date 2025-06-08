import 'expo-router/entry';
import { enableScreens } from 'react-native-screens';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './backend/AuthContext';
import { AppNavigator } from './app/navigation/app-navigator';
import AuthNavigator from './app/navigation/auth-navigator';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';

enableScreens();

function RootNavigator() {
  const { user, initializing } = useContext(AuthContext);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('./assets/fonts/SpaceMono-Regular.ttf'),
    'Futura-Medium': require('./assets/fonts/Futura Md BT Medium.ttf'),
    'Futura-Light': require('./assets/fonts/Futura light.ttf'),
    'Futura-Book': require('./assets/fonts/Futura Bk BT Book.ttf'),
    'Futura-Generic': require('./assets/fonts/Futura-Generic.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
