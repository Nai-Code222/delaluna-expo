// app/screens/changePassword.screen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';

// Helper to validate new password strength
function validatePassword(text: string): string {
  if (!text) {
    return 'Please enter a new password.';
  }
  if (text.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(text)) {
    return 'Password must contain at least one uppercase letter.';
  }
  return '';
}

export default function UpdatePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCancel = () => {
    router.replace('/screens/profile.screen');
  };

  const handleChange = async () => {
    const curr = currentPassword.trim();
    const next = newPassword.trim();
    const confirm = confirmPassword.trim();

    // 1. Current password must be at least 6 characters
    if (!curr || curr.length < 6) {
      Alert.alert('Validation', 'Please enter your current password (at least 6 characters).');
      return;
    }
    
    // 2. Validate new password strength
    const pwdError = validatePassword(next);
    if (pwdError) {
      Alert.alert('Validation', pwdError);
      return;
    }

    // 3. New vs Confirm match
    if (next !== confirm) {
      Alert.alert('Validation', 'New password and confirmation do not match.');
      return;
    }

    // 4. Firebase re-authentication and update
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Error', 'No logged-in user found.');
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, curr);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      Alert.alert('Success', 'Your password has been changed.');
      router.replace('/screens/profile.screen');
    } catch (error: any) {
      console.error(error);
      const message =
        error.code === 'auth/wrong-password'
          ? 'Current password is incorrect.'
          : 'An error occurred. Please try again.';
      Alert.alert('Error', message);
    }
  };

  return (
    <LinearGradient
      colors={['#2D1B42', '#3B235A', '#5A3E85']}
      locations={[0, 0.5, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.background}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Change Password</Text>
        <View style={styles.spacer} />

        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#fff"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <View style={styles.spacer} />

        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#fff"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <View style={styles.spacer} />

        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#fff"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <View style={styles.spacer} />

        <TouchableOpacity style={styles.button} onPress={handleChange}>
          <Text style={styles.buttonText}>Save Password</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  spacer: { height: 20 },
  input: {
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignSelf: 'stretch',
    marginTop: 20,
    backgroundColor: '#5A3E85',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 50,
    left: 20,
    padding: 10,
  },
  cancelButtonText: { color: '#fff', fontSize: 16 },
});
