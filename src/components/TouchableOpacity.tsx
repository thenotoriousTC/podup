import React from 'react';
import { TouchableOpacity as RNTouchableOpacity, TouchableOpacityProps } from 'react-native';

/**
 * Custom TouchableOpacity component that disables Android's click sound by default.
 * 
 * This wrapper automatically adds touchSoundDisabled={true} to prevent
 * the clicking sound on Android devices while maintaining all other
 * TouchableOpacity functionality.
 * 
 * Usage: Import this instead of React Native's TouchableOpacity
 * import { TouchableOpacity } from '@/components/TouchableOpacity';
 * 
 * Based on official React Native documentation:
 * https://reactnative.dev/docs/touchablewithoutfeedback#touchsounddisabled
 */
export const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  touchSoundDisabled, // Disable sound by default on Android
  ...props
}) => {
  return <RNTouchableOpacity touchSoundDisabled={touchSoundDisabled} {...props} />;
};
