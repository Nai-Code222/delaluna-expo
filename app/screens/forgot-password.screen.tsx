import { View, Text, TextInput, Button, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

// app/screens/forgotPassword.screen.tsx
export default function ForgotPasswordScreen() {
    var email = '';
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
                <Text style={styles.title}>Forgot Password</Text>
                <View style={styles.spacer} />
                <Text style={styles.description}>
                    Please enter your email address to reset your password.
                </Text>
                <View style={styles.spacer} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#fff"
                    onChangeText={(text) => email = text}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <View style={styles.spacer} />
                
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                    const emailInput = email.trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                    // 1. Not empt
                    // 2. Valid email format
                    // 3. Not already registered (optional, can be checked in Firebase)
                    if (!email || emailInput === '' || emailInput.length === 0 || !emailRegex.test(emailInput)) {
                        alert('Please enter a vaild email address.');
                        return;
                    }
                    else {
                        const auth = getAuth();
                        sendPasswordResetEmail(auth, email)
                            .then(() => {
                                alert('Password reset email sent! Please check your inbox.');
                                router.back();
                            })
                            .catch((error) => {
                                const errorCode = error.code;
                                const errorMessage = error.message;
                            });
                    }
                    }}>
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                </TouchableOpacity>
            </View>

        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1
    },
    header: {
        flex: 1,
        alignItems: 'flex-end',
        marginTop: 50,
        padding: 20,
    },
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
    description: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#fff',
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderBottomColor: '#ccc',
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 5,
        marginBottom: 20,
        color: '#fff',
        fontSize: 16,
    },
    button: {
        outlineColor: '#5A3E85',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 6,
        alignSelf: 'stretch',         
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    spacer: {
        height: 20,
    },
    cancelButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
