import React from 'react';
import { Text, TextStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: TextStyle;
};

export const BodyText = ({ children, style }: Props) => (
  <Text
    style={[
      {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 16,
        lineHeight: 24,
        color: '#ddd',
      },
      style,
    ]}
  >
    {children}
  </Text>
);

export default BodyText;
