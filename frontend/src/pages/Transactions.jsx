import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTransactions, createTransaction, editTransaction, removeTransaction } from "../features/transactions/transactionSlice";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Plus, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { PageHeader, GlassCard, Modal, Button, LoadingSpinner, EmptyState } from "../components/UI";
import { formatCurrency, formatDate } from "../utils/calculations";
import toast from "react-hot-toast";

const categories = ["food", "transport", "shopping", "rent", "entertainment", "healthcare", "education", "utilities", "salary", "freelance", "investment", "business", "loan_payment", "savings_deposit", "other"];
const initialForm = { title: "", amount: "", type: "expense", category: "other", description: "", date: "" };

export default function Transactions() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.transactions);
  const { user } = useSelector((s) => s.auth);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const currency = user?.currency || "USD";

  useEffect(() => { dispatch(getTransactions()); }, [dispatch]);

  const openAdd = () => { setForm(initialForm); setEditingId(null); setShowModal(true); };
  const openEdit = (item) => {
    setForm({ title: item.title || "", amount: item.amount || "", type: item.type || "expense", category: item.category || "other", description: item.description || "", date: item.date?.slice(0, 10) || "" });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dispatch(editTransaction({ id: editingId, data: { ...form, amount: Number(form.amount) } })).unwrap();
        toast.success("Updated!");
      } else {
        await dispatch(createTransaction({ ...form, amount: Number(form.amount) })).unwrap();
        toast.success("Added!");
      }
      setShowModal(false);
    } catch (err) { toast.error(err || "Failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      await dispatch(removeTransaction(id)).unwrap();
      toast.success("Deleted!");
    } catch (err) { toast.error(err || "Failed"); }
  };

  const filtered = items
    .filter((t) => filter === "all" || t.type === filter)
    .filter((t) => !search || (t.title || t.description || "").toLowerCase().includes(search.toLowerCase()));

  const totalExpenses = items.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const totalIncTx = items.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Track every expense and income"
        icon={ArrowLeftRight}
        action={<Button onClick={openAdd} className="flex items-center gap-2"><Plus size={16} /> Add</Button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <GlassCard className="border border-neon-green/20">
          <p className="text-gray-400 text-xs">Income Transactions</p>
          <p className="text-xl font-bold text-neon-green">{formatCurrency(totalIncTx, currency)}</p>
        </GlassCard>
        <GlassCard className="border border-neon-red/20">
          <p className="text-gray-400 text-xs">Expense Transactions</p>
          <p className="text-xl font-bold text-neon-red">{formatCurrency(totalExpenses, currency)}</p>
        </GlassCard>
        <GlassCard className="border border-neon-blue/20">
          <p className="text-gray-400 text-xs">Total Transactions</p>
          <p className="text-xl font-bold text-neon-blue">{items.length}</p>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-neon-green/50"
          />
        </div>
        <div className="flex gap-2">
          {["all", "income", "expense"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-neon-green/10 text-neon-green border border-neon-green/30" : "glass text-gray-400 hover:text-white"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transactions" description="Start logging your first transaction" action={<Button onClick={openAdd}>Add Transaction</Button>} />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((tx, i) => (
              <motion.div
                key={tx._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ delay: i * 0.02 }}
                className="glass rounded-xl p-4 flex items-center justify-between group hover:border-white/10 border border-transparent transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === "expense" ? "bg-neon-red/10" : "bg-neon-green/10"}`}>
                    {tx.type === "expense" ? <ArrowUpRight size={16} className="text-neon-red" /> : <ArrowDownLeft size={16} className="text-neon-green" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{tx.title || tx.description || "Transaction"}</p>
                    <p className="text-gray-500 text-xs">{tx.category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} · {formatDate(tx.date || tx.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm ${tx.type === "expense" ? "text-neon-red" : "text-neon-green"}`}>
                    {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount, currency)}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(tx)} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(tx._id)} className="p-1.5 hover:bg-neon-red/10 rounded-lg text-gray-400 hover:text-neon-red"><Trash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Transaction" : "Add Transaction"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="e.g. Grocery shopping" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Amount</label>
              <input type="number" required min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
                <option value="expense" className="bg-dark-800">Expense</option>
                <option value="income" className="bg-dark-800">Income</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
              {categories.map((c) => <option key={c} value={c} className="bg-dark-800">{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="Optional" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
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
