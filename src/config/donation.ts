const configuredPayPalDonateUrl = String(import.meta.env.VITE_PAYPAL_DONATE_URL || "").trim();

export const PAYPAL_DONATE_URL = configuredPayPalDonateUrl || "https://www.paypal.com/donate";
export const HAS_CUSTOM_PAYPAL_DONATE_URL = configuredPayPalDonateUrl.length > 0;
