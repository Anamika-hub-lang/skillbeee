import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/hooks/useThemeColors';
import { RAZORPAY_ENABLE_UPI_WALLETS_HINT } from '@/lib/razorpay/checkoutConfig';
import { palette, radii, space } from '@/theme';

const METHODS = [
  { key: 'upi', label: 'UPI', icon: 'phone-portrait-outline' as const },
  { key: 'phonepe', label: 'PhonePe', icon: 'flash-outline' as const },
  { key: 'paytm', label: 'Paytm', icon: 'wallet-outline' as const },
  { key: 'netbanking', label: 'Net Banking', icon: 'business-outline' as const },
  { key: 'card', label: 'Cards', icon: 'card-outline' as const },
] as const;

type Props = {
  /** Optional subtitle under the title */
  hint?: string;
};

export function PaymentMethodsBar({ hint }: Props) {
  const t = useThemeColors();

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" muted style={styles.title}>
        Pay via Razorpay
      </AppText>
      <View style={styles.row}>
        {METHODS.map((m) => (
          <View
            key={m.key}
            style={[styles.chip, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Ionicons name={m.icon} size={14} color={palette.black} />
            <AppText variant="caption" style={styles.chipLabel}>
              {m.label}
            </AppText>
          </View>
        ))}
      </View>
      <AppText variant="caption" muted style={styles.footer}>
        {hint ??
          'PhonePe, Paytm, Google Pay, net banking & cards — sab Razorpay secure checkout se.'}
      </AppText>
      <AppText variant="caption" muted style={styles.dashboardHint}>
        {RAZORPAY_ENABLE_UPI_WALLETS_HINT}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
  },
  title: {
    marginBottom: space.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    marginTop: space.sm,
    lineHeight: 18,
  },
  dashboardHint: {
    marginTop: space.sm,
    lineHeight: 18,
    color: palette.gray600,
  },
});
