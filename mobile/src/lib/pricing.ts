export const PRICING_USD = {
  monthly: 1500,
  annual: 9900,
} as const

export type SubscriptionPlan = keyof typeof PRICING_USD

export const TRIAL_DAYS = 7

export function planLabel(plan: SubscriptionPlan) {
  return plan === 'monthly' ? '$15/month' : '$99/year'
}
