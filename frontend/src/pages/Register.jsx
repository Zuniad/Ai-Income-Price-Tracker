import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register, clearError } from "../features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Eye, EyeOff, UserPlus, Sparkles } from "lucide-react";
import FinanceScene from "../components/FinanceScene";

const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "PKR"];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", currency: "USD" });
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);
  const formRef = useRef();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
      gsap.fromTo(
        formRef.current.querySelectorAll(".form-field"),
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out", delay: 0.3 }
      );
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register(form));
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden">
      <FinanceScene />
      <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-[2px] z-[1]" />

      <div ref={formRef} style={{ opacity: 0 }} className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-strong rounded-3xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center"
            >
              <Sparkles className="text-white" size={28} />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-gray-400 text-sm">Start tracking your finances with AI</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neon-red/10 border border-neon-red/30 text-neon-red rounded-xl px-4 py-3 mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-field">
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Username</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 outline-none transition-all text-sm"
                placeholder="johndoe"
              />
            </div>

            <div className="form-field">
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 outline-none transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="form-field">
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 outline-none transition-all text-sm pr-12"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/30 outline-none transition-all text-sm appearance-none cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c} value={c} className="bg-dark-800">{c}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-neon-purple/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-neon-green hover:text-neon-green/80 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
