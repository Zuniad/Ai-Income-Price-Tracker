import { motion } from "framer-motion";

export function PageHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center text-neon-green">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </motion.div>
  );
}

export function GlassCard({ children, className = "", ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ label, value, icon: Icon, color = "green", trend, delay = 0 }) {
  const colors = {
    green: "from-neon-green/20 to-neon-green/5 text-neon-green border-neon-green/20",
    red: "from-neon-red/20 to-neon-red/5 text-neon-red border-neon-red/20",
    blue: "from-neon-blue/20 to-neon-blue/5 text-neon-blue border-neon-blue/20",
    orange: "from-neon-orange/20 to-neon-orange/5 text-neon-orange border-neon-orange/20",
    purple: "from-neon-purple/20 to-neon-purple/5 text-neon-purple border-neon-purple/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, type: "spring", damping: 20 }}
      className={`glass rounded-2xl p-5 border bg-gradient-to-br ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        {Icon && <Icon size={20} className="opacity-60" />}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? "text-neon-green" : "text-neon-red"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% from last month
        </p>
      )}
    </motion.div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {Icon && <Icon size={48} className="text-gray-600 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-300 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-4 max-w-sm">{description}</p>
      {action}
    </motion.div>
  );
}

export function LoadingSpinner({ size = "md" }) {
  const sizes = { sm: "w-6 h-6", md: "w-10 h-10", lg: "w-16 h-16" };
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizes[size]} border-4 border-neon-green border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-gradient-to-r from-neon-green to-emerald-500 text-dark-900 font-semibold hover:shadow-lg hover:shadow-neon-green/25",
    secondary: "glass text-white hover:bg-white/10",
    danger: "bg-gradient-to-r from-neon-red to-red-600 text-white font-semibold hover:shadow-lg hover:shadow-neon-red/25",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
  };
  return (
    <button
      className={`px-4 py-2.5 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
