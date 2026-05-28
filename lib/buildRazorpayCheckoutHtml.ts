import {
  RAZORPAY_CHECKOUT_CONFIG,
  RAZORPAY_CHECKOUT_THEME,
  RAZORPAY_UPI_OPTIONS,
} from '@/lib/razorpay/checkoutConfig';

export function buildRazorpayCheckoutHtml(input: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
}): string {
  const keyId = input.keyId.replace(/[^a-zA-Z0-9_-]/g, '');
  const orderId = input.orderId.replace(/[^a-zA-Z0-9_-]/g, '');
  const currency = (input.currency || 'INR').replace(/[^A-Z]/gi, '').slice(0, 8).toUpperCase() || 'INR';
  const desc = input.description.replace(/\\/g, '\\\\').replace(/'/g, "\\'").slice(0, 200);
  const amount = Math.max(1, Math.floor(Number(input.amount)) || 1);
  const configJson = JSON.stringify(RAZORPAY_CHECKOUT_CONFIG);
  const upiJson = JSON.stringify(RAZORPAY_UPI_OPTIONS);
  const themeJson = JSON.stringify(RAZORPAY_CHECKOUT_THEME);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/></head><body style="margin:0;background:#fff8e7;">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
function start() {
  var options = {
    key: '${keyId}',
    amount: ${amount},
    currency: '${currency}',
    name: 'SkillBee',
    description: '${desc}',
    order_id: '${orderId}',
    config: ${configJson},
    upi: ${upiJson},
    theme: ${themeJson},
    handler: function (response) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          ok: true,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        }));
      }
    },
    modal: {
      ondismiss: function () {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false, reason: 'dismissed' }));
        }
      }
    }
  };
  try { new Razorpay(options).open(); } catch (e) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false, reason: String(e) }));
    }
  }
}
if (document.readyState === 'complete') start();
else window.addEventListener('load', start);
</script></body></html>`;
}