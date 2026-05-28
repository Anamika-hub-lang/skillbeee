import Constants from 'expo-constants';

function trimOrEmpty(v: string | undefined): string {
  return typeof v === 'string' ? v.trim() : '';
}

type Extra = { razorpayKeyId?: string };

/** Public Razorpay key (test or live). Safe to bundle — never put the secret in EXPO_PUBLIC_*. */
export function getRazorpayKeyId(): string {
  const fromEnv = trimOrEmpty(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID);
  if (fromEnv) return fromEnv;
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  return trimOrEmpty(extra.razorpayKeyId);
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayKeyId());
}
