export function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const keyId = (Deno.env.get('RAZORPAY_KEY_ID') ?? Deno.env.get('EXPO_PUBLIC_RAZORPAY_KEY_ID') ?? '').trim();
  const keySecret = (Deno.env.get('RAZORPAY_KEY_SECRET') ?? '').trim();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured on the server (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).');
  }
  return { keyId, keySecret };
}

function basicAuth(keyId: string, keySecret: string): string {
  return 'Basic ' + btoa(`${keyId}:${keySecret}`);
}

export async function createRazorpayOrderApi(input: {
  amountMinor: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: basicAuth(keyId, keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
  });

  const data = (await res.json()) as { id?: string; amount?: number; currency?: string; error?: { description?: string } };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.description ?? `Razorpay order failed (${res.status})`);
  }
  return { id: data.id, amount: data.amount ?? input.amountMinor, currency: data.currency ?? input.currency };
}

export async function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): Promise<boolean> {
  const body = `${input.orderId}|${input.paymentId}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(input.keySecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === input.signature;
}
