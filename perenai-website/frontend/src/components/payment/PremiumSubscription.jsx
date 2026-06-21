import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, ShieldCheck, CheckCircle2, ChevronLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

import {
  BASIC_FEATURES,
  DEFAULT_PREMIUM_PLAN_ID,
  getPayPalPlanId,
  getPremiumPlan,
  PREMIUM_FEATURES,
  PREMIUM_PLANS,
} from "../../config/premiumPlans";
import { useAuth } from "../../auth/useAuth";
import { paymentService } from "../../services/services";

export function PremiumSubscription({ initialPlanId = DEFAULT_PREMIUM_PLAN_ID }) {
  const navigate = useNavigate();
  const { fetchUser, user } = useAuth();

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [viewState, setViewState] = useState(user?.is_premium ? "pricing" : "pricing");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedPlan = getPremiumPlan(selectedPlanId);
  const displayPrice = selectedPlan.monthlyEquivalent ?? selectedPlan.amount;

  const handlePayzonePay = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data } = await paymentService.initializePayment({ plan_type: selectedPlan.planType });

      if (data.mode === "mock") {
        await paymentService.mockWebhook({ session_id: data.order_id });
        await fetchUser?.();
        setViewState("success");
        return;
      }

      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }

      throw new Error("Payzone payment URL unavailable.");
    } catch (err) {
      setErrorMessage(err.message || "Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayPalApprove = async (data) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await paymentService.verifyPayPalSubscription({ subscription_id: data.subscriptionID });
      await fetchUser?.();
      setViewState("success");
    } catch (error) {
      console.error("[PremiumSubscription] PayPal verification failed:", error);
      setErrorMessage(error.message || "PayPal verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans overflow-hidden relative pt-20 pb-12 px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-brand-green/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto relative z-10 flex-1 flex flex-col">
        {viewState !== "pricing" && viewState !== "success" && (
          <button
            onClick={() => setViewState("pricing")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 self-start"
          >
            <ChevronLeft size={20} /> Back to Plans
          </button>
        )}

        <AnimatePresence mode="wait">
          {viewState === "pricing" && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Manage Subscription</h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Choose the plan that fits your needs. Upgrade to Premium for continuous monitoring and clinician insights.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                {PREMIUM_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                      selectedPlanId === plan.id
                        ? "bg-[#1a1a1a] text-white border-brand-green/50 shadow-lg"
                        : "text-gray-400 border-white/10 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {plan.label}
                    {plan.highlight && (
                      <span className="absolute -top-2 -right-2 bg-brand-green/20 border border-brand-green/50 text-brand-green text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        {plan.highlight}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div className="bg-[#1a1a1a]/40 backdrop-blur-md rounded-3xl border border-white/10 p-8 flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Basic</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">Free</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-8">Essential tools for baseline mapping.</p>
                  <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300">
                    {BASIC_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check size={16} className="text-gray-500" /> {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={!user?.is_premium}
                    className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-colors font-medium disabled:opacity-60"
                  >
                    {user?.is_premium ? "Included in Premium" : "Current Plan"}
                  </button>
                </div>

                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-brand-green/40 p-8 flex flex-col relative shadow-[0_0_30px_rgba(34,197,94,0.1)] overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-green/0 to-brand-blue/0 group-hover:from-brand-green/10 group-hover:to-brand-blue/10 transition-colors duration-500 rounded-3xl pointer-events-none" />
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-blue to-brand-green" />

                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    {selectedPlan.label} <ShieldCheck size={18} className="text-brand-green" />
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">{displayPrice}</span>
                    <span className="text-gray-400 text-sm">{selectedPlan.currency} /mo</span>
                  </div>
                  <p className="text-sm text-brand-green mb-6">
                    Billed {selectedPlan.amount} {selectedPlan.currency} {selectedPlan.billingLabel}
                  </p>
                  <p className="text-gray-400 text-sm mb-8">Advanced telemetry and continuous tracking.</p>

                  <ul className="space-y-4 mb-8 flex-1 text-sm text-white">
                    {PREMIUM_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check size={16} className="text-brand-green" /> {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setViewState("checkout")}
                    disabled={user?.is_premium}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-green text-white font-medium hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-shadow relative z-10 disabled:opacity-60"
                  >
                    {user?.is_premium ? "Premium Active" : "Get Premium Access"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {viewState === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex-1 w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16"
            >
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-6">Secure Checkout</h2>

                <div className="flex border-b border-white/10 mb-8 w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all ${
                      paymentMethod === "card"
                        ? "border-brand-green text-brand-green font-extrabold"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Payzone (Card)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paypal")}
                    className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all ${
                      paymentMethod === "paypal"
                        ? "border-brand-green text-brand-green font-extrabold"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    PayPal
                  </button>
                </div>

                <div className="space-y-6">
                  {errorMessage && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {isSubmitting ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mb-4" />
                      <p className="text-gray-400 font-medium">Processing your transaction securely...</p>
                    </div>
                  ) : paymentMethod === "card" ? (
                    <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-6 max-w-lg">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        You will be redirected to the secure <strong className="text-white">Payzone Maroc</strong> payment page.
                        No card data is collected on Peren AI (PCI-DSS compliant).
                      </p>
                      <button
                        type="button"
                        onClick={handlePayzonePay}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-blue to-brand-green text-white font-bold hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all"
                      >
                        Pay via Payzone ({selectedPlan.amount} {selectedPlan.currency})
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 max-w-lg">
                      <PayPalScriptProvider
                        options={{
                          "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
                          components: "buttons",
                          intent: "subscription",
                          vault: true,
                        }}
                      >
                        <PayPalButtons
                          style={{ shape: "rect", color: "blue", layout: "vertical", label: "subscribe" }}
                          createSubscription={(_data, actions) =>
                            actions.subscription.create({ plan_id: getPayPalPlanId(selectedPlan.planType) })
                          }
                          onApprove={handlePayPalApprove}
                          onError={(err) => {
                            console.error("[PremiumSubscription] PayPal error:", err);
                            setErrorMessage("PayPal checkout failed. Please try again.");
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-6 mt-8 pt-6 border-t border-white/10 max-w-lg">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <Lock size={14} className="text-brand-green" />
                      Secure SSL 256-bit Encryption
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <ShieldCheck size={14} className="text-brand-blue" />
                      PCI-DSS Certified Gateway
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[400px]">
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 sticky top-24">
                  <h3 className="text-xl font-semibold mb-6">Order Summary</h3>
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-gray-300">PEREN AI Premium</span>
                    <span className="text-white font-medium">{selectedPlan.label}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6 text-sm">
                    <span className="text-gray-300">Billing</span>
                    <span className="text-white font-medium capitalize">{selectedPlan.billingLabel}</span>
                  </div>
                  <div className="border-t border-white/10 pt-6 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-300">Total Due Today</span>
                      <span className="text-3xl font-bold">
                        {selectedPlan.amount} {selectedPlan.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center py-20"
            >
              <div className="w-24 h-24 bg-brand-green/20 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-brand-green/20 rounded-full animate-ping" />
                <CheckCircle2 size={48} className="text-brand-green" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Welcome to Premium!</h2>
              <p className="text-gray-400 text-lg mb-10 text-center max-w-md">
                Your payment was successful. Your account has been upgraded and you now have access to all advanced features.
              </p>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
