import React from 'react';
import { Pressable as RNPressable, PressableProps } from 'react-native';

/**
 * Custom Pressable wrapper that disables the Android click sound by default.
 * 
 * This component wraps React Native's Pressable and automatically sets
 * android_disableSound={true} to prevent the annoying system click sound
 * on Android devices.
 * 
 * @example
 * ```tsx
 * <Pressable onPress={() => console.log('Pressed!')}>
 *   <Text>Click me silently</Text>
 * </Pressable>
 * ```
 * 
 * @example
 * // To enable sound (if needed):
 * <Pressable android_disableSound={false} onPress={() => {}}>
 *   <Text>Click me with sound</Text>
 * </Pressable>
 */
export const Pressable: React.FC<PressableProps> = ({ 
  android_disableSound = true,
  ...props 
}) => {
  return <RNPressable android_disableSound={android_disableSound} {...props} />;
};

// Also export as default for flexibility
export default Pressable;
