import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface SecondaryButtonProps {
    title: string;
    onPress?: () => void;
    link?: string;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ title, onPress, link }) => {
    const handlePress = () => {
        if (link) {
            Linking.openURL(link).catch(err => console.error("Failed to open link:", err));
        } else if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, link ? styles.linkButton : null]}
            onPress={handlePress}
        >
            <Text style={[styles.text, link ? styles.linkText : styles.defaultText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        height: 55,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkButton: {
        backgroundColor: '#006FFD',
    },
    text: {
        fontSize: 16,
    },
    defaultText: {
        color: '#006FFD',
    },
    linkText: {
        color: '#FFFFFF',
    },
});

export default SecondaryButton;
