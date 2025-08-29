import React from 'react';
import { View, StyleSheet } from 'react-native';
import LobsterText from './LobsterText';

interface AppHeaderProps {
  title: string;
  color?: string;
  size?: number;
}

export default function AppHeader({ title, color = '#007AFF', size = 28 }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <LobsterText size={size} color={color}>
        {title}
      </LobsterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 