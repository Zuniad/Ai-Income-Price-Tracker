import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getIncomes, createIncome, editIncome, removeIncome } from "../features/income/incomeSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plus, Pencil, Trash2, X, DollarSign } from "lucide-react";
import { PageHeader, GlassCard, Modal, Button, LoadingSpinner, EmptyState } from "../components/UI";
import { formatCurrency } from "../utils/calculations";
import toast from "react-hot-toast";

const SOURCES = ["salary", "freelance", "business", "investment", "rental", "other"];
const now = new Date();
const initialForm = { source: "salary", amount: "", month: now.getMonth() + 1, year: now.getFullYear(), notes: "" };

export default function Income() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.income);
  const { user } = useSelector((s) => s.auth);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const currency = user?.currency || "USD";

  useEffect(() => { dispatch(getIncomes()); }, [dispatch]);

  const openAdd = () => { setForm(initialForm); setEditingId(null); setShowModal(true); };
  const openEdit = (item) => {
    setForm({
      source: item.source || "salary",
      amount: item.amount || "",
      month: item.month || now.getMonth() + 1,
      year: item.year || now.getFullYear(),
      notes: item.notes || "",
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { source: form.source, amount: Number(form.amount), month: Number(form.month), year: Number(form.year), notes: form.notes };
    try {
      if (editingId) {
        await dispatch(editIncome({ id: editingId, data: payload })).unwrap();
        toast.success("Income updated!");
      } else {
        await dispatch(createIncome(payload)).unwrap();
        toast.success("Income added!");
      }
      setShowModal(false);
    } catch (err) { toast.error(err || "Failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this income?")) return;
    try {
      await dispatch(removeIncome(id)).unwrap();
      toast.success("Deleted!");
    } catch (err) { toast.error(err || "Failed"); }
  };

  const totalIncome = items.reduce((s, i) => s + (i.amount || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle="Manage your income sources"
        icon={Wallet}
        action={
          <Button onClick={openAdd} className="flex items-center gap-2">
            <Plus size={16} /> Add Income
          </Button>
        }
      />

      {/* Total */}
      <GlassCard className="mb-6 border border-neon-green/20 bg-gradient-to-r from-neon-green/5 to-transparent">
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-neon-green" />
          <div>
            <p className="text-gray-400 text-sm">Total Income</p>
            <p className="text-2xl font-bold text-neon-green">{formatCurrency(totalIncome, currency)}</p>
          </div>
        </div>
      </GlassCard>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState icon={Wallet} title="No income yet" description="Add your first income source to start tracking" action={<Button onClick={openAdd}>Add Income</Button>} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center justify-between group hover:border-neon-green/20 border border-transparent transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center text-neon-green">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{item.source || "Income"}</p>
                    <p className="text-gray-500 text-xs">{item.month}/{item.year}{item.notes ? ` · ${item.notes}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-neon-green font-bold text-lg">{formatCurrency(item.amount, currency)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-neon-red/10 rounded-lg text-gray-400 hover:text-neon-red transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Income" : "Add Income"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Source</label>
            <select required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
              {SOURCES.map((s) => <option key={s} value={s} className="bg-dark-800 capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Amount</label>
            <input type="number" required min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Month</label>
              <select required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1} className="bg-dark-800">{new Date(2000, i).toLocaleString("default", { month: "long" })}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Year</label>
              <select required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
                {Array.from({ length: 6 }, (_, i) => { const y = now.getFullYear() - 2 + i; return <option key={y} value={y} className="bg-dark-800">{y}</option>; })}
              </select>
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="Optional notes" maxLength={500} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? "Update" : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
