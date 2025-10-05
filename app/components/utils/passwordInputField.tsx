import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, StyleSheet, TextInputProps } from 'react-native';

interface PasswordInputFieldProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const PasswordInputField: React.FC<PasswordInputFieldProps> = ({
  value,
  onChangeText,
  style,
  ...props
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,   // sensible defaults (height/bg) so it’s visible even without a style prop
          style,
          { paddingRight: 40 }, // space for the eye icon
        ]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!passwordVisible}
        {...props}
      />
      <TouchableOpacity
        onPress={() => setPasswordVisible(v => !v)}
        style={styles.iconContainer}
        accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image
          source={
            passwordVisible
              ? require('../../assets/icons/visibility.png')
              : require('../../assets/icons/visibility_off.png')
          }
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,                 // <-- important: take the row’s remaining width
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#3A506B', // visible like your other inputs
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,               // vertically center the icon
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
});

export default PasswordInputField;
