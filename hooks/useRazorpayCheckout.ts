import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { getDataErrorMessage } from '@/lib/errors';
import { createRazorpayOrder, verifyRazorpayPayment, type RazorpayOrderPayload } from '@/lib/razorpay/api';
import { isRazorpayConfigured } from '@/lib/razorpay/env';
import { queryKeys } from '@/lib/queryKeys';

export function useRazorpayCheckout() {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [order, setOrder] = useState<RazorpayOrderPayload | null>(null);
  const [description, setDescription] = useState<string | undefined>();
  const [starting, setStarting] = useState(false);

  const close = useCallback(() => {
    setVisible(false);
    setOrder(null);
    setDescription(undefined);
  }, []);

  const startCheckout = useCallback(
    async (input: {
      amountMinor: number;
      currency?: string;
      requirementId?: string;
      description?: string;
    }) => {
      if (!isRazorpayConfigured()) {
        Alert.alert(
          'Razorpay',
          'Add EXPO_PUBLIC_RAZORPAY_KEY_ID to .env and restart Expo. Deploy Supabase edge functions for order creation.',
        );
        return;
      }

      setStarting(true);
      try {
        const payload = await createRazorpayOrder({
          amountMinor: input.amountMinor,
          currency: input.currency ?? 'INR',
          requirementId: input.requirementId,
          description: input.description,
        });
        setOrder(payload);
        setDescription(input.description);
        setVisible(true);
      } catch (e) {
        Alert.alert('Checkout', getDataErrorMessage(e));
      } finally {
        setStarting(false);
      }
    },
    [],
  );

  const onPaid = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }, [queryClient]);

  const handleVerify = useCallback(
    async (input: {
      paymentId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      await verifyRazorpayPayment(input);
      await onPaid();
      Alert.alert('Payment successful', 'Your payment was captured.');
      close();
    },
    [close, onPaid],
  );

  return {
    visible,
    order,
    description,
    starting,
    startCheckout,
    close,
    handleVerify,
    onPaid,
  };
}
