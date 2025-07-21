import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getAuth, updatePassword } from "firebase/auth"; 
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

export default function UpdatePasswordScreen() {
    var newPassword = '';
    return (
        <LinearGradient
            colors={['#2D1B42', '#3B235A', '#5A3E85']}
            locations={[0, 0.5, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.background}>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Update Password</Text>
                <View style={styles.spacer} />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#fff"
                    secureTextEntry
                    onChangeText={(text) => newPassword = text}
                    autoCapitalize="none"
                />

                <View style={styles.spacer} />
                
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        const passwordInput = newPassword.trim();

                        // Check if the password is valid (e.g., not empty)
                        if (!passwordInput || passwordInput.length === 0) {
                            alert('Please enter a valid password.');
                            return;
                        } else {
                            const auth = getAuth();
                            
                        }
                    }}>
                    <Text style={styles.buttonText}>Update Password</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    cancelButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 5,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        color: '#fff',
        marginBottom: 20,
    },
    spacer: {
        height: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
    },
    button: {
        backgroundColor: '#8e44ad',
        padding: 15,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
       