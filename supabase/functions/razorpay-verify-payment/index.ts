import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { getRazorpayCredentials, verifyRazorpaySignature } from '../_shared/razorpay.ts';
import { getServiceClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';

type Body = {
  paymentId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const userId = await getUserIdFromRequest(req);
    const body = (await req.json()) as Body;

    const paymentId = body.paymentId?.trim();
    const orderId = body.razorpay_order_id?.trim();
    const rzPaymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (!paymentId || !orderId || !rzPaymentId || !signature) {
      return jsonResponse({ error: 'Missing payment verification fields' }, 400);
    }

    const { keySecret } = getRazorpayCredentials();
    const valid = await verifyRazorpaySignature({
      orderId,
      paymentId: rzPaymentId,
      signature,
      keySecret,
    });

    if (!valid) {
      return jsonResponse({ ok: false, error: 'Invalid payment signature' }, 400);
    }

    const admin = getServiceClient();
    const { data: row, error: fetchErr } = await admin
      .from('payments')
      .select('id, status, razorpayOrderId, payerId')
      .eq('id', paymentId)
      .eq('payerId', userId)
      .maybeSingle();

    if (fetchErr || !row) {
      return jsonResponse({ error: 'Payment not found' }, 404);
    }

    if (row.razorpayOrderId && row.razorpayOrderId !== orderId) {
      return jsonResponse({ error: 'Order mismatch' }, 400);
    }

    if (row.status === 'captured') {
      return jsonResponse({ ok: true, alreadyCaptured: true });
    }

    const { error: updateErr } = await admin
      .from('payments')
      .update({
        status: 'captured',
        razorpayOrderId: orderId,
        razorpayPaymentId: rzPaymentId,
        razorpaySignature: signature,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .eq('payerId', userId);

    if (updateErr) {
      return jsonResponse({ error: updateErr.message }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    const status = msg === 'Not authenticated' ? 401 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
