import { ImageBackground, StyleSheet } from "react-native";

export default function ChatScreen() {
    return (
         <ImageBackground
           source={require('../assets/images/mainBackground.png')}
           style={styles.background}
           resizeMode="cover"
         >
        </ImageBackground>
      )
    }
    
    const styles = StyleSheet.create({
        background: {
            flex: 1
        },
    });