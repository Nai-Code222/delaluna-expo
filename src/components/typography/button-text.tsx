import React from 'react';
import { Text, TextStyle } from 'react-native';

type ButtonTextProps = {
  children: React.ReactNode;
  style?: TextStyle;
};

export const ButtonText = ({ children, style }: ButtonTextProps) => {
  return (
    <Text
      style={[
        {
          fontFamily: 'Futura-Generic',
          fontSize: 40,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: '#fff',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};
export default ButtonText;
export type { ButtonTextProps };