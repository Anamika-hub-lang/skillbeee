import { Text, TextProps, TextStyle } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { fontSizes, fontWeights } from '@/theme';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
  center?: boolean;
};

export function AppText({
  variant = 'body',
  muted,
  center,
  style,
  children,
  ...rest
}: Props) {
  const t = useThemeColors();
  const color =
    muted ? t.muted : variant === 'caption' ? t.textSecondary : t.text;

  const byVariant: Record<Variant, Pick<TextStyle, 'fontSize' | 'fontWeight'>> = {
    hero: { fontSize: fontSizes.hero, fontWeight: fontWeights.heavy },
    title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold },
    subtitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
    body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular },
    caption: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
    label: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
  };
  const mapped = byVariant[variant];

  return (
    <Text
      {...rest}
      style={[
        { color, textAlign: center ? 'center' : 'left' },
        mapped,
        style,
      ]}>
      {children}
    </Text>
  );
}
