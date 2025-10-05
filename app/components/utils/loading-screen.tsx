import LottieView from 'lottie-react-native';
import React, { useContext } from 'react';
import { View, ImageBackground, StyleSheet, Animated, Easing, Image, StatusBar } from 'react-native';
import { BodyText } from '@/components/utils/typography/body-text';
import { ThemeContext } from '@/components/themecontext'
const backgroundImg = require('../../assets/images/main-background.png');
const splashAnimation = require('../../assets/animations/splash-animation.json'); // Replace with your animation asset
type LoadingScreenProps = {
    progress: number; // 0 to 1
    message?: string;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
    const animatedWidth = React.useRef(new Animated.Value(0)).current;
    const { theme } = useContext(ThemeContext)

    React.useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: progress,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    return (
        <ImageBackground source={theme.backgroundImage} style={styles.background}>
            <StatusBar barStyle="light-content" backgroundColor="#1C2541" />
            <View style={styles.centerContent}>
            <View style={styles.overlay}></View>
            <LottieView
                source={splashAnimation}
                autoPlay
                style={{ width: 500, height: 500 }}
            />
            {progress < 1 && (
                <BodyText>{`Loading...`}</BodyText>
            )}
            {progress === 1 && (
                <BodyText>Loading complete!</BodyText>
            )}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
        width: '80%',
    },
    animation: {
        width: 120,
        height: 120,
        marginBottom: 32,
    },
    progressBarContainer: {
        width: '100%',
        height: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#7C3CBD',
        borderRadius: 6,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(4, 4, 4, 0.60)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default LoadingScreen;