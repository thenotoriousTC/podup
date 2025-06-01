import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface LobsterTextProps extends TextProps {
  size?: number;
  color?: string;
}

export default function LobsterText({ 
  children, 
  style, 
  size = 20, 
  color = '#007AFF',
  ...props 
}: LobsterTextProps) {
  return (
    <Text 
      style={[
        styles.text, 
        { fontSize: size, color }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Lobster_400Regular',
  },
}); 