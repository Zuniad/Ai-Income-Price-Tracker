import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLoans, createLoan, editLoan, removeLoan } from "../features/loans/loanSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { PageHeader, GlassCard, Modal, Button, LoadingSpinner, EmptyState } from "../components/UI";
import { formatCurrency, formatDate } from "../utils/calculations";
import toast from "react-hot-toast";

const initialForm = { loanName: "", principalAmount: "", interestRate: "", monthlyEMI: "", remainingBalance: "", startDate: "", endDate: "", status: "active" };

export default function Loans() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.loans);
  const { user } = useSelector((s) => s.auth);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const currency = user?.currency || "USD";

  useEffect(() => { dispatch(getLoans()); }, [dispatch]);

  const openAdd = () => { setForm(initialForm); setEditingId(null); setShowModal(true); };
  const openEdit = (item) => {
    setForm({
      loanName: item.loanName || "",
      principalAmount: item.principalAmount || "",
      interestRate: item.interestRate || "",
      monthlyEMI: item.monthlyEMI || "",
      remainingBalance: item.remainingBalance || "",
      startDate: item.startDate?.slice(0, 10) || "",
      endDate: item.endDate?.slice(0, 10) || "",
      status: item.status || "active",
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        loanName: form.loanName,
        principalAmount: Number(form.principalAmount),
        interestRate: Number(form.interestRate) || 0,
        monthlyEMI: Number(form.monthlyEMI),
        remainingBalance: Number(form.remainingBalance || form.principalAmount),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      };
      if (editingId) {
        await dispatch(editLoan({ id: editingId, data })).unwrap();
        toast.success("Loan updated!");
      } else {
        await dispatch(createLoan(data)).unwrap();
        toast.success("Loan added!");
      }
      setShowModal(false);
    } catch (err) { toast.error(err || "Failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this loan?")) return;
    try {
      await dispatch(removeLoan(id)).unwrap();
      toast.success("Deleted!");
    } catch (err) { toast.error(err || "Failed"); }
  };

  const totalLoans = items.reduce((s, l) => s + (l.remainingBalance || l.principalAmount || 0), 0);
  const activeLoans = items.filter((l) => l.status === "active");

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Loans"
        subtitle="Manage your debts and EMIs"
        icon={Landmark}
        action={<Button onClick={openAdd} className="flex items-center gap-2"><Plus size={16} /> Add Loan</Button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <GlassCard className="border border-neon-orange/20">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-neon-orange" />
            <p className="text-gray-400 text-xs">Outstanding Debt</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange mt-1">{formatCurrency(totalLoans, currency)}</p>
        </GlassCard>
        <GlassCard className="border border-neon-blue/20">
          <p className="text-gray-400 text-xs">Active Loans</p>
          <p className="text-2xl font-bold text-neon-blue mt-1">{activeLoans.length}</p>
        </GlassCard>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState icon={Landmark} title="No loans" description="Add a loan to start tracking your debts" action={<Button onClick={openAdd}>Add Loan</Button>} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((loan, i) => (
              <motion.div
                key={loan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 group hover:border-neon-orange/20 border border-transparent transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neon-orange/10 flex items-center justify-center">
                      <Landmark size={18} className="text-neon-orange" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{loan.loanName || "Loan"}</p>
                      <p className="text-gray-500 text-xs">
                        {loan.interestRate ? `${loan.interestRate}% APR · ` : ""}EMI: {formatCurrency(loan.monthlyEMI, currency)} · {loan.status}
                        {loan.endDate && ` · Ends: ${formatDate(loan.endDate)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-neon-orange font-bold">{formatCurrency(loan.remainingBalance, currency)}</p>
                      {loan.principalAmount && <p className="text-gray-500 text-xs">of {formatCurrency(loan.principalAmount, currency)}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(loan)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(loan._id)} className="p-2 hover:bg-neon-red/10 rounded-lg text-gray-400 hover:text-neon-red"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Loan" : "Add Loan"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Loan Name</label>
            <input type="text" required value={form.loanName} onChange={(e) => setForm({ ...form, loanName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="e.g. Home Loan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Principal Amount</label>
              <input type="number" required min="0" step="0.01" value={form.principalAmount} onChange={(e) => setForm({ ...form, principalAmount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Interest Rate %</label>
              <input type="number" required min="0" max="100" step="0.01" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Monthly EMI</label>
              <input type="number" required min="0" step="0.01" value={form.monthlyEMI} onChange={(e) => setForm({ ...form, monthlyEMI: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Remaining Balance</label>
              <input type="number" required min="0" step="0.01" value={form.remainingBalance} onChange={(e) => setForm({ ...form, remainingBalance: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" placeholder="Leave empty = principal" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Start Date</label>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">End Date</label>
              <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50" />
            </div>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 appearance-none">
              <option value="active" className="bg-dark-800">Active</option>
              <option value="paid_off" className="bg-dark-800">Paid Off</option>
              <option value="defaulted" className="bg-dark-800">Defaulted</option>
            </select>
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
