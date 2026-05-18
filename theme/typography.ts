import { TextStyle } from 'react-native';

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  hero: 38,
} as const;

export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  heavy: '800' as TextStyle['fontWeight'],
};
