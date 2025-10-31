import { Text, TextProps } from 'react-native';

type VazirmatnTextProps = TextProps & {
  fontWeight?: 'Black' | 'Bold' | 'ExtraBold' | 'ExtraLight' | 'Light' | 'Medium' | 'Regular' | 'SemiBold';
};

export function VazirmatnText({ style, fontWeight = 'Regular', ...props }: VazirmatnTextProps) {
  const fontFamily = `Vazirmatn-${fontWeight}`;
  return <Text style={[{ fontFamily }, style]} {...props} />;
}
