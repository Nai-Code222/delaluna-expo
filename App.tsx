// App.tsx
import 'expo-router/entry';
import { enableScreens } from 'react-native-screens';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './backend/AuthContext';
import { AppNavigator } from './navigation/app-navigator';
import AuthNavigator from './navigation/auth-navigator';

enableScreens();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AuthContext.Consumer>
          {({ user }) =>
            user
              ? <AppNavigator />
              : <AuthNavigator />
          }
        </AuthContext.Consumer>
      </NavigationContainer>
    </AuthProvider>
  );
}
