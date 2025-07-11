import { ImageBackground, StyleSheet } from "react-native";

export default function TransitsScreen() {
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