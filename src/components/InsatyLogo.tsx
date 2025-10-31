import React from 'react';
import { Image } from 'expo-image';
import { ImageStyle } from 'react-native';

interface InsatyLogoProps {
  width?: number;
  height?: number;
  style?: ImageStyle;
}

export function InsatyLogo({ width = 200, height = 120, style }: InsatyLogoProps) {
  return (
    <Image
      source={require('../../assets/insaty-logo-orange.svg')}
      style={[{ width, height }, style]}
      contentFit="contain"
    />
  );
}
