import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type DelalunaPasswordInputRef = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
  setValue: (v: string) => void;
};

type Props = Omit<TextInputProps, 'secureTextEntry' | 'value' | 'onChangeText'> & {
  value?: string;
  onChangeText?: (text: string) => void;
};

const DelalunaPasswordInput = forwardRef<DelalunaPasswordInputRef, Props>(
  (
    {
      value,
      onChangeText,
      placeholder = 'Password',
      placeholderTextColor = 'rgba(255, 255, 255, 0.5)',
      returnKeyType = 'done',
      style,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);

    const [internalValue, setInternalValue] = useState('');
    const isControlled = typeof value === 'string';
    const currentValue = isControlled ? (value as string) : internalValue;

    const [showPassword, setShowPassword] = useState(false);

    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    React.useEffect(() => {
      const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
      const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    const handleChangeText = (text: string) => {
      if (!isControlled) setInternalValue(text);
      onChangeText?.(text);
    };

    const toggleShowPassword = () => {
      // Android-first behavior: toggling visibility should not cause keyboard flicker.
      // If the keyboard is open, dismiss it and do NOT programmatically refocus.
      if (isKeyboardVisible) {
        Keyboard.dismiss();                                                                                                                                  
        inputRef.current?.blur();
      }
      setShowPassword((s) => !s);
      if (!isKeyboardVisible) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          inputRef.current?.focus();
        },
        blur: () => {
          inputRef.current?.blur();
        },
        clear: () => {
          inputRef.current?.clear();
          if (!isControlled) setInternalValue('');
          onChangeText?.('');
        },
        getValue: () => currentValue,
        setValue: (v: string) => {
          if (!isControlled) setInternalValue(v);
          onChangeText?.(v);
        },
      }),
      [currentValue, isControlled, onChangeText]
    );

    const mergedInputStyle = useMemo(() => {
      return [styles.input, style];
    }, [style]);

    const commonProps = {
      value: currentValue,
      onChangeText: handleChangeText,
      style: mergedInputStyle,
      placeholder,
      placeholderTextColor,
      returnKeyType,
      autoCapitalize: 'none' as const,
      autoCorrect: false,
      ...rest,
    };

    return (
      <View style={styles.container}>
        <TextInput
          ref={inputRef}
          secureTextEntry={!showPassword}
          {...commonProps}
          onFocus={() => {
            inputRef.current?.focus();
          }}
        />

        <TouchableOpacity
          onPress={toggleShowPassword}
          hitSlop={10}
          activeOpacity={0.8}
          accessible
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>
      </View>
    );
  }
);

DelalunaPasswordInput.displayName = 'DelalunaPasswordInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142,68,173,0.6)',
    paddingHorizontal: 15,
    height: 48,
    width: '100%'
  },
  input: {
    flex: 1,
    color: 'white',
    paddingVertical: 10,
    paddingRight: 10,
    fontSize: 16,
  },
});

export default DelalunaPasswordInput;
