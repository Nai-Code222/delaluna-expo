// App.tsx
import 'expo-router/entry';
import { enableScreens } from 'react-native-screens';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './backend/AuthContext';
import { AppNavigator } from './navigation/app-navigator';
import AuthNavigator from './navigation/auth-navigator';
import { ActivityIndicator, View } from 'react-native';

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
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
