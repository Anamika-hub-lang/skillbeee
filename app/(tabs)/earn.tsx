import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { useSessionStore } from '@/stores/session';
import { useThemeColors } from '@/hooks/useThemeColors';
import { space } from '@/theme';

const WEEK = [
  { label: 'M', v: 42 },
  { label: 'T', v: 68 },
  { label: 'W', v: 55 },
  { label: 'T', v: 90 },
  { label: 'F', v: 120 },
  { label: 'S', v: 74 },
  { label: 'S', v: 88 },
];

export default function Earn() {
  const t = useThemeColors();
  const role = useSessionStore((s) => s.role);

  return (
    <Screen scroll>
      <AppText variant="title" style={{ marginBottom: space.sm }}>
        {role === 'client' ? 'Spend insights' : 'Earnings'}
      </AppText>
      <AppText variant="body" muted style={{ marginBottom: space.lg }}>
        weekly pulse — clean, calm, addictive.
      </AppText>

      <BeeCard tone="yellow">
        <AppText variant="caption" style={{ color: '#0A0A0A', fontWeight: '800' }}>
          THIS WEEK
        </AppText>
        <AppText variant="hero" style={{ color: '#0A0A0A', marginTop: space.sm }}>
          $482
        </AppText>
        <AppText variant="caption" style={{ color: 'rgba(10,10,10,0.65)', marginTop: space.xs }}>
          +18% vs last week
        </AppText>
      </BeeCard>

      <View style={{ height: space.lg }} />

      <BeeCard>
        <AppText variant="subtitle" style={{ marginBottom: space.md }}>
          Daily rhythm
        </AppText>
        <View style={styles.chart}>
          {WEEK.map((d, idx) => (
            <View key={`${d.label}-${idx}`} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  {
                    height: d.v,
                    backgroundColor: t.primary,
                  },
                ]}
              />
              <AppText variant="caption" muted style={{ marginTop: space.xs }}>
                {d.label}
              </AppText>
            </View>
          ))}
        </View>
      </BeeCard>

      <View style={{ height: space.lg }} />

      <BeeCard>
        <View style={styles.rowBetween}>
          <View>
            <AppText variant="caption" muted>
              Wallet balance
            </AppText>
            <AppText variant="title" style={{ marginTop: space.xs }}>
              $1,240
            </AppText>
          </View>
          <BeeButton
            title="Withdraw"
            onPress={() =>
              Alert.alert('Withdraw', 'Wire Stripe / payouts via your Supabase backend.')
            }
          />
        </View>
      </BeeCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  barWrap: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 10,
    borderRadius: 999,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
