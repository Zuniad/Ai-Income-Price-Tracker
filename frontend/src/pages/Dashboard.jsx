import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getIncomes } from "../features/income/incomeSlice";
import { getTransactions } from "../features/transactions/transactionSlice";
import { getSavings } from "../features/savings/savingsSlice";
import { getLoans } from "../features/loans/loanSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, Landmark, TrendingUp,
  LayoutDashboard, Target, Activity, GitBranch, X, Eye, Percent, DollarSign,
  Zap, RefreshCw
} from "lucide-react";
import { PageHeader, StatCard, GlassCard, LoadingSpinner } from "../components/UI";
import { formatCurrency } from "../utils/calculations";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  LineChart, Line, ScatterChart, Scatter, ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  ReactFlow, Background, Controls, MiniMap, MarkerType,
  Handle, Position, useNodesState, useEdgesState
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const COLORS = ["#00ff88", "#ff4466", "#00aaff", "#ff8800", "#aa55ff", "#ff55aa", "#55ffaa", "#ffaa00"];

const fmtCat = (c) => (c || "other").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

// ── Custom Tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-sm border border-white/10">
      <p className="text-gray-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="text-xs">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Custom React Flow Node ───────────────────────────────────────────
function FlowNode({ data, selected }) {
  const Icon = data.icon;
  return (
    <div
      className={`relative group px-4 py-3 rounded-xl border text-center min-w-[140px] transition-all duration-200 cursor-pointer
        ${selected ? "ring-2 ring-white/30 scale-105" : "hover:scale-[1.03]"}
        ${data.className || "glass border-white/10"}`}
      onClick={() => data.onClick?.(data)}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-white/20 !border-white/30" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-white/20 !border-white/30" />
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-white/20 !border-white/30" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-white/20 !border-white/30" />

      {Icon && (
        <div className="flex justify-center mb-1">
          <Icon size={16} className={data.iconColor || "text-gray-400"} />
        </div>
      )}
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{data.sublabel || ""}</div>
      <div className="text-white font-semibold text-sm leading-tight">{data.label}</div>
      {data.amount && <div className={`text-xs font-bold mt-1 ${data.amountColor || "text-neon-green"}`}>{data.amount}</div>}
      {data.percentage != null && (
        <div className="mt-1">
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-400 transition-all" style={{ width: `${Math.min(100, data.percentage)}%` }} />
          </div>
          <span className="text-[9px] text-gray-500">{data.percentage.toFixed(0)}%</span>
        </div>
      )}
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: `0 0 20px ${data.glowColor || "rgba(255,255,255,0.05)"}` }} />
    </div>
  );
}

const nodeTypes = { custom: FlowNode };

