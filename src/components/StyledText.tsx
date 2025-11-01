import { Text, TextProps } from 'react-native';

type StyledTextProps = TextProps & {
  fontWeight?: 'Black' | 'Bold' | 'ExtraBold' | 'ExtraLight' | 'Light' | 'Medium' | 'Regular' | 'SemiBold';
};

export function StyledText({ style, fontWeight = 'Regular', ...props }: StyledTextProps) {
  // Map font weights to available Almarai weights
  const fontWeightMap: Record<string, string> = {
    'Black': 'ExtraBold',
    'Bold': 'Bold',
    'ExtraBold': 'ExtraBold',
    'ExtraLight': 'Light',
    'Light': 'Light',
    'Medium': 'Regular',
    'Regular': 'Regular',
    'SemiBold': 'Bold',
  };
  
  const mappedWeight = fontWeightMap[fontWeight] || 'Regular';
  const fontFamily = `Almarai-${mappedWeight}`;
  
  return <Text style={[{ fontFamily }, style]} {...props} />;
}
