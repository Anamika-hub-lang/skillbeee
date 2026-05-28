import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PaymentMethodsBar } from '@/components/payment/PaymentMethodsBar';
import { RazorpayCheckoutModal } from '@/components/RazorpayCheckoutModal';
import { AppText } from '@/components/ui/AppText';
import { BeeButton } from '@/components/ui/BeeButton';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { useDashboard } from '@/hooks/useDashboard';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';
import { formatMinor } from '@/lib/formatMoney';
import { useSessionStore } from '@/stores/session';
import { space } from '@/theme';

type PayRow = {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  createdAt: string;
};

export default function Earn() {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const { data: dash } = useDashboard();
  const rz = useRazorpayCheckout();

  const weekLabel = useMemo(() => {
    if (!dash) return '—';
    if (dash.role === 'student') return formatMinor(dash.earningsMinor, 'INR');
    if (dash.role === 'client') return formatMinor(dash.totalSpendMinor, 'INR');
    return '—';
  }, [dash]);

  const walletLabel = useMemo(() => {
    if (!dash) return '—';
    if (dash.role === 'student') return formatMinor(dash.earningsMinor, 'INR');
    if (dash.role === 'client') return formatMinor(dash.totalSpendMinor, 'INR');
    return '—';
  }, [dash]);

  const clientPayments: PayRow[] =
    dash && dash.role === 'client' && Array.isArray(dash.payments)
      ? (dash.payments as PayRow[]).slice(0, 5)
      : [];

  const quickCheckout = () => {
    void rz.startCheckout({
      amountMinor: 10_000,
      currency: 'INR',
      description: role === 'client' ? 'SkillBee test payment (₹100)' : 'SkillBee wallet top-up test',
    });
  };

  return (
    <Screen scroll>
      <RazorpayCheckoutModal
        visible={rz.visible}
        onClose={rz.close}
        order={rz.order}
        description={rz.description}
        onVerify={rz.handleVerify}
        onPaid={rz.onPaid}
      />
      <AppText variant="title" style={{ marginBottom: space.sm }}>
        {role === 'client' ? 'Payments & spend' : 'Earnings'}
      </AppText>
      <AppText variant="body" muted style={{ marginBottom: space.lg }}>
        {role === 'client'
          ? 'Pay talent securely. History syncs from your account.'
          : 'Track what you have earned from completed tasks.'}
      </AppText>

      <BeeCard tone="yellow">
        <AppText variant="caption" style={{ color: '#0A0A0A', fontWeight: '800' }}>
          {role === 'client' ? 'TOTAL SPEND (CAPTURED)' : 'EARNINGS (CREDITS)'}
        </AppText>
        <AppText variant="hero" style={{ color: '#0A0A0A', marginTop: space.sm }}>
          {weekLabel}
        </AppText>
        <AppText variant="caption" style={{ color: 'rgba(10,10,10,0.65)', marginTop: space.xs }}>
          Pulled live from your dashboard
        </AppText>
      </BeeCard>

      <View style={{ height: space.lg }} />

      <View style={{ height: space.lg }} />

      {role === 'student' ? (
        <>
          <BeeCard tone="yellow" style={{ marginBottom: space.lg }}>
            <AppText variant="caption" style={{ color: '#0A0A0A', fontWeight: '800' }}>
              MY APPLICATIONS
            </AppText>
            <AppText variant="body" style={{ color: 'rgba(10,10,10,0.78)', marginTop: space.sm }}>
              See every gig you applied to — from submit to client review, match, and payment.
            </AppText>
            <View style={{ height: space.md }} />
            <BeeButton title="View my applications" onPress={() => router.push('/my-applications')} />
          </BeeCard>
        </>
      ) : null}

      <BeeCard>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="caption" muted>
              {role === 'client' ? 'Wallet / spend snapshot' : 'Balance snapshot'}
            </AppText>
            <AppText variant="title" style={{ marginTop: space.xs }}>
              {walletLabel}
            </AppText>
          </View>
        </View>
        <PaymentMethodsBar
          hint={
            role === 'client'
              ? 'Client payments: UPI, Paytm wallet, PhonePe, net banking — Razorpay par secure.'
              : 'Test top-up: UPI / Paytm / PhonePe / net banking Razorpay checkout se.'
          }
        />
        <View style={{ height: space.sm }} />
        <BeeButton
          title={role === 'client' ? 'Pay ₹100 (UPI / Paytm / Bank)' : 'Top-up test (UPI / Paytm)'}
          onPress={quickCheckout}
          loading={rz.starting}
        />
        <View style={{ height: space.sm }} />
        <BeeButton variant="ghost" title="Custom checkout" onPress={() => router.push('/payment/checkout')} />
        <View style={{ height: space.sm }} />
        <BeeButton variant="ghost" title="Full payment history" onPress={() => router.push('/payment/history')} />
      </BeeCard>

      {role === 'client' && clientPayments.length > 0 ? (
        <>
          <View style={{ height: space.lg }} />
          <AppText variant="subtitle" style={{ marginBottom: space.sm }}>
            Recent
          </AppText>
          {clientPayments.map((p) => (
            <BeeCard key={p.id} style={{ marginBottom: space.sm }}>
              <View style={styles.rowBetween}>
                <AppText variant="subtitle">{formatMinor(p.amountMinor, p.currency)}</AppText>
                <AppText variant="caption" muted>
                  {p.status}
                </AppText>
              </View>
            </BeeCard>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
