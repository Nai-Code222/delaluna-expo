import { scale } from '@/src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';

export type PasswordInputFieldProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;   // outer wrapper
  style?: StyleProp<ViewStyle>;            // rounded shell style
  inputStyle?: StyleProp<TextStyle>;       // text style only
  togglePercent?: number;                  // 0..1 (default 0.25)
};



const PasswordInputField = forwardRef<TextInput, PasswordInputFieldProps>(
  ({ containerStyle, style, inputStyle, secureTextEntry, togglePercent = 0.25, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const [toggleW, setToggleW] = useState(0);

    const onToggleLayout = (e: LayoutChangeEvent) => {
      setToggleW(e.nativeEvent.layout.width);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        <View style={[styles.field, style]}>
          {/* Full-width input; we pad on the right so text never goes under the toggle */}
          <TextInput
            ref={ref}
            {...rest}
            secureTextEntry={secureTextEntry ?? !visible}
            style={[
              styles.input,
              inputStyle,
              { paddingRight: Math.max(toggleW, 56) + 12 }, // measured toggle width + a little breathing room
            ]}
            multiline={false}
            numberOfLines={1}
          />

          {/* Absolute toggle that owns the right 25% (or togglePercent) */}
          <TouchableOpacity
            onLayout={onToggleLayout}
            style={[
              styles.toggleWrap,
              { width: `${Math.min(Math.max(togglePercent, 0.15), 0.4) * 100}%` },
            ]}
            onPress={() => setVisible(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.toggleText}>{
            visible ? <Ionicons
                    name="eye"
                    size={scale(18)}
                    color= "#FFFFFF"
                  /> 
            : <Ionicons
                    name="eye-off"
                    size={scale(18)}
                    color= "#FFFFFF"
                  /> }
                  </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

PasswordInputField.displayName = 'PasswordInputField';
export default PasswordInputField;

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%' }, // fixed height
  // Rounded shell
  field: {
    position: 'relative',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.6)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  // Full-width input; right padding keeps clear of the toggle
  input: {
    color: '#fff',
    paddingVertical: 0,
  },
  // Overlay toggle that resizes with the field (percentage width)
  toggleWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    color: '#fff',
    opacity: 0.85,
    fontWeight: '600',
  },
});
