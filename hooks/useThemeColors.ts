import type { ColorScheme } from '@/theme/colors';
import { colors } from '@/theme/colors';

/** App is light-mode only. */
export function useAppColorScheme(): ColorScheme {
  return 'light';
}

export function useThemeColors() {
  return colors.light;
}
