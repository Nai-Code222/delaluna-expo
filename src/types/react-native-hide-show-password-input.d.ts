declare module 'react-native-hide-show-password-input' {
  import * as React from 'react';
  import { TextInputProps } from 'react-native';

  export interface PasswordInputTextProps extends TextInputProps {}

  const PasswordInputText: React.ComponentType<PasswordInputTextProps>;

  export default PasswordInputText;

  
}