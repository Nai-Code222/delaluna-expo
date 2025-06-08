// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { HomeTabParamList }     from '../app/navigation/HomeTabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = BottomTabScreenProps<HomeTabParamList, 'Home'>;

export default function HomeScreen({ navigation, route }: Props) {
    const handleLogout = () => {
        // Add your logout logic here
        console.log('Logged out');
        // For example, clear the token and navigate to the login screen
        AsyncStorage.removeItem('userToken');
       
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Home!</Text>
      <Button title="Log Out" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24, 
    marginBottom: 16
  },
  link: {
    color: 'blue', 
    textDecorationLine: 'underline'
  }
});
