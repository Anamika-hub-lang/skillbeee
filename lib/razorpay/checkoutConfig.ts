/**
 * Razorpay Standard Checkout — India methods.
 * Do NOT use custom `blocks` here: empty UPI/wallet blocks hide those options when
 * the merchant has only card/netbanking partially configured. Use native Razorpay layout.
 */
export const RAZORPAY_CHECKOUT_CONFIG = {
  display: {
    sequence: ['upi', 'wallet', 'netbanking', 'card'],
    preferences: {
      show_default_blocks: true,
    },
  },
} as const;

/** Mobile WebView: prefer UPI intent so PhonePe / GPay / Paytm apps open on Android. */
export const RAZORPAY_UPI_OPTIONS = {
  flow: 'intent',
} as const;

export const RAZORPAY_CHECKOUT_THEME = {
  color: '#FFC629',
  backdrop_color: '#FFF8E7',
} as const;

/** Deep-link / intent schemes opened by Razorpay for UPI & wallet apps (mobile WebView). */
export const RAZORPAY_EXTERNAL_PAYMENT_PREFIXES = [
  'upi://',
  'tez://',
  'gpay://',
  'phonepe://',
  'paytmmp://',
  'paytm://',
  'bhim://',
  'credpay://',
  'mobikwik://',
  'freecharge://',
  'amazonpay://',
  'intent://',
] as const;

export function isRazorpayExternalPaymentUrl(url: string): boolean {
  const lower = url.trim().toLowerCase();
  return RAZORPAY_EXTERNAL_PAYMENT_PREFIXES.some((p) => lower.startsWith(p));
}

/** Android Razorpay UPI often redirects via `intent://`; extract a openable URL when possible. */
export function resolveRazorpayExternalPaymentUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.toLowerCase().startsWith('intent://')) return trimmed;

  const schemeMatch = trimmed.match(/[#&;]scheme=([^;&#]+)/i);
  if (schemeMatch?.[1]) {
    const path = trimmed.replace(/^intent:\/\//i, '').split('#')[0];
    return `${decodeURIComponent(schemeMatch[1])}://${path}`;
  }

  const fallbackMatch = trimmed.match(/S\.browser_fallback_url=([^;&#]+)/i);
  if (fallbackMatch?.[1]) {
    return decodeURIComponent(fallbackMatch[1]);
  }

  return trimmed;
}

/** Shown in-app when UPI/wallets are missing — almost always a Dashboard setting. */
export const RAZORPAY_ENABLE_UPI_WALLETS_HINT =
  'Sirf Card / Net Banking dikh rahe hain? Razorpay Dashboard → Settings → Payment Methods → UPI aur Wallets (Paytm, PhonePe) ON karein, phir app reload karein.';
