// PronounToggle.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PRONOUNS = ['She/Her', 'He/Him', 'Non Binary'];

interface PronounToggleProps {
  selectedIndex: number;
  onChange: (newIndex: number) => void;
}

export default function PronounToggle({
  selectedIndex,
  onChange,
}: PronounToggleProps) {
  const [width, setWidth] = React.useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const segmentWidth = width / PRONOUNS.length;

  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.0)']}
      start={[0, 0]}
      end={[0, 1]}
      style={styles.outer}
    >
      <View style={styles.inner} onLayout={onLayout}>
        {width > 0 && (
          <View
            style={[
              styles.slider,
              {
                width: segmentWidth,
                transform: [{ translateX: selectedIndex * segmentWidth }],
              },
            ]}
          />
        )}

        {PRONOUNS.map((label, i) => (
          <TouchableOpacity
            key={label}
            style={styles.segment}
            activeOpacity={0.8}
            onPress={() => onChange(i)}
          >
            <Text
              style={[
                styles.text,
                i === selectedIndex && styles.textSelected,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 30,
    padding: 3,
    marginVertical: 12,
    width: '70%',
    alignSelf: 'center',
  },
  inner: {
    flexDirection: 'row',
    position: 'relative',
    borderRadius: 25,
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderRadius: 25,
    
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  text: {
    color: '#EEE',
    fontWeight: '600',
  },
  textSelected: {
    color: '#1C2541',
    fontWeight: '700',
  },
});
// This component is a toggle switch for selecting pronouns. It uses a gradient background and animates the slider to indicate the selected option.