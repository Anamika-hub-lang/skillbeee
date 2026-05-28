import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createRazorpayOrderApi, getRazorpayCredentials } from '../_shared/razorpay.ts';
import { getServiceClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';

type Body = {
  amountMinor?: number;
  currency?: string;
  requirementId?: string | null;
  description?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const userId = await getUserIdFromRequest(req);
    const body = (await req.json()) as Body;
    const amountMinor = Math.floor(Number(body.amountMinor));
    if (!Number.isFinite(amountMinor) || amountMinor < 1) {
      return jsonResponse({ error: 'Invalid amount' }, 400);
    }

    const currency = (body.currency ?? 'INR').toUpperCase().slice(0, 8) || 'INR';
    const requirementId =
      typeof body.requirementId === 'string' && body.requirementId.length ? body.requirementId : null;

    const admin = getServiceClient();
    const { keyId } = getRazorpayCredentials();

    const { data: payment, error: insertErr } = await admin
      .from('payments')
      .insert({
        amountMinor,
        currency,
        status: 'created',
        payerId: userId,
        requirementId,
        metadata: body.description ? { description: body.description } : {},
      })
      .select('id')
      .single();

    if (insertErr || !payment?.id) {
      return jsonResponse({ error: insertErr?.message ?? 'Could not create payment record' }, 500);
    }

    const rzOrder = await createRazorpayOrderApi({
      amountMinor,
      currency,
      receipt: payment.id,
      notes: {
        paymentId: payment.id,
        payerId: userId,
        ...(requirementId ? { requirementId } : {}),
      },
    });

    const { error: updateErr } = await admin
      .from('payments')
      .update({ razorpayOrderId: rzOrder.id })
      .eq('id', payment.id)
      .eq('payerId', userId);

    if (updateErr) {
      return jsonResponse({ error: updateErr.message }, 500);
    }

    return jsonResponse({
      paymentId: payment.id,
      orderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    const status = msg === 'Not authenticated' ? 401 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
