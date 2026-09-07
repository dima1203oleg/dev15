/**
 * Public commercial policy defaults.
 *
 * These values describe the target offer only; they do not authorize billing
 * or activate a subscription. The verified billing provider remains the
 * source of truth for localized prices, VAT, consent and trial state.
 */
export const commercialPolicy = {
  planCode: 'PREMIUM_MONTHLY',
  displayName: 'Premium Monthly',
  basePriceUsd: '1.00',
  trialDays: 30,
} as const;
