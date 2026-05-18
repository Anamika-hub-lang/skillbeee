import { Platform, ViewStyle } from 'react-native';

const iosShadow = (
  y: number,
  blur: number,
  opacity: number,
): Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius'> => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: blur,
});

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: { ...iosShadow(8, 24, 0.08) },
    android: { elevation: 6 },
    default: {},
  }),
  soft: Platform.select<ViewStyle>({
    ios: { ...iosShadow(4, 16, 0.06) },
    android: { elevation: 3 },
    default: {},
  }),
  float: Platform.select<ViewStyle>({
    ios: { ...iosShadow(12, 28, 0.12) },
    android: { elevation: 10 },
    default: {},
  }),
};
