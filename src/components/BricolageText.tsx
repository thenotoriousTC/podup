import { Text, TextProps } from 'react-native';

type BricolageTextProps = TextProps & {
  fontWeight?: 'Black' | 'Bold' | 'ExtraBold' | 'ExtraLight' | 'Light' | 'Medium' | 'Regular' | 'SemiBold';
};

export function BricolageText({ style, fontWeight = 'Regular', ...props }: BricolageTextProps) {
  const fontFamily = `BricolageGrotesque-${fontWeight}`;
  return <Text style={[{ fontFamily }, style]} {...props} />;
}