// ═════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items: incomes, loading: incLoading } = useSelector((s) => s.income);
  const { items: transactions, loading: txLoading } = useSelector((s) => s.transactions);
  const { items: savings } = useSelector((s) => s.savings);
  const { items: loans } = useSelector((s) => s.loans);
  const [activeChart, setActiveChart] = useState("overview");
  const [selectedNode, setSelectedNode] = useState(null);
  const [radarView, setRadarView] = useState("combined"); // combined | income | expenses

  useEffect(() => {
    dispatch(getIncomes());
    dispatch(getTransactions());
    dispatch(getSavings());
    dispatch(getLoans());
  }, [dispatch]);

  const currency = user?.currency || "USD";
  const fmt = (v) => formatCurrency(v, currency);

  // ── Aggregations ──────────────────────────────────────────────────
  const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const totalSaved = savings.reduce((s, sv) => s + (sv.savedAmount || 0), 0);
  const totalTarget = savings.reduce((s, sv) => s + (sv.targetAmount || 0), 0);
  const totalLoans = loans.reduce((s, l) => s + (l.remainingBalance || l.principalAmount || 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalSaved / totalIncome) * 100).toFixed(1) : "0";

  // ── Monthly data ──────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = names.map((m) => ({ name: m, income: 0, expenses: 0, savings: 0, loans: 0, net: 0 }));
    incomes.forEach((inc) => {
      const m = inc.month ? inc.month - 1 : new Date(inc.createdAt).getMonth();
      months[m].income += inc.amount || 0;
    });
    transactions.filter((t) => t.type === "expense").forEach((tx) => {
      const m = new Date(tx.date || tx.createdAt).getMonth();
      months[m].expenses += tx.amount || 0;
    });
    savings.forEach((sv) => {
      if (sv.month >= 1 && sv.month <= 12) months[sv.month - 1].savings += sv.savedAmount || 0;
    });
    loans.forEach((ln) => {
      const m = new Date(ln.startDate || ln.createdAt).getMonth();
      months[m].loans += ln.monthlyEMI || 0;
    });
    months.forEach((m) => { m.net = m.income - m.expenses; });
    return months.filter((m) => m.income > 0 || m.expenses > 0 || m.savings > 0 || m.loans > 0);
  }, [incomes, transactions, savings, loans]);

  // ── Category data ─────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const cats = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const cat = fmtCat(t.category);
      cats[cat] = (cats[cat] || 0) + (t.amount || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // ── Scatter: amount vs day-of-month ───────────────────────────────
  const scatterData = useMemo(() => {
    return transactions.map((tx) => {
      const d = new Date(tx.date || tx.createdAt);
      return { day: d.getDate(), amount: tx.amount || 0, type: tx.type, category: fmtCat(tx.category) };
    });
  }, [transactions]);

  const scatterExpenses = scatterData.filter((d) => d.type === "expense");
  const scatterIncome = scatterData.filter((d) => d.type === "income");

  // ── Daily cumulative spending line ────────────────────────────────
  const dailyCumulative = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const dayMap = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const d = new Date(t.date || t.createdAt);
        if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
          const day = d.getDate();
          dayMap[day] = (dayMap[day] || 0) + (t.amount || 0);
        }
      });
    let cumulative = 0;
    const data = [];
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      cumulative += dayMap[i] || 0;
      if (dayMap[i] || i <= now.getDate()) data.push({ day: i, daily: dayMap[i] || 0, cumulative });
    }
    return data;
  }, [transactions]);

  // ── Radar: income sources + expense categories combined ──────────
  const incomeSourceData = useMemo(() => {
    const sources = {};
    incomes.forEach((inc) => {
      const src = inc.source || inc.title || "Other";
      sources[src] = (sources[src] || 0) + (inc.amount || 0);
    });
    return Object.entries(sources).map(([subject, amount]) => ({ subject, amount }));
  }, [incomes]);

  const radarCombinedData = useMemo(() => {
    // Gather all label names from both income sources and expense categories
    const allLabels = new Set();
    const incMap = {};
    incomes.forEach((inc) => {
      const src = inc.source || inc.title || "Other";
      incMap[src] = (incMap[src] || 0) + (inc.amount || 0);
      allLabels.add(src);
    });
    const expMap = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const cat = fmtCat(t.category);
      expMap[cat] = (expMap[cat] || 0) + (t.amount || 0);
      allLabels.add(cat);
    });
    // Normalize: find max of each so they're comparable on same scale
    const maxInc = Math.max(1, ...Object.values(incMap));
    const maxExp = Math.max(1, ...Object.values(expMap));
    return Array.from(allLabels).map((label) => ({
      subject: label,
      income: incMap[label] || 0,
      expense: expMap[label] || 0,
      incomeNorm: ((incMap[label] || 0) / maxInc) * 100,
      expenseNorm: ((expMap[label] || 0) / maxExp) * 100,
    }));
  }, [incomes, transactions]);

  // ── Savings progress ──────────────────────────────────────────────
  const savingsGoals = useMemo(() => {
    return savings.map((sv) => ({
      name: sv.title || "Goal",
      saved: sv.savedAmount || 0,
      target: sv.targetAmount || 0,
      pct: sv.targetAmount ? Math.min(100, ((sv.savedAmount || 0) / sv.targetAmount) * 100) : 0,
    }));
  }, [savings]);

  // ── Expense vs Income composition bar ─────────────────────────────
  const composedMonthly = useMemo(() => {
    return monthlyData.map((m) => ({ ...m, ratio: m.income > 0 ? ((m.expenses / m.income) * 100).toFixed(1) : 0 }));
  }, [monthlyData]);

  // ── React Flow: money flow diagram (enhanced) ─────────────────────
  const handleNodeClick = useCallback((nodeData) => {
    setSelectedNode((prev) => prev?.id === nodeData.id ? null : nodeData);
  }, []);

  const { initialNodes, initialEdges } = useMemo(() => {
    const onClickData = (d) => ({ ...d, onClick: () => handleNodeClick(d) });

    // Group income sources
    const incomeSources = {};
    incomes.forEach((inc) => {
      const src = inc.source || inc.title || "Income";
      incomeSources[src] = (incomeSources[src] || 0) + (inc.amount || 0);
    });
    const incomeEntries = Object.entries(incomeSources).slice(0, 5);

    // Group expense categories
    const expenseCats = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const cat = fmtCat(t.category);
      expenseCats[cat] = (expenseCats[cat] || 0) + (t.amount || 0);
    });
    const expenseEntries = Object.entries(expenseCats).sort((a, b) => b[1] - a[1]).slice(0, 6);

    // Group subscriptions from transactions
    const subTotal = transactions
      .filter((t) => t.type === "expense" && (t.category === "entertainment" || t.category === "utilities"))
      .reduce((s, t) => s + (t.amount || 0), 0);

    const nodes = [];
    const edges = [];
    const COL1 = 0, COL2 = 300, COL3 = 600, COL4 = 900;
    const SPACING = 110;

    // ── Column 1: Income sources ──
    incomeEntries.forEach(([name, amt], i) => {
      const pct = totalIncome > 0 ? (amt / totalIncome) * 100 : 0;
      nodes.push({
        id: `inc-${i}`, type: "custom",
        position: { x: COL1, y: i * SPACING },
        data: onClickData({
          id: `inc-${i}`, label: name, sublabel: "Income Source", amount: fmt(amt),
          amountColor: "text-emerald-400", className: "bg-emerald-900/30 border-emerald-500/40",
          icon: DollarSign, iconColor: "text-emerald-400",
          percentage: pct, glowColor: "rgba(0,255,136,0.15)",
          details: { type: "income", name, total: amt, percentOfTotal: pct.toFixed(1) }
        }),
      });
      // Thicker edge for bigger income
      const width = Math.max(1.5, Math.min(5, (amt / Math.max(1, totalIncome)) * 8));
      edges.push({
        id: `e-inc-${i}`, source: `inc-${i}`, target: "total-income", animated: true,
        style: { stroke: "#00ff88", strokeWidth: width },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#00ff88" },
        label: `${pct.toFixed(0)}%`, labelStyle: { fill: "#6b7280", fontSize: 9 },
        labelBgStyle: { fill: "rgba(0,0,0,0.6)" }, labelBgPadding: [4, 2],
      });
    });

    // ── Column 2: Total Income → Wallet ──
    const midY = Math.max(0, ((Math.max(incomeEntries.length, expenseEntries.length) - 1) * SPACING) / 2);
    nodes.push({
      id: "total-income", type: "custom",
      position: { x: COL2, y: midY - 60 },
      data: onClickData({
        id: "total-income", label: "Total Income", sublabel: "Gross", amount: fmt(totalIncome),
        amountColor: "text-emerald-300", className: "bg-emerald-900/20 border-emerald-400/30",
        icon: TrendingUp, iconColor: "text-emerald-300", glowColor: "rgba(0,255,136,0.1)",
        details: { type: "summary", name: "Total Income", total: totalIncome, sources: incomeEntries.length }
      }),
    });

    nodes.push({
      id: "wallet", type: "custom",
      position: { x: COL2, y: midY + 70 },
      data: onClickData({
        id: "wallet", label: "💰 Wallet", sublabel: "Net Balance", amount: fmt(netBalance),
        amountColor: netBalance >= 0 ? "text-neon-green" : "text-red-400",
        className: "bg-gradient-to-br from-blue-900/40 to-purple-900/30 border-blue-400/40",
        icon: Wallet, iconColor: "text-blue-400", glowColor: "rgba(0,170,255,0.15)",
        details: { type: "wallet", income: totalIncome, expenses: totalExpenses, net: netBalance, savingsRate }
      }),
    });

    edges.push({
      id: "e-total-wallet", source: "total-income", target: "wallet", animated: true,
      sourceHandle: "bottom", targetHandle: "top",
      style: { stroke: "#00ff88", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#00ff88" },
    });

    // ── Column 2 bottom: Savings & Loans ──
    if (totalSaved > 0 || totalTarget > 0) {
      const savPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
      nodes.push({
        id: "savings", type: "custom",
        position: { x: COL2 - 140, y: midY + 220 },
        data: onClickData({
          id: "savings", label: "Savings", sublabel: `${fmt(totalSaved)} / ${fmt(totalTarget)}`,
          amount: fmt(totalSaved), amountColor: "text-blue-400",
          className: "bg-blue-900/20 border-blue-500/30",
          icon: PiggyBank, iconColor: "text-blue-400", percentage: savPct,
          glowColor: "rgba(0,170,255,0.12)",
          details: { type: "savings", saved: totalSaved, target: totalTarget, pct: savPct.toFixed(1), goals: savingsGoals.length }
        }),
      });
      edges.push({
        id: "e-savings", source: "wallet", target: "savings", animated: true,
        sourceHandle: "bottom", targetHandle: "top",
        style: { stroke: "#00aaff", strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#00aaff" },
        label: fmt(totalSaved), labelStyle: { fill: "#00aaff", fontSize: 9 },
        labelBgStyle: { fill: "rgba(0,0,0,0.6)" }, labelBgPadding: [4, 2],
      });
    }

    if (totalLoans > 0) {
      nodes.push({
        id: "loans", type: "custom",
        position: { x: COL2 + 140, y: midY + 220 },
        data: onClickData({
          id: "loans", label: "Loan Payments", sublabel: "Outstanding Debt",
          amount: fmt(totalLoans), amountColor: "text-orange-400",
          className: "bg-orange-900/20 border-orange-500/30",
          icon: Landmark, iconColor: "text-orange-400", glowColor: "rgba(255,136,0,0.12)",
          details: { type: "loans", outstanding: totalLoans, count: loans.length }
        }),
      });
      edges.push({
        id: "e-loans", source: "wallet", target: "loans", animated: true,
        sourceHandle: "bottom", targetHandle: "top",
        style: { stroke: "#ff8800", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#ff8800" },
        label: fmt(totalLoans), labelStyle: { fill: "#ff8800", fontSize: 9 },
        labelBgStyle: { fill: "rgba(0,0,0,0.6)" }, labelBgPadding: [4, 2],
      });
    }

    // ── Column 3: Expense Hub ──
    nodes.push({
      id: "expenses-hub", type: "custom",
      position: { x: COL3, y: midY + 70 },
      data: onClickData({
        id: "expenses-hub", label: "Total Expenses", sublabel: "All Categories",
        amount: fmt(totalExpenses), amountColor: "text-red-400",
        className: "bg-red-900/20 border-red-500/30",
        icon: ArrowUpRight, iconColor: "text-red-400",
        percentage: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
        glowColor: "rgba(255,68,102,0.12)",
        details: { type: "expenses", total: totalExpenses, categories: expenseEntries.length, ratio: totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) + "%" : "N/A" }
      }),
    });
    edges.push({
      id: "e-wallet-exp", source: "wallet", target: "expenses-hub", animated: true,
      style: { stroke: "#ff4466", strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#ff4466" },
      label: fmt(totalExpenses), labelStyle: { fill: "#ff4466", fontSize: 9, fontWeight: 600 },
      labelBgStyle: { fill: "rgba(0,0,0,0.6)" }, labelBgPadding: [4, 2],
    });

    // Optional: Recurring/Subscriptions sub-node
    if (subTotal > 0) {
      nodes.push({
        id: "recurring", type: "custom",
        position: { x: COL3, y: midY - 60 },
        data: onClickData({
          id: "recurring", label: "Recurring", sublabel: "Utilities & Entertainment",
          amount: fmt(subTotal), amountColor: "text-purple-400",
          className: "bg-purple-900/20 border-purple-500/30",
          icon: RefreshCw, iconColor: "text-purple-400", glowColor: "rgba(170,85,255,0.12)",
          details: { type: "recurring", total: subTotal, percentOfExpenses: totalExpenses > 0 ? ((subTotal / totalExpenses) * 100).toFixed(1) + "%" : "N/A" }
        }),
      });
      edges.push({
        id: "e-exp-recurring", source: "expenses-hub", target: "recurring",
        sourceHandle: "top", targetHandle: "bottom",
        animated: false,
        style: { stroke: "#aa55ff", strokeWidth: 1.5, strokeDasharray: "5 3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#aa55ff" },
      });
    }

    // ── Column 4: Individual expense categories ──
    expenseEntries.forEach(([name, amt], i) => {
      const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
      const catColors = ["#ff4466", "#ff6644", "#ff8844", "#ffaa44", "#ffcc44", "#ffee44"];
      const col = catColors[i % catColors.length];
      nodes.push({
        id: `exp-${i}`, type: "custom",
        position: { x: COL4, y: i * SPACING },
        data: onClickData({
          id: `exp-${i}`, label: name, sublabel: `${pct.toFixed(1)}% of expenses`,
          amount: fmt(amt), amountColor: "text-red-300",
          className: "bg-red-900/15 border-red-500/20",
          percentage: pct, glowColor: `${col}22`,
          details: { type: "expense-category", name, total: amt, percentOfExpenses: pct.toFixed(1), percentOfIncome: totalIncome > 0 ? ((amt / totalIncome) * 100).toFixed(1) : "N/A" }
        }),
      });
      const width = Math.max(1, Math.min(4, (amt / Math.max(1, totalExpenses)) * 7));
      edges.push({
        id: `e-hub-exp-${i}`, source: "expenses-hub", target: `exp-${i}`, animated: true,
        style: { stroke: col, strokeWidth: width },
        markerEnd: { type: MarkerType.ArrowClosed, color: col },
        label: `${pct.toFixed(0)}%`, labelStyle: { fill: "#9ca3af", fontSize: 8 },
        labelBgStyle: { fill: "rgba(0,0,0,0.5)" }, labelBgPadding: [3, 1],
      });
    });

    // ── Cross-connections: savings covering loan payments ──
    if ((totalSaved > 0 || totalTarget > 0) && totalLoans > 0) {
      edges.push({
        id: "e-savings-loans", source: "savings", target: "loans",
        animated: false,
        style: { stroke: "#6b7280", strokeWidth: 1, strokeDasharray: "4 4" },
        label: "could cover", labelStyle: { fill: "#6b7280", fontSize: 8, fontStyle: "italic" },
        labelBgStyle: { fill: "rgba(0,0,0,0.5)" }, labelBgPadding: [3, 1],
      });
    }

    // ── Cross-connection: top expense categories linked to each other ──
    if (expenseEntries.length >= 2) {
      // Link top 2 categories with a dashed line
      edges.push({
        id: "e-exp-cross-01", source: "exp-0", target: "exp-1",
        sourceHandle: "bottom", targetHandle: "top",
        animated: false,
        style: { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1, strokeDasharray: "3 3" },
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [incomes, transactions, savings, loans, totalSaved, totalTarget, totalLoans, netBalance, totalIncome, totalExpenses, savingsGoals, currency, handleNodeClick]);

  // Interactive node/edge state
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when data changes
  useEffect(() => {
    setFlowNodes(initialNodes);
    setFlowEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  // Recent transactions
  const recentTx = [...transactions].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 6);

  if (incLoading || txLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || "User"}`}
        subtitle="Here's your financial overview"
        icon={LayoutDashboard}
      />

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Income" value={fmt(totalIncome)} icon={Wallet} color="green" delay={0} />
        <StatCard label="Expenses" value={fmt(totalExpenses)} icon={ArrowUpRight} color="red" delay={1} />
        <StatCard label="Savings" value={fmt(totalSaved)} icon={PiggyBank} color="blue" delay={2} />
        <StatCard label="Loans" value={fmt(totalLoans)} icon={Landmark} color="orange" delay={3} />
        <StatCard label="Net Balance" value={fmt(netBalance)} icon={TrendingUp} color={netBalance >= 0 ? "green" : "red"} delay={4} />
        <StatCard label="Save Rate" value={`${savingsRate}%`} icon={Target} color="purple" delay={5} />
      </div>

      {/* ── Row 1: Area Chart + Pie ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income vs Expenses vs Savings Area */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-4">Monthly Overview</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4466" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff4466" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00aaff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLoans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8800" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff8800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                <Area type="monotone" dataKey="income" stroke="#00ff88" fillOpacity={1} fill="url(#gIncome)" name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#ff4466" fillOpacity={1} fill="url(#gExpense)" name="Expenses" />
                <Area type="monotone" dataKey="savings" stroke="#00aaff" fillOpacity={1} fill="url(#gSavings)" name="Savings" />
                <Area type="monotone" dataKey="loans" stroke="#ff8800" fillOpacity={1} fill="url(#gLoans)" name="Loans" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No data yet</p>
          )}
        </GlassCard>

        {/* Spending Categories Donut */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="glass-strong rounded-xl px-3 py-2 text-sm border border-white/10">
                        <p className="text-white">{payload[0].name}</p>
                        <p className="text-neon-green font-semibold">{fmt(payload[0].value)}</p>
                      </div>
                    ) : null
                  } />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {categoryData.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-400 text-[10px]">{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No transactions yet</p>
          )}
        </GlassCard>
      </div>

      {/* ── Row 2: Cumulative Line + Scatter ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Cumulative Spending Line */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-1">Daily Spending (This Month)</h3>
          <p className="text-gray-500 text-xs mb-4">Cumulative vs daily breakdown</p>
          {dailyCumulative.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={dailyCumulative}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="daily" fill="#ff4466" opacity={0.5} radius={[3, 3, 0, 0]} name="Daily" />
                <Line type="monotone" dataKey="cumulative" stroke="#ff8800" strokeWidth={2} dot={false} name="Cumulative" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No data for this month</p>
          )}
        </GlassCard>

        {/* Scatter: Transaction Amounts by Day */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-1">Transaction Distribution</h3>
          <p className="text-gray-500 text-xs mb-4">Amount vs Day of month (scatter)</p>
          {scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} name="Day" label={{ value: "Day", position: "bottom", fill: "#6b7280", fontSize: 10 }} />
                <YAxis dataKey="amount" stroke="#6b7280" fontSize={11} name="Amount" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="glass-strong rounded-xl px-3 py-2 text-sm border border-white/10">
                      <p className="text-gray-300">Day {payload[0]?.value}</p>
                      <p className="text-white font-semibold">{fmt(payload[1]?.value)}</p>
                      {payload[0]?.payload?.category && <p className="text-gray-400 text-xs">{payload[0].payload.category}</p>}
                    </div>
                  ) : null
                } />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="Expenses" data={scatterExpenses} fill="#ff4466" fillOpacity={0.7} />
                <Scatter name="Income" data={scatterIncome} fill="#00ff88" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No data</p>
          )}
        </GlassCard>
      </div>

      {/* ── Row 3: Composed Bar + Radar ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Expense/Income Ratio Composed */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-1">Income vs Expense Composition</h3>
          <p className="text-gray-500 text-xs mb-4">Bar comparison with expense ratio line</p>
          {composedMonthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={composedMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={11} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="income" fill="#00ff88" opacity={0.7} radius={[4, 4, 0, 0]} name="Income" />
                <Bar yAxisId="left" dataKey="expenses" fill="#ff4466" opacity={0.7} radius={[4, 4, 0, 0]} name="Expenses" />
                <Line yAxisId="right" type="monotone" dataKey="ratio" stroke="#ff8800" strokeWidth={2} dot={{ fill: "#ff8800", r: 3 }} name="Expense Ratio %" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No data</p>
          )}
        </GlassCard>

        {/* Income & Expense Radar */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Financial Radar</h3>
            <div className="flex gap-1">
              {["combined", "income", "expenses"].map((v) => (
                <button
                  key={v}
                  onClick={() => setRadarView(v)}
                  className={`px-2.5 py-1 text-[10px] rounded-lg capitalize transition-all ${
                    radarView === v ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {radarCombinedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarCombinedData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" gridType="polygon" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={({ x, y, payload }) => (
                    <text x={x} y={y} textAnchor="middle" fill="#9ca3af" fontSize={10} dy={4}>
                      {payload.value.length > 10 ? payload.value.slice(0, 10) + "…" : payload.value}
                    </text>
                  )}
                />
                <PolarRadiusAxis tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} />
                {(radarView === "combined" || radarView === "income") && (
                  <Radar name="Income" dataKey={radarView === "combined" ? "incomeNorm" : "income"}
                    stroke="#00ff88" fill="#00ff88" fillOpacity={0.15} strokeWidth={2}
                    dot={{ r: 3, fill: "#00ff88" }} />
                )}
                {(radarView === "combined" || radarView === "expenses") && (
                  <Radar name="Expenses" dataKey={radarView === "combined" ? "expenseNorm" : "expense"}
                    stroke="#ff4466" fill="#ff4466" fillOpacity={0.1} strokeWidth={2}
                    dot={{ r: 3, fill: "#ff4466" }} />
                )}
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="glass-strong rounded-xl px-3 py-2 text-sm border border-white/10">
                        <p className="text-white font-medium text-xs mb-1">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} className="text-xs" style={{ color: p.stroke }}>
                            {p.name}: {p.payload?.income != null && p.name === "Income" ? fmt(p.payload.income) : ""}
                            {p.payload?.expense != null && p.name === "Expenses" ? fmt(p.payload.expense) : ""}
                            {radarView === "combined" ? ` (${typeof p.value === "number" ? p.value.toFixed(0) : p.value}%)` : ""}
                          </p>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No data yet</p>
          )}
        </GlassCard>
      </div>

      {/* ── Row 4: Savings Progress + Savings Goals Bar Chart ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Savings Progress Cards */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><PiggyBank size={18} className="text-blue-400" /> Savings Goals</h3>
          {savingsGoals.length > 0 ? (
            <div className="space-y-4">
              {savingsGoals.map((g, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{g.name}</span>
                    <span className="text-gray-400">{fmt(g.saved)} / {fmt(g.target)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${g.pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full rounded-full ${g.pct >= 100 ? "bg-neon-green" : "bg-gradient-to-r from-blue-500 to-purple-500"}`}
                    />
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-0.5">{g.pct.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-10">No savings goals set</p>
          )}
        </GlassCard>

        {/* Savings Bar Chart */}
        <GlassCard>
          <h3 className="text-white font-semibold mb-4">Saved vs Target</h3>
          {savingsGoals.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={savingsGoals} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="saved" fill="#00aaff" radius={[0, 4, 4, 0]} name="Saved" />
                <Bar dataKey="target" fill="#aa55ff" opacity={0.4} radius={[0, 4, 4, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No savings goals</p>
          )}
        </GlassCard>
      </div>

      {/* ── Row 5: React Flow — Money Flow Diagram ───────────────── */}
      <GlassCard className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-semibold flex items-center gap-2"><GitBranch size={18} className="text-purple-400" /> Money Flow</h3>
          <div className="flex items-center gap-2">
            {selectedNode && (
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white text-xs flex items-center gap-1 transition-colors">
                <X size={12} /> Clear
              </button>
            )}
            <span className="text-gray-600 text-[10px]">Drag nodes • Scroll to zoom • Click for details</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs mb-3">Interactive flow: Income → Wallet → Expenses, Savings & Loans</p>

        <div className="flex gap-4">
          {/* Flow Canvas */}
          <div className={`rounded-xl overflow-hidden border border-white/5 transition-all ${selectedNode ? "flex-1" : "w-full"}`} style={{ height: 520 }}>
            {flowNodes.length > 0 ? (
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                proOptions={{ hideAttribution: true }}
                style={{ background: "transparent" }}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                minZoom={0.3}
                maxZoom={2}
                snapToGrid={true}
                snapGrid={[15, 15]}
                onNodeClick={(_, node) => {
                  if (node.data?.details) setSelectedNode(node.data);
                }}
              >
                <Background color="rgba(255,255,255,0.03)" gap={20} variant="dots" />
                <Controls
                  showInteractive={true}
                  style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}
                />
                <MiniMap
                  nodeStrokeWidth={3}
                  nodeColor={(n) => {
                    if (n.id.startsWith("inc")) return "#00ff88";
                    if (n.id.startsWith("exp")) return "#ff4466";
                    if (n.id === "wallet") return "#00aaff";
                    if (n.id === "savings") return "#3b82f6";
                    if (n.id === "loans") return "#ff8800";
                    return "#6b7280";
                  }}
                  style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8 }}
                  maskColor="rgba(0,0,0,0.5)"
                />
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Add income and transactions to see your money flow</div>
            )}
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-xl border border-white/10 p-4 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                      <Eye size={14} className="text-blue-400" /> {selectedNode.label}
                    </h4>
                    <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                  </div>
                  {selectedNode.sublabel && <p className="text-gray-500 text-xs mb-3">{selectedNode.sublabel}</p>}
                  {selectedNode.amount && (
                    <div className={`text-2xl font-bold mb-4 ${selectedNode.amountColor || "text-white"}`}>{selectedNode.amount}</div>
                  )}
                  {selectedNode.percentage != null && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Allocation</span>
                        <span>{selectedNode.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-400" style={{ width: `${Math.min(100, selectedNode.percentage)}%` }} />
                      </div>
                    </div>
                  )}
                  {selectedNode.details && (
                    <div className="space-y-2">
                      {Object.entries(selectedNode.details).filter(([k]) => k !== "type").map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                          <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                          <span className="text-gray-300 font-medium">{typeof val === "number" ? val.toLocaleString() : val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 p-3 rounded-lg bg-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Tip</p>
                    <p className="text-gray-400 text-xs">
                      {selectedNode.details?.type === "income" && "Diversify income streams to reduce financial risk."}
                      {selectedNode.details?.type === "wallet" && `Your savings rate is ${savingsRate}%. Aim for 20%+.`}
                      {selectedNode.details?.type === "savings" && "Consistent saving builds long-term wealth."}
                      {selectedNode.details?.type === "loans" && "Prioritize high-interest debt first."}
                      {selectedNode.details?.type === "expenses" && "Review your largest categories for potential cuts."}
                      {selectedNode.details?.type === "expense-category" && `This category is ${selectedNode.details.percentOfExpenses}% of your spending.`}
                      {selectedNode.details?.type === "recurring" && "Review subscriptions quarterly to cut waste."}
                      {selectedNode.details?.type === "summary" && `You have ${selectedNode.details.sources} income sources.`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Flow Legend */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/5">
          {[
            { color: "#00ff88", label: "Income Flow" },
            { color: "#ff4466", label: "Expense Flow" },
            { color: "#00aaff", label: "Savings" },
            { color: "#ff8800", label: "Loan Payments" },
            { color: "#aa55ff", label: "Recurring" },
            { color: "#6b7280", label: "Cross-link", dashed: true },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded" style={{ backgroundColor: l.color, borderTop: l.dashed ? `2px dashed ${l.color}` : "none" }} />
              <span className="text-gray-500 text-[10px]">{l.label}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Row 6: Income Sources Bar + Recent Transactions ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-white font-semibold mb-4">Income Breakdown</h3>
          {incomes.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incomes.slice(0, 8).map((i) => ({ name: i.source || i.title || "Income", amount: i.amount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#00ff88" radius={[6, 6, 0, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No income records</p>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Activity size={16} className="text-gray-400" /> Recent Transactions</h3>
          {recentTx.length > 0 ? (
            <div className="space-y-3">
              {recentTx.map((tx, i) => (
                <motion.div
                  key={tx._id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "expense" ? "bg-neon-red/10" : "bg-neon-green/10"}`}>
                      {tx.type === "expense" ? <ArrowUpRight size={14} className="text-neon-red" /> : <ArrowDownLeft size={14} className="text-neon-green" />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.description || tx.title || "Transaction"}</p>
                      <p className="text-gray-500 text-xs">{fmtCat(tx.category)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${tx.type === "expense" ? "text-neon-red" : "text-neon-green"}`}>
                    {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No transactions yet</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
