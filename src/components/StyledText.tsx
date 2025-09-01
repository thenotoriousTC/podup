import { Text, TextProps } from 'react-native';

type StyledTextProps = TextProps & {
  fontWeight?: 'Black' | 'Bold' | 'ExtraBold' | 'ExtraLight' | 'Light' | 'Medium' | 'Regular' | 'SemiBold';
};

export function StyledText({ style, fontWeight = 'Regular', ...props }: StyledTextProps) {
  const fontFamily = `Cairo-${fontWeight}`;
  return <Text style={[{ fontFamily }, style]} {...props} />;
}
