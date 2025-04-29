// navigation/AuthNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '@/screens/welcomeScreen';
import LoginScreen   from '@/app/login';
import SignupScreen  from '@/screens/signupScreen';
import React from 'react';
// import { useRouter } from 'expo-router';
// import { useAuth } from '../hooks/useAuth';
const Stack = createNativeStackNavigator<AuthStackParamList>();

// Exported params for each route in this Auth stack
export type AuthStackParamList = {
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
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login"   component={LoginScreen} />
      <Stack.Screen name="Signup"  component={SignupScreen} />
    </Stack.Navigator>
  );
};
