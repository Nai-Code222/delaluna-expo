// app/home/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '.';

export type HomeTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

export default function HomeLayout() {
  return (
    
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // tabBarShowLabel: false, // if you only want icons
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}     />
    </Tab.Navigator>
  );
}
