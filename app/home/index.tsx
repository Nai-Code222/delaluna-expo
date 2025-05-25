import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import { AuthContext } from '@/backend/AuthContext'; // Adjust if needed

const HomeScreen: React.FC = () => {
  const { user, initializing } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
      router.push('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Home!</Text>
      <Text style={styles.email}>
        {user ? `Logged in as: ${user.email}` : 'No user logged in.'}
      </Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    marginBottom: 24,
  },
});

export default HomeScreen;
