import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { View, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import React from 'react';


export default function UpdatePasswordScreen() {
    return (
        <LinearGradient
            colors={['#2D1B42', '#3B235A', '#5A3E85']}
            locations={[0, 0.5, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.background}>
            <View style={styles.container}>
                
                <View style={styles.spacer} />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#fff"
                    secureTextEntry
                    autoCapitalize="none"
                />
                <View style={styles.spacer} />
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        // Handle password update logic here
                        alert('Password updated successfully!');
                        router.back();
                    }}>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    )
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
            top: 40,
            right: 20,
        },
        cancelButtonText: {
            color: '#fff',
            fontSize: 16,
        },
        title: {
            fontSize: 24,
            color: '#fff',
            marginBottom: 10,
        },
        description: {
            color: '#fff',
            textAlign: 'center',
            marginBottom: 20,
        },
        input: {
            width: '100%',
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#fff',
            color: '#000',
        },
        spacer: {
            height: 10,
        },
        button: {
            backgroundColor: '#8e44ad',
            paddingVertical: 15,
            paddingHorizontal: 30,
            borderRadius: 5,
        },
        buttonText: {
            color: '#fff',
            fontSize: 16,
        },
    }); 