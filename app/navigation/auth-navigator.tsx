// navigation/AuthNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '@/screens/welcomeScreen';
import LoginScreen   from '@/app/login';
import SignupScreen  from '@/app/signup';
import React from 'react';
import SplashScreen from '@/app/index';
// import { useRouter } from 'expo-router';
// import { useAuth } from '../hooks/useAuth';
const Stack = createNativeStackNavigator<AuthStackParamList>();

// Exported params for each route in this Auth stack
export type AuthStackParamList = {
  Splash:  undefined;
  Welcome: undefined;
  Login:   undefined;
  Signup:  undefined;
};

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login"   component={LoginScreen} />
      <Stack.Screen name="Signup"  component={SignupScreen} />
    </Stack.Navigator>
  );
};
