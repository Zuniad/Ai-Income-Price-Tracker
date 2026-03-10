import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlans, fetchSubStatus, activate, verify, resend, cancel, fetchHistory, clearSubError, clearSubSuccess, resetOtpState } from "../features/subscription/subscriptionSlice";
import { loadUser } from "../features/auth/authSlice";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Check, Zap, Shield, History } from "lucide-react";
import { PageHeader, GlassCard, Button, Modal, LoadingSpinner } from "../components/UI";
import toast from "react-hot-toast";

export default function Subscription() {
  const dispatch = useDispatch();
  const { plans, status, history, otpSent, loading, verifying, error, successMessage } = useSelector((s) => s.subscription);
  const { user } = useSelector((s) => s.auth);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [otp, setOtp] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const isPro = user?.plan === "pro";

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchSubStatus());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSubSuccess());
    }
    if (error) {
      toast.error(error);
      dispatch(clearSubError());
    }
  }, [successMessage, error, dispatch]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    if (!email && user?.email) setEmail(user.email);
    setShowPaymentForm(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    dispatch(activate({
      duration: selectedPlan.interval,
      cardNumber: cardNumber.replace(/\s/g, ""),
      phoneNumber,
      email,
    }));
    setShowPaymentForm(false);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    dispatch(verify({ otp })).then((res) => {
      if (!res.error) {
        setOtp("");
        dispatch(resetOtpState());
        dispatch(loadUser());
      }
    });
  };

  const handleCancel = () => {
    if (!confirm("Cancel your Pro subscription?")) return;
    dispatch(cancel()).then(() => dispatch(loadUser()));
  };

  const proFeatures = [
    "Advanced AI Analytics",
    "Spending Predictions",
    "Budget Optimization AI",
    "Financial Health Score",
    "Priority AI Processing",
    "Downloadable Reports",
  ];

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Unlock the full power of AI" icon={Crown} />

      {/* Current Status */}
      {isPro && (
        <GlassCard className="mb-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Crown size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Pro Active</h3>
                <p className="text-gray-400 text-sm">
                  {status?.plan || "pro"} plan
                  {status?.expiresAt && ` · Expires: ${new Date(status.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setShowHistory(true); dispatch(fetchHistory()); }} className="text-xs">
                <History size={14} className="mr-1.5" /> History
              </Button>
              <Button variant="danger" onClick={handleCancel} className="text-xs">Cancel</Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Plans */}
      {!isPro && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {(Array.isArray(plans) ? plans : []).map((plan, i) => (
              <motion.div
                key={plan._id || i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-strong rounded-2xl p-6 border relative overflow-hidden ${
                  plan.interval === "yearly" ? "border-amber-500/30" : "border-white/10"
                }`}
              >
                {plan.interval === "yearly" && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-dark-900 text-xs font-bold px-3 py-1 rounded-full">
                    BEST VALUE
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-white font-bold text-xl mb-1">{plan.name || plan.interval}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400 text-sm">/{plan.interval === "yearly" ? "year" : "month"}</span>
                  </div>
                  {plan.interval === "yearly" && (
                    <p className="text-neon-green text-xs mt-1">Save ${(9.99 * 12 - plan.price).toFixed(2)}/year</p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {proFeatures.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check size={14} className="text-neon-green flex-shrink-0" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => handleSelectPlan(plan)} disabled={loading} className="w-full flex items-center justify-center gap-2">
                  {loading && selectedPlan?.interval === plan.interval ? (
                    <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Zap size={16} /> Upgrade to Pro</>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Free Plan Comparison */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-gray-400" />
              <h3 className="text-white font-semibold">Free Plan (Current)</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              {["Basic AI Chat", "Income & Expense Tracking", "Basic Insights", "Up to 50 transactions/month"].map((f, i) => (
                <li key={i} className="flex items-center gap-2"><Check size={14} className="text-gray-500" /> {f}</li>
              ))}
            </ul>
          </GlassCard>
        </>
      )}

      {/* Payment Form Modal */}
      <Modal open={showPaymentForm && !otpSent} onClose={() => { setShowPaymentForm(false); setSelectedPlan(null); }} title="Payment Details">
        <p className="text-gray-400 text-sm mb-4">
          Upgrading to <span className="text-white font-semibold">{selectedPlan?.name}</span> — ${selectedPlan?.price}/{selectedPlan?.interval === "yearly" ? "year" : "month"}
        </p>
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Card Number</label>
            <input
              type="text"
              required
              minLength={13}
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="1234 5678 9012 3456"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 transition-all"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Phone Number</label>
            <input
              type="tel"
              required
              minLength={10}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+\-\s]/g, ""))}
              placeholder="+1 234 567 8900"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 transition-all"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Email (for OTP verification)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowPaymentForm(false); setSelectedPlan(null); }} className="flex-1 text-xs">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" /> : "Proceed & Send OTP"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* OTP Modal */}
      <Modal open={otpSent} onClose={() => dispatch(resetOtpState())} title="Enter Verification OTP">
        <p className="text-gray-400 text-sm mb-4">We sent a 6-digit OTP to your email. Enter it below to activate Pro.</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-neon-green/50"
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => dispatch(resend())} className="flex-1 text-xs">Resend OTP</Button>
            <Button type="submit" disabled={verifying || otp.length !== 6} className="flex-1">
              {verifying ? <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" /> : "Verify & Activate"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Subscription History">
        {(Array.isArray(history) ? history : []).length === 0 ? (
          <p className="text-gray-500 text-sm">No history yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="glass rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{h.plan || h.interval} Plan</p>
                  <p className="text-gray-500 text-xs">{new Date(h.date || h.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.status === "active" ? "bg-neon-green/10 text-neon-green" : "bg-gray-500/10 text-gray-400"}`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
