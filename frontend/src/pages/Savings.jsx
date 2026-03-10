import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSavings, setSavings, removeSavings } from "../features/savings/savingsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, Plus, Pencil, Trash2, Target } from "lucide-react";
import { PageHeader, GlassCard, Modal, Button, LoadingSpinner, EmptyState } from "../components/UI";
import { formatCurrency } from "../utils/calculations";
import toast from "react-hot-toast";

const now = new Date();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const initialForm = { title: "", targetAmount: "", savedAmount: "", addAmount: "", month: now.getMonth() + 1, year: now.getFullYear(), deadline: "" };

export default function Savings() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.savings);
  const { user } = useSelector((s) => s.auth);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const currency = user?.currency || "USD";

  useEffect(() => { dispatch(getSavings()); }, [dispatch]);

  const openAdd = () => { setEditId(null); setForm(initialForm); setShowModal(true); };

  const openEdit = (sv) => {
    setEditId(sv._id);
    setForm({
      title: sv.title || "",
      targetAmount: sv.targetAmount || "",
      savedAmount: sv.savedAmount || 0,
      addAmount: "",
      month: sv.month || now.getMonth() + 1,
      year: sv.year || now.getFullYear(),
      deadline: sv.deadline ? new Date(sv.deadline).toISOString().slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title || "Savings Goal",
        targetAmount: Number(form.targetAmount),
        month: Number(form.month),
        year: Number(form.year),
        deadline: form.deadline || undefined,
      };

      if (editId) {
        // Editing existing: send addAmount to increment
        if (Number(form.addAmount) > 0) {
          payload.addAmount = Number(form.addAmount);
        }
      } else {
        // Creating new: set initial savedAmount
        payload.savedAmount = Number(form.savedAmount) || 0;
      }

      await dispatch(setSavings(payload)).unwrap();
      toast.success(editId ? "Savings updated!" : "Savings goal created!");
      setShowModal(false);
      dispatch(getSavings());
    } catch (err) { toast.error(err || "Failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this savings goal?")) return;
    try {
      await dispatch(removeSavings(id)).unwrap();
      toast.success("Deleted!");
    } catch (err) { toast.error(err || "Failed"); }
  };

  const totalSaved = items.reduce((s, sv) => s + (sv.savedAmount || 0), 0);
  const totalTarget = items.reduce((s, sv) => s + (sv.targetAmount || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        subtitle="Track your progress toward financial goals"
        icon={PiggyBank}
        action={<Button onClick={openAdd} className="flex items-center gap-2"><Plus size={16} /> Add Goal</Button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <GlassCard className="border border-neon-blue/20">
          <p className="text-gray-400 text-xs">Total Saved</p>
          <p className="text-2xl font-bold text-neon-blue">{formatCurrency(totalSaved, currency)}</p>
        </GlassCard>
        <GlassCard className="border border-neon-purple/20">
          <p className="text-gray-400 text-xs">Total Target</p>
          <p className="text-2xl font-bold text-neon-purple">{formatCurrency(totalTarget, currency)}</p>
        </GlassCard>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No savings goals" description="Set your first savings target" action={<Button onClick={openAdd}>Add Goal</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {items.map((sv, i) => {
              const pct = sv.targetAmount ? Math.min(100, ((sv.savedAmount || 0) / sv.targetAmount) * 100) : 0;
              return (
                <motion.div
                  key={sv._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center">
                        <Target size={18} className="text-neon-blue" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{sv.title || "Savings Goal"}</p>
                        <p className="text-gray-500 text-xs">{monthNames[(sv.month || 1) - 1]} {sv.year}{sv.deadline ? ` · Due ${new Date(sv.deadline).toLocaleDateString()}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(sv)} className="p-1.5 hover:bg-neon-blue/10 rounded-lg text-gray-400 hover:text-neon-blue"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(sv._id)} className="p-1.5 hover:bg-neon-red/10 rounded-lg text-gray-400 hover:text-neon-red"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neon-blue font-semibold">{formatCurrency(sv.savedAmount || 0, currency)}</span>
                    <span className="text-gray-400">of {formatCurrency(sv.targetAmount || 0, currency)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${pct >= 100 ? "bg-neon-green" : "bg-gradient-to-r from-neon-blue to-neon-purple"}`}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1.5 text-right">{pct.toFixed(1)}%</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Savings Goal" : "Add Savings Goal"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Goal Name</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="e.g. Emergency Fund" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Month</label>
              <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
                {monthNames.map((m, i) => <option key={i} value={i + 1} className="bg-dark-800">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Year</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y} className="bg-dark-800">{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Target Amount</label>
              <input type="number" required min="0" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="200000" />
            </div>
            {editId ? (
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Saved So Far</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-neon-blue text-sm font-semibold">
                  {formatCurrency(form.savedAmount, currency)}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Initial Amount</label>
                <input type="number" min="0" step="0.01" value={form.savedAmount} onChange={(e) => setForm({ ...form, savedAmount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="0" />
              </div>
            )}
          </div>
          {editId && (
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Add Savings</label>
              <input type="number" min="0" step="0.01" value={form.addAmount} onChange={(e) => setForm({ ...form, addAmount: e.target.value })} className="w-full bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="Enter amount to add" />
              {Number(form.addAmount) > 0 && (
                <p className="text-emerald-400 text-xs mt-1">New total: {formatCurrency((form.savedAmount || 0) + Number(form.addAmount), currency)}</p>
              )}
            </div>
          )}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Deadline (optional)</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editId ? "Update" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
