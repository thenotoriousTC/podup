import { Text, TextProps } from 'react-native';

interface PacificoTextProps extends TextProps {
  children: React.ReactNode;
}

export function PacificoText({ children, style, ...props }: PacificoTextProps) {
  return (
    <Text
      style={[
        { fontFamily: 'Pacifico-Regular' },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
