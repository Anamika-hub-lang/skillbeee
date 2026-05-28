import { Ionicons } from '@expo/vector-icons';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { useMemo, useState } from 'react';

import { Pressable, StyleSheet, TextInput, View } from 'react-native';



import { PaymentMethodsBar } from '@/components/payment/PaymentMethodsBar';
import { RazorpayCheckoutModal } from '@/components/RazorpayCheckoutModal';

import { AppText } from '@/components/ui/AppText';

import { BeeButton } from '@/components/ui/BeeButton';

import { BeeCard } from '@/components/ui/BeeCard';

import { Screen } from '@/components/ui/Screen';

import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';

import { useThemeColors } from '@/hooks/useThemeColors';

import { formatMinor } from '@/lib/formatMoney';

import { fontSizes, radii, space } from '@/theme';



function numParam(v: string | string[] | undefined): string {

  if (v == null) return '';

  return Array.isArray(v) ? v[0] : v;

}



export default function PaymentCheckout() {

  const router = useRouter();

  const t = useThemeColors();

  const rz = useRazorpayCheckout();

  const p = useLocalSearchParams<{

    amountMinor?: string | string[];

    currency?: string | string[];

    requirementId?: string | string[];

    title?: string | string[];

  }>();



  const initialMinor = numParam(p.amountMinor);

  const initialCur = numParam(p.currency) || 'INR';

  const requirementId = numParam(p.requirementId) || '';

  const title = numParam(p.title) || 'SkillBee payment';



  const [amountMinor, setAmountMinor] = useState(initialMinor || '10000');

  const [currency, setCurrency] = useState(initialCur);



  const preview = useMemo(() => {

    const n = Number.parseInt(amountMinor, 10);

    if (!Number.isFinite(n) || n < 1) return '—';

    return formatMinor(n, currency);

  }, [amountMinor, currency]);



  const startPay = () => {

    const n = Number.parseInt(amountMinor, 10);

    if (!Number.isFinite(n) || n < 1) return;

    void rz.startCheckout({

      amountMinor: n,

      currency,

      requirementId: requirementId || undefined,

      description: title,

    });

  };



  return (

    <>

      <Stack.Screen options={{ headerShown: false }} />

      <RazorpayCheckoutModal

        visible={rz.visible}

        onClose={rz.close}

        order={rz.order}

        description={rz.description ?? title}

        onVerify={rz.handleVerify}

        onPaid={rz.onPaid}

      />

      <Screen scroll>

        <View style={styles.top}>

          <Pressable onPress={() => router.back()} hitSlop={12}>

            <Ionicons name="chevron-back" size={26} color={t.text} />

          </Pressable>

          <AppText variant="title" style={{ marginLeft: space.md, flex: 1 }}>

            Checkout

          </AppText>

        </View>



        <AppText variant="body" muted style={{ marginBottom: space.lg }}>

          {title}

        </AppText>



        <BeeCard>

          <AppText variant="subtitle" style={{ marginBottom: space.sm }}>

            Amount (minor units)

          </AppText>

          <AppText variant="caption" muted style={{ marginBottom: space.sm }}>

            Razorpay expects the smallest currency unit (e.g. paise for INR).

          </AppText>

          <TextInput

            keyboardType="number-pad"

            value={amountMinor}

            onChangeText={setAmountMinor}

            style={[styles.input, { color: t.text, borderColor: t.border }]}

          />

          <AppText variant="subtitle" style={{ marginTop: space.lg, marginBottom: space.sm }}>

            Currency

          </AppText>

          <TextInput

            autoCapitalize="characters"

            value={currency}

            onChangeText={setCurrency}

            style={[styles.input, { color: t.text, borderColor: t.border }]}

          />

          <AppText variant="caption" muted style={{ marginTop: space.md }}>

            You pay ≈ {preview}

          </AppText>

        </BeeCard>



        <PaymentMethodsBar />

        <View style={{ height: space.md }} />

        <BeeButton
          title="Pay — UPI, Paytm, PhonePe, Net Banking"
          onPress={startPay}
          loading={rz.starting}
        />

        <View style={{ height: space.md }} />

        <BeeButton variant="ghost" title="Payment history" onPress={() => router.push('/payment/history')} />

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

  input: {

    borderWidth: 1,

    borderRadius: radii.lg,

    padding: space.md,

    fontSize: fontSizes.md,

  },

});

