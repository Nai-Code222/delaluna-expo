import React from 'react';

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import { Link, router, Stack } from 'expo-router';

export default function NotFoundScreen() {
  function goToWelcomeScreen(): void {
    router.replace('/(main)')
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>

        <TouchableOpacity onPress={goToWelcomeScreen}>
          <Text style={styles.linkText}>Go to home!</Text>
        </TouchableOpacity>
      
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
