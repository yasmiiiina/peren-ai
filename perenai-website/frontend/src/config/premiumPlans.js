/**
 * Single source of truth for Premium subscriptions.
 * Amounts must stay in sync with backend/app/services/payzone_service.py PLAN_AMOUNTS_MAD
 */

export const BASIC_FEATURES = [
  "Digital Twin Setup",
  "1 Monthly Face Scan",
  "Basic Insights",
];

export const PREMIUM_FEATURES = [
  "Unlimited Face Scans",
  "PDF Export & Reports",
  "Historical Data Tracking",
  "AI Stress Analysis",
  "Wearable Integration",
  "Clinical Recommendations & Protocols",
];

/** @type {import('./premiumPlans').PremiumPlan[]} */
export const PREMIUM_PLANS = [
  {
    id: "monthly",
    planType: "monthly",
    label: "Premium Monthly",
    amount: 99,
    currency: "DH",
    billingLabel: "per month",
    highlight: null,
  },
  {
    id: "quarterly",
    planType: "quarterly",
    label: "Premium Quarterly",
    amount: 279,
    currency: "DH",
    billingLabel: "per quarter",
    highlight: "Popular",
  },
  {
    id: "yearly",
    planType: "yearly",
    label: "Premium Yearly",
    amount: 468,
    currency: "DH",
    billingLabel: "per year",
    highlight: "2 Months Free",
    monthlyEquivalent: 39,
  },
];

export const DEFAULT_PREMIUM_PLAN_ID = "quarterly";

export function getPremiumPlan(planId) {
  return PREMIUM_PLANS.find((plan) => plan.id === planId) || PREMIUM_PLANS.find((p) => p.id === DEFAULT_PREMIUM_PLAN_ID);
}

export function getPayPalPlanId(planType) {
  const envMap = {
    monthly: import.meta.env.VITE_PAYPAL_PLAN_ID_MONTHLY,
    quarterly: import.meta.env.VITE_PAYPAL_PLAN_ID_QUARTERLY,
    yearly: import.meta.env.VITE_PAYPAL_PLAN_ID_YEARLY,
  };
  return envMap[planType] || envMap.monthly;
}
