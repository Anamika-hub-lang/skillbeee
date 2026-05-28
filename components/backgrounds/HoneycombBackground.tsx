import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { ColorScheme } from '@/theme/colors';

type Props = {
  scheme?: ColorScheme;
  /** `cream` = warm honey / wax lines on cream screens */
  surface?: 'default' | 'yellow' | 'cream';
  opacity?: number;
};

function edgeKey(x1: number, y1: number, x2: number, y2: number): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  const a = `${r(x1)},${r(y1)}`;
  const b = `${r(x2)},${r(y2)}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Full honeycomb / hive outline (react-native-svg Path — every edge once, no subsampling).
 * Sits behind content; `pointerEvents="none"` so taps pass through.
 */
function HoneycombBackgroundInner({
  scheme = 'light',
  surface = 'default',
  opacity = 1,
}: Props) {
  const { width: W, height: H } = useWindowDimensions();

  /** `cream` = warm wax / honey lines on cream screens (must read on #FFF8E7). */
  const stroke =
    surface === 'yellow'
      ? 'rgba(10,10,10,0.34)'
      : surface === 'cream'
        ? 'rgba(176, 110, 12, 0.48)'
        : scheme === 'dark'
          ? 'rgba(255,255,255,0.14)'
          : 'rgba(10,10,10,0.085)';

  const { pathD, strokeWidth } = useMemo(() => {
    const minSide = Math.min(W, H);
    const scale = surface === 'cream' ? 10.2 : surface === 'yellow' ? 9.1 : 11.2;
    const R = Math.min(72, Math.max(44, Math.round(minSide / scale)));
    const sqrt3 = Math.sqrt(3);
    const rows = Math.ceil(H / (1.5 * R)) + 6;
    const cols = Math.ceil(W / (sqrt3 * R)) + 6;
    const map = new Map<string, { x1: number; y1: number; x2: number; y2: number }>();

    for (let r = -3; r < rows; r++) {
      for (let q = -3; q < cols; q++) {
        const cx = sqrt3 * R * (q + 0.5 * (Math.abs(r) % 2));
        const cy = 1.5 * R * r;
        for (let k = 0; k < 6; k++) {
          const a1 = ((60 * k - 30) * Math.PI) / 180;
          const a2 = ((60 * (k + 1) - 30) * Math.PI) / 180;
          const x1 = cx + R * Math.cos(a1);
          const y1 = cy + R * Math.sin(a1);
          const x2 = cx + R * Math.cos(a2);
          const y2 = cy + R * Math.sin(a2);
          const key = edgeKey(x1, y1, x2, y2);
          if (!map.has(key)) {
            map.set(key, { x1, y1, x2, y2 });
          }
        }
      }
    }

    const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
    const parts: string[] = [];
    for (const { x1, y1, x2, y2 } of map.values()) {
      parts.push(`M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}`);
    }

    const sw =
      surface === 'cream'
        ? Math.max(1, StyleSheet.hairlineWidth * 3.2)
        : Math.max(1, StyleSheet.hairlineWidth * 2.6);

    return { pathD: parts.join(''), strokeWidth: sw };
  }, [W, H, surface]);

  return (
    <View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Path
          d={pathD}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export const HoneycombBackground = memo(HoneycombBackgroundInner);
