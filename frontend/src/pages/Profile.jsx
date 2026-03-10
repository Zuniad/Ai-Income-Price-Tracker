import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Crown, Calendar, DollarSign, Shield, Pencil, X, Check, Loader2, ArrowRightLeft } from "lucide-react";
import { PageHeader, GlassCard } from "../components/UI";
import { updateProfile } from "../features/auth/authSlice";
import { getIncomes } from "../features/income/incomeSlice";
import { getTransactions } from "../features/transactions/transactionSlice";
import { getSavings } from "../features/savings/savingsSlice";
import { getLoans } from "../features/loans/loanSlice";
import toast from "react-hot-toast";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "PKR"];
const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", CAD: "C$", AUD: "A$", PKR: "₨" };

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);
  const isPro = user?.plan === "pro";

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [saving, setSaving] = useState(false);

  const currencyChanged = currency !== (user?.currency || "USD");
  const nameChanged = name.trim() !== (user?.name || "");
  const hasChanges = currencyChanged || nameChanged;

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    if (!hasChanges) return setEditing(false);

    setSaving(true);
    try {
      const didChangeCurrency = currencyChanged;
      await dispatch(updateProfile({ name: name.trim(), currency })).unwrap();

      // Refetch all financial data so converted amounts reflect everywhere
      if (didChangeCurrency) {
        dispatch(getIncomes());
        dispatch(getTransactions());
        dispatch(getSavings());
        dispatch(getLoans());
      }

      toast.success(
        didChangeCurrency
          ? `Profile updated! All amounts converted to ${currency}`
          : "Profile updated!"
      );
      setEditing(false);
    } catch (err) {
      toast.error(err || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setCurrency(user?.currency || "USD");
    setEditing(false);
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account overview" icon={User} />

      <div className="max-w-2xl">
        {/* Avatar Card */}
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-dark-900 text-3xl font-bold flex-shrink-0"
              >
                {(editing ? name : user?.name)?.charAt(0)?.toUpperCase() || "U"}
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.name || "User"}</h2>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {isPro ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 text-xs font-semibold border border-amber-500/20">
                      <Crown size={12} /> Pro Member
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-medium border border-white/10">
                      <Shield size={12} /> Free Plan
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        </GlassCard>

        {/* Edit Form */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <GlassCard className="border border-neon-green/20">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Pencil size={16} className="text-neon-green" /> Edit Profile
                </h3>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Username</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-green/50 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-green/50 focus:outline-none transition-colors appearance-none"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c} className="bg-dark-800 text-white">
                          {CURRENCY_SYMBOLS[c]} {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Currency conversion warning */}
                  {currencyChanged && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                    >
                      <ArrowRightLeft size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-300 text-sm font-medium">Currency Conversion</p>
                        <p className="text-amber-400/70 text-xs mt-0.5">
                          All your income, expenses, savings, and loan amounts will be converted
                          from <strong>{user?.currency}</strong> ({CURRENCY_SYMBOLS[user?.currency]}) to <strong>{currency}</strong> ({CURRENCY_SYMBOLS[currency]}).
                          This action updates all existing records.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-green to-neon-blue text-dark-900 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {saving ? (currencyChanged ? "Converting..." : "Saving...") : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm disabled:opacity-40"
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details */}
        <div className="space-y-3">
          {[
            { icon: User, label: "Username", value: user?.name },
            { icon: Mail, label: "Email", value: user?.email },
            { icon: DollarSign, label: "Currency", value: user?.currency ? `${CURRENCY_SYMBOLS[user.currency]} ${user.currency}` : "$ USD" },
            { icon: Crown, label: "Subscription", value: isPro ? "Pro" : "Free" },
            { icon: Calendar, label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A" },
          ].map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white text-sm font-medium">{value || "—"}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pro Features Summary */}
        {isPro && (
          <GlassCard className="mt-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
            <div className="flex items-center gap-2 mb-3">
              <Crown size={18} className="text-amber-400" />
              <h3 className="text-white font-semibold">Pro Features Unlocked</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              {[
                "Advanced AI Analytics & Predictions",
                "Budget Optimization Advice",
                "Financial Health Score",
                "Priority Support",
                "Downloadable AI Reports",
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                  {feat}
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
