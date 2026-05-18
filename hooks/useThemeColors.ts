import { useColorScheme as useRNColorScheme } from 'react-native';

import { useUIStore } from '@/stores/ui';
import type { ColorScheme } from '@/theme/colors';
import { colors } from '@/theme/colors';

export function useAppColorScheme(): ColorScheme {
  const preference = useUIStore((s) => s.colorScheme);
  const system = useRNColorScheme();
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function useThemeColors() {
  const scheme = useAppColorScheme();
  return colors[scheme];
}
