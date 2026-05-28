import { getDataErrorMessage } from '@/lib/errors';
import { getRazorpayKeyId } from '@/lib/razorpay/env';
import { supabase } from '@/lib/supabase';

export type RazorpayOrderPayload = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export type CreateOrderInput = {
  amountMinor: number;
  currency?: string;
  requirementId?: string;
  description?: string;
};

export type VerifyPaymentInput = {
  paymentId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function edgeErrorMessage(err: unknown, data: unknown): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === 'string' && e.length) return e;
  }
  return getDataErrorMessage(err);
}

export async function createRazorpayOrder(input: CreateOrderInput): Promise<RazorpayOrderPayload> {
  const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
    body: {
      amountMinor: input.amountMinor,
      currency: input.currency ?? 'INR',
      requirementId: input.requirementId ?? null,
      description: input.description ?? null,
    },
  });

  if (error) throw new Error(edgeErrorMessage(error, data));

  const row = data as Partial<RazorpayOrderPayload> | null;
  if (!row?.paymentId || !row.orderId || !row.keyId) {
    throw new Error(
      typeof row === 'object' && row && 'error' in row && typeof (row as { error?: string }).error === 'string'
        ? (row as { error: string }).error
        : 'Could not start Razorpay checkout. Deploy edge functions and set Razorpay secrets in Supabase.',
    );
  }

  return {
    paymentId: row.paymentId,
    orderId: row.orderId,
    amount: Number(row.amount) || input.amountMinor,
    currency: row.currency ?? input.currency ?? 'INR',
    keyId: row.keyId || getRazorpayKeyId(),
  };
}

export async function verifyRazorpayPayment(input: VerifyPaymentInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('razorpay-verify-payment', {
    body: input,
  });

  if (error) throw new Error(edgeErrorMessage(error, data));

  if (data && typeof data === 'object' && 'ok' in data && (data as { ok?: boolean }).ok === false) {
    const msg = (data as { error?: string }).error;
    throw new Error(msg || 'Payment verification failed.');
  }
}
