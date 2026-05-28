import * as Linking from 'expo-linking';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { AppText } from '@/components/ui/AppText';
import { getDataErrorMessage } from '@/lib/errors';
import { buildRazorpayCheckoutHtml } from '@/lib/buildRazorpayCheckoutHtml';
import {
  isRazorpayExternalPaymentUrl,
  resolveRazorpayExternalPaymentUrl,
} from '@/lib/razorpay/checkoutConfig';
import { layout, space } from '@/theme';

type OrderPayload = {
  orderId: string;
  amount: string | number;
  currency: string;
  paymentId: string;
  keyId: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  order: OrderPayload | null;
  onPaid: () => void | Promise<void>;
  onVerify: (input: {
    paymentId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  /** Shown in Razorpay sheet (default: SkillBee wallet). */
  description?: string;
};

export function RazorpayCheckoutModal({ visible, onClose, order, onPaid, onVerify, description }: Props) {
  const [busy, setBusy] = useState(false);
  const html = useMemo(() => {
    if (!order?.keyId) return '';
    return buildRazorpayCheckoutHtml({
      keyId: order.keyId,
      orderId: order.orderId,
      amount: typeof order.amount === 'string' ? Number.parseInt(order.amount, 10) : order.amount,
      currency: order.currency,
      description: description?.trim() || 'SkillBee wallet',
    });
  }, [order, description]);

  const onMessage = useCallback(
    async (raw: string) => {
      if (!order) return;
      try {
        const msg = JSON.parse(raw) as {
          ok?: boolean;
          reason?: string;
          razorpay_payment_id?: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        };
        if (!msg.ok) {
          onClose();
          return;
        }
        if (!msg.razorpay_payment_id || !msg.razorpay_order_id || !msg.razorpay_signature) {
          onClose();
          return;
        }
        setBusy(true);
        await onVerify({
          paymentId: order.paymentId,
          razorpay_order_id: msg.razorpay_order_id,
          razorpay_payment_id: msg.razorpay_payment_id,
          razorpay_signature: msg.razorpay_signature,
        });
        await onPaid();
        onClose();
      } catch (e) {
        Alert.alert('Payment failed', getDataErrorMessage(e));
        onClose();
      } finally {
        setBusy(false);
      }
    },
    [onClose, onPaid, onVerify, order],
  );

  const openExternalPaymentApp = useCallback((url: string) => {
    const target = resolveRazorpayExternalPaymentUrl(url);
    void Linking.openURL(target).catch(() => {
      Alert.alert(
        'Open payment app',
        'Could not open the UPI / wallet app. Install PhonePe, Paytm, or Google Pay and try again.',
      );
    });
  }, []);

  const onShouldStartLoadWithRequest = useCallback(
    (event: { url: string }) => {
      const url = event.url;
      if (isRazorpayExternalPaymentUrl(url)) {
        openExternalPaymentApp(url);
        return false;
      }
      return true;
    },
    [openExternalPaymentApp],
  );

  const onNavigationStateChange = useCallback(
    (nav: WebViewNavigation) => {
      if (isRazorpayExternalPaymentUrl(nav.url)) {
        openExternalPaymentApp(nav.url);
      }
    },
    [openExternalPaymentApp],
  );

  if (!order?.keyId) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.top}>
          <Pressable onPress={onClose} hitSlop={12}>
            <AppText variant="subtitle">Close</AppText>
          </Pressable>
          {busy ? (
            <AppText variant="caption" muted style={{ marginLeft: space.md }}>
              Verifying…
            </AppText>
          ) : null}
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onMessage={(e) => void onMessage(e.nativeEvent.data)}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={onNavigationStateChange}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={Platform.OS === 'android'}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingTop: 48 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: space.sm,
  },
});
