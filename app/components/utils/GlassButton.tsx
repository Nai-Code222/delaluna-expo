import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const GlassButton: React.FC<{
  title: string;
  onPress: () => void;
}> = ({ title, onPress }) => (
  <Pressable onPress={onPress}>
    <LinearGradient
      colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
      locations={[0.0115, 0.9891]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}      // inferred as ViewStyle :contentReference[oaicite:0]{index=0}
    >
      <Text style={styles.text}>  {/* now inferred as TextStyle :contentReference[oaicite:1]{index=1} */}
        {title}
      </Text>
    </LinearGradient>
  </Pressable>
);

const styles = StyleSheet.create<{
  gradient: ViewStyle;
  text: TextStyle;
}>({
  gradient: {
    width: 200,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
