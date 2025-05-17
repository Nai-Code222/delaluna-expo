import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SecondaryButtonProps {
    title: string;
    onPress?: () => void;
    linkString?: string;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ title, onPress, linkString }) => {
    const handlePress = () => {
        if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, linkString ? styles.linkButton : styles.outlineButton]}
            onPress={handlePress}
        >
            <Text style={[styles.text, styles.defaultText]}>
                {title}
                {linkString && (
                    <Text style={styles.linkText}>
                        {` ${linkString}`}
                    </Text>
                )}
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
    outlineButton: {
        backgroundColor: 'transparent',
    },
    linkButton: {
        backgroundColor: 'transparent',
    },
    text: {
        fontSize: 16,
    },
    defaultText: {
        color: '#FFFFFF',
    },
    linkText: {
        color: '#5BC0BE',
    },
});

export default SecondaryButton;
