import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BeeCard } from '@/components/ui/BeeCard';
import { Screen } from '@/components/ui/Screen';
import { useDashboard } from '@/hooks/useDashboard';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatMinor } from '@/lib/formatMoney';
import { space } from '@/theme';

type PayRow = {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  createdAt: string;
};

export default function PaymentHistory() {
  const router = useRouter();
  const t = useThemeColors();
  const { data: dash } = useDashboard();

  const payments: PayRow[] =
    dash && dash.role === 'client' && Array.isArray(dash.payments)
      ? (dash.payments as PayRow[])
      : [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll={false}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={t.text} />
          </Pressable>
          <AppText variant="title" style={{ marginLeft: space.md, flex: 1 }}>
            Payments
          </AppText>
        </View>

        {dash?.role === 'student' ? (
          <AppText variant="body" muted>
            Payment history is available on the client account (payer). Students see earnings on the
            Earn tab.
          </AppText>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: space.xxxl }}>
            {payments.length === 0 ? (
              <AppText variant="body" muted>
                No payments yet. Completed checkouts appear here.
              </AppText>
            ) : (
              payments.map((p) => (
                <BeeCard key={p.id} style={{ marginBottom: space.md }}>
                  <View style={styles.row}>
                    <AppText variant="subtitle">{formatMinor(p.amountMinor, p.currency)}</AppText>
                    <AppText variant="caption" muted>
                      {p.status}
                    </AppText>
                  </View>
                  <AppText variant="caption" muted style={{ marginTop: space.xs }}>
                    {new Date(p.createdAt).toLocaleString()}
                  </AppText>
                </BeeCard>
              ))
            )}
          </ScrollView>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
