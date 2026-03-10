import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendChat, addUserMessage, clearChat,
  fetchInsights, fetchSummary, fetchProAnalytics, fetchProPredict, fetchProBudget, generateData
} from "../features/ai/aiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Trash2, Download, Lightbulb, BarChart2, TrendingUp, CreditCard, Sparkles, Lock, Calendar, RefreshCw } from "lucide-react";
import { PageHeader, GlassCard, Button, LoadingSpinner } from "../components/UI";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";

// ── Helpers ──────────────────────────────────────────────────────────
const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatCurrency = (n) => {
  if (n == null || isNaN(n)) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const fmtCategory = (c) => (c || "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

// ── Markdown renderer component ─────────────────────────────────────
function MarkdownBlock({ text }) {
  if (!text) return null;
  return (
    <div className="prose-custom">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-neon-green mt-5 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-gray-200 mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-gray-300 text-sm leading-relaxed mb-3">{children}</p>,
          ul: ({ children }) => <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1.5 mb-4 ml-1 list-decimal list-inside">{children}</ol>,
          li: ({ children }) => (
            <li className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-neon-green mt-1.5 text-[6px]">●</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-gray-400 italic">{children}</em>,
          code: ({ children }) => <code className="bg-white/5 text-neon-green px-1.5 py-0.5 rounded text-xs">{children}</code>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-neon-green/40 pl-4 my-3 text-gray-400 italic">{children}</blockquote>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ── PDF download ─────────────────────────────────────────────────────
function downloadPDF(title, textContent) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, y + 6);
  y += 14;
  doc.setDrawColor(0, 200, 100);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
  y += 10;
  doc.setTextColor(40, 40, 40);

  // Clean markdown symbols for plain text
  const clean = textContent
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^>\s*/gm, "  ")
    .replace(/^[-*]\s+/gm, "\u2022 ");

  const lines = clean.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { y += 4; continue; }

    const isHeading = /^[A-Z][A-Z\s&,:-]+$/.test(trimmed) || (!trimmed.includes(". ") && trimmed.endsWith(":") && trimmed.length < 60);

    if (isHeading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      y += 3;
    } else if (trimmed.startsWith("\u2022")) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }

    const wrapped = doc.splitTextToSize(trimmed, usableWidth - (trimmed.startsWith("\u2022") ? 5 : 0));
    for (const wl of wrapped) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wl, margin + (trimmed.startsWith("\u2022") ? 3 : 0), y);
      y += 5;
    }
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
}

// ── Stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="glass rounded-xl p-4 flex flex-col">
      <span className="text-gray-400 text-xs mb-1">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════
export default function AIAssistant() {
  const dispatch = useDispatch();
  const { chatMessages, chatLoading, insights, summary, proAnalytics, proPredictions, proBudget, loading, error } = useSelector((s) => s.ai);
  const { user } = useSelector((s) => s.auth);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState("chat");
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const chatEnd = useRef();
  const isPro = user?.plan === "pro";

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch(addUserMessage(input));
    dispatch(sendChat(input));
    setInput("");
  };

  const loadTabData = (tabId) => {
    const params = { month, year };
    if (tabId === "insights") dispatch(fetchInsights(params));
    if (tabId === "summary") dispatch(fetchSummary(params));
    if (tabId === "analytics") dispatch(fetchProAnalytics(params));
    if (tabId === "predict") dispatch(fetchProPredict(params));
    if (tabId === "budget") dispatch(fetchProBudget(params));
  };

  const handleTabClick = (id, pro) => {
    if (pro && !isPro) return;
    setTab(id);
    if (id !== "chat") loadTabData(id);
  };

  const handleRefresh = () => loadTabData(tab);

  const tabs = [
    { id: "chat", label: "Chat", icon: Brain },
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "summary", label: "Summary", icon: BarChart2 },
    { id: "analytics", label: "Analytics", icon: TrendingUp, pro: true },
    { id: "predict", label: "Predictions", icon: Sparkles, pro: true },
    { id: "budget", label: "Budget", icon: CreditCard, pro: true },
  ];

  // ── extract text for PDF ──────────────────────────────────────────
  const getTextForPDF = (tabId) => {
    if (tabId === "insights") {
      if (!insights || !Array.isArray(insights) || insights.length === 0) return "";
      return insights.map((ins, i) =>
        `## Insight ${i + 1} - ${fmtCategory(ins.category)} (${monthNames[(ins.month || 1) - 1]} ${ins.year || ""})\n\n${ins.insightText}\n`
      ).join("\n---\n\n");
    }
    if (tabId === "summary" && summary) {
      return `# Financial Summary - ${monthNames[month - 1]} ${year}\n\n` +
        `Total Income: ${formatCurrency(summary.income)}\n` +
        `Total Expenses: ${formatCurrency(summary.expenses)}\n` +
        `Savings: ${formatCurrency(summary.savings)}\n` +
        `Loan Payments: ${formatCurrency(summary.loans)}\n` +
        `Savings Rate: ${summary.savingsRate || "0%"}\n` +
        `Net Balance: ${formatCurrency(summary.netBalance)}\n`;
    }
    if (tabId === "analytics" && proAnalytics) {
      let text = `# Advanced Analytics - ${monthNames[month - 1]} ${year}\n\n`;
      if (proAnalytics.summary) {
        const s = proAnalytics.summary;
        text += `Income: ${formatCurrency(s.income)} | Expenses: ${formatCurrency(s.expenses)} | Net: ${formatCurrency(s.netBalance)}\n\n`;
      }
      if (proAnalytics.topSpendingCategory) {
        const t = proAnalytics.topSpendingCategory;
        text += `Top Spending: ${fmtCategory(t.category)} - ${formatCurrency(t.amount)} (${t.percentage})\n\n`;
      }
      if (proAnalytics.categoryBreakdown?.length) {
        text += "Category Breakdown:\n\n";
        proAnalytics.categoryBreakdown.forEach(c => {
          text += `  ${fmtCategory(c._id)}: ${formatCurrency(c.total)} (${c.count} txns, avg ${formatCurrency(c.avgTransaction)})\n`;
        });
      }
      return text;
    }
    if (tabId === "predict" && proPredictions) {
      const p = proPredictions.prediction;
      if (p?.raw) return p.raw;
      let text = `# AI Expense Predictions\n\n`;
      if (p?.predictedExpenses) text += `Predicted Total Expenses: ${formatCurrency(p.predictedExpenses)}\n\n`;
      if (p?.savingsGoal) text += `Savings Goal: ${formatCurrency(p.savingsGoal)}\n\n`;
      if (p?.categories?.length) {
        text += "Category Predictions:\n\n";
        p.categories.forEach(c => {
          text += `  ${fmtCategory(c.category || c.name)}: ${formatCurrency(c.predicted || c.amount || c.budget)}\n`;
        });
        text += "\n";
      }
      if (p?.warnings?.length) {
        text += "Warnings:\n\n";
        p.warnings.forEach(w => { text += `  - ${w}\n`; });
        text += "\n";
      }
      if (p?.advice) text += `Advice:\n\n${p.advice}\n`;
      return text;
    }
    if (tabId === "budget" && proBudget) {
      return `# Budget Advice - ${monthNames[month - 1]} ${year}\n\nGoal: ${proBudget.userGoal || "General"}\n\n${proBudget.advice || ""}`;
    }
    return "";
  };

  const handlePDFDownload = () => {
    const titles = { insights: "AI Insights", summary: "Financial Summary", analytics: "Pro Analytics", predict: "AI Predictions", budget: "Budget Advice" };
    const text = getTextForPDF(tab);
    if (text) downloadPDF(titles[tab] || "Report", text);
  };

  // ── Render sections ───────────────────────────────────────────────

  const handleGenerateInsight = async () => {
    await dispatch(generateData({ month, year })).unwrap();
    dispatch(fetchInsights({ month, year }));
  };

  const renderInsights = () => {
    const list = Array.isArray(insights) ? insights : insights ? [insights] : [];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">{list.length} insight{list.length !== 1 ? "s" : ""} for {monthNames[month - 1]} {year}</p>
          <button
            onClick={handleGenerateInsight}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} className={loading ? "animate-spin" : ""} />
            Generate New Insight
          </button>
        </div>
        {list.length === 0 && <p className="text-gray-500 text-sm text-center py-10">No insights yet. Click "Generate New Insight" to create one.</p>}
        {list.map((ins, i) => (
          <div key={ins._id || i} className="glass rounded-xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm font-bold">{i + 1}</span>
              <div>
                <h3 className="text-white font-semibold text-sm">{fmtCategory(ins.category)}</h3>
                <p className="text-gray-500 text-xs">{monthNames[(ins.month || 1) - 1]} {ins.year}</p>
              </div>
            </div>
            <MarkdownBlock text={ins.insightText} />
          </div>
        ))}
      </div>
    );
  };

  const renderSummary = () => {
    if (!summary) return <p className="text-gray-500 text-sm text-center py-10">No data for this month.</p>;
    return (
      <div>
        <h3 className="text-white font-semibold text-lg mb-4">Financial Summary &mdash; {monthNames[month - 1]} {year}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Income" value={formatCurrency(summary.income)} color="text-emerald-400" />
          <StatCard label="Total Expenses" value={formatCurrency(summary.expenses)} color="text-red-400" />
          <StatCard label="Savings" value={formatCurrency(summary.savings)} color="text-blue-400" />
          <StatCard label="Loan Payments" value={formatCurrency(summary.loans)} color="text-orange-400" />
          <StatCard label="Savings Rate" value={summary.savingsRate || "0%"} color="text-purple-400" />
          <StatCard label="Net Balance" value={formatCurrency(summary.netBalance)} color={summary.netBalance >= 0 ? "text-neon-green" : "text-red-400"} />
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!proAnalytics) return <p className="text-gray-500 text-sm text-center py-10">No analytics data available.</p>;
    const { summary: s, categoryBreakdown, dailySpending, topSpendingCategory, totalCategories } = proAnalytics;
    return (
      <div className="space-y-6">
        <h3 className="text-white font-semibold text-lg">Advanced Analytics &mdash; {monthNames[month - 1]} {year}</h3>

        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Income" value={formatCurrency(s.income)} color="text-emerald-400" />
            <StatCard label="Expenses" value={formatCurrency(s.expenses)} color="text-red-400" />
            <StatCard label="Net Balance" value={formatCurrency(s.netBalance)} color={s.netBalance >= 0 ? "text-neon-green" : "text-red-400"} />
            <StatCard label="Categories" value={totalCategories || 0} color="text-purple-400" />
          </div>
        )}

        {topSpendingCategory && (
          <div className="glass rounded-xl p-4 border border-yellow-500/20">
            <p className="text-yellow-400 text-xs font-medium mb-1">Top Spending Category</p>
            <p className="text-white font-bold text-lg">{fmtCategory(topSpendingCategory.category)}</p>
            <p className="text-gray-400 text-sm">{formatCurrency(topSpendingCategory.amount)} &mdash; {topSpendingCategory.percentage} of expenses</p>
          </div>
        )}

        {categoryBreakdown?.length > 0 && (
          <div>
            <h4 className="text-gray-200 font-semibold text-sm mb-3">Category Breakdown</h4>
            <div className="space-y-2">
              {categoryBreakdown.map((cat) => {
                const pct = s?.expenses ? ((cat.total / s.expenses) * 100).toFixed(1) : 0;
                return (
                  <div key={cat._id} className="glass rounded-lg p-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-sm font-medium">{fmtCategory(cat._id)}</span>
                        <span className="text-gray-400 text-xs">{pct}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="bg-neon-green rounded-full h-1.5 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white text-sm font-semibold">{formatCurrency(cat.total)}</p>
                      <p className="text-gray-500 text-xs">{cat.count} txns &middot; avg {formatCurrency(cat.avgTransaction)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dailySpending?.length > 0 && (
          <div>
            <h4 className="text-gray-200 font-semibold text-sm mb-3">Daily Spending Pattern</h4>
            <div className="flex items-end gap-0.5 h-32 glass rounded-xl p-4">
              {(() => {
                const max = Math.max(...dailySpending.map(d => d.total));
                return dailySpending.map((d) => (
                  <div key={d._id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="absolute -top-1 opacity-0 group-hover:opacity-100 bg-dark-800 border border-white/10 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap transition-opacity z-10">
                      Day {d._id}: {formatCurrency(d.total)}
                    </div>
                    <div
                      className="w-full bg-neon-green/60 rounded-t hover:bg-neon-green transition-colors min-h-[2px]"
                      style={{ height: `${(d.total / max) * 100}%` }}
                    />
                    <span className="text-gray-600 text-[8px] mt-1">{d._id}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPredictions = () => {
    if (!proPredictions) return <p className="text-gray-500 text-sm text-center py-10">No predictions available.</p>;
    const p = proPredictions.prediction;
    if (!p) return <p className="text-gray-500 text-sm text-center py-10">Prediction data unavailable.</p>;

    if (p.raw) return <MarkdownBlock text={p.raw} />;

    return (
      <div className="space-y-6">
        <h3 className="text-white font-semibold text-lg">AI Expense Predictions</h3>

        <div className="grid grid-cols-2 gap-3">
          {p.predictedExpenses != null && <StatCard label="Predicted Expenses" value={formatCurrency(p.predictedExpenses)} color="text-red-400" />}
          {p.savingsGoal != null && <StatCard label="Savings Goal" value={formatCurrency(p.savingsGoal)} color="text-emerald-400" />}
        </div>

        {p.categories?.length > 0 && (
          <div>
            <h4 className="text-gray-200 font-semibold text-sm mb-3">Category Predictions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {p.categories.map((c, i) => (
                <div key={i} className="glass rounded-lg p-3 flex justify-between items-center">
                  <span className="text-gray-300 text-sm">{fmtCategory(c.category || c.name)}</span>
                  <span className="text-white font-semibold text-sm">{formatCurrency(c.predicted || c.amount || c.budget || c.recommendedBudget)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.warnings?.length > 0 && (
          <div>
            <h4 className="text-yellow-400 font-semibold text-sm mb-2">Warning Flags</h4>
            <div className="space-y-2">
              {p.warnings.map((w, i) => (
                <div key={i} className="glass rounded-lg p-3 border border-yellow-500/20">
                  <p className="text-gray-300 text-sm">{typeof w === "string" ? w : w.message || JSON.stringify(w)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.advice && (
          <div>
            <h4 className="text-neon-green font-semibold text-sm mb-2">Advice</h4>
            <MarkdownBlock text={p.advice} />
          </div>
        )}

        {proPredictions.basedOnMonths?.length > 0 && (
          <div>
            <h4 className="text-gray-400 font-semibold text-xs mb-2 uppercase tracking-wider">Based on Historical Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {proPredictions.basedOnMonths.map((m, i) => (
                <div key={i} className="glass rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">{monthNames[(m.month || 1) - 1]} {m.year}</p>
                  <p className="text-emerald-400 text-sm">Income: {formatCurrency(m.income)}</p>
                  <p className="text-red-400 text-sm">Expenses: {formatCurrency(m.expenses)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBudget = () => {
    if (!proBudget) return <p className="text-gray-500 text-sm text-center py-10">No budget advice available.</p>;
    return (
      <div className="space-y-6">
        <h3 className="text-white font-semibold text-lg">Budget Advice &mdash; {monthNames[month - 1]} {year}</h3>

        {proBudget.currentSummary && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Income" value={formatCurrency(proBudget.currentSummary.income)} color="text-emerald-400" />
            <StatCard label="Expenses" value={formatCurrency(proBudget.currentSummary.expenses)} color="text-red-400" />
            <StatCard label="Net" value={formatCurrency(proBudget.currentSummary.netBalance)} color={proBudget.currentSummary.netBalance >= 0 ? "text-neon-green" : "text-red-400"} />
          </div>
        )}

        {proBudget.userGoal && (
          <div className="glass rounded-xl p-4 border border-neon-green/20">
            <p className="text-neon-green text-xs font-medium mb-1">Goal</p>
            <p className="text-white text-sm">{proBudget.userGoal}</p>
          </div>
        )}

        {proBudget.categoryBreakdown?.length > 0 && (
          <div>
            <h4 className="text-gray-200 font-semibold text-sm mb-2">Current Category Spending</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {proBudget.categoryBreakdown.map((c, i) => (
                <div key={i} className="glass rounded-lg p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-xs">{fmtCategory(c._id)}</span>
                  <span className="text-white text-sm font-semibold">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {proBudget.advice && (
          <div className="glass rounded-xl p-5 border border-white/5">
            <h4 className="text-neon-green font-semibold text-sm mb-3">AI Budget Recommendations</h4>
            <MarkdownBlock text={proBudget.advice} />
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════
  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Powered by Google Gemini" icon={Brain} />

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(({ id, label, icon: TabIcon, pro }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id, pro)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === id
                ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                : pro && !isPro
                ? "glass text-gray-600 cursor-not-allowed"
                : "glass text-gray-400 hover:text-white"
            }`}
          >
            {pro && !isPro ? <Lock size={14} /> : <TabIcon size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Month / Year selector + actions (for non-chat tabs) */}
      {tab !== "chat" && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Calendar size={14} className="text-gray-400" />
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent text-white text-sm outline-none cursor-pointer">
              {monthNames.map((m, i) => <option key={i} value={i + 1} className="bg-dark-800">{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent text-white text-sm outline-none cursor-pointer">
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => <option key={y} value={y} className="bg-dark-800">{y}</option>)}
            </select>
          </div>
          <button onClick={handleRefresh} className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Fetch
          </button>
          <button onClick={handlePDFDownload} className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 text-gray-400 hover:text-neon-green text-sm transition-colors">
            <Download size={14} /> Download PDF
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 glass rounded-xl p-3 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Chat Tab */}
      {tab === "chat" && (
        <GlassCard className="flex flex-col" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Brain size={48} className="text-gray-600 mb-4" />
                <h3 className="text-gray-300 font-semibold mb-1">Ask me anything about your finances</h3>
                <p className="text-gray-500 text-sm max-w-sm">I can analyze your spending, suggest saving strategies, and help you make better financial decisions.</p>
              </div>
            )}
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-neon-green/10 text-white rounded-br-md"
                      : "glass text-gray-200 rounded-bl-md"
                  }`}>
                    {msg.role === "user"
                      ? <p className="whitespace-pre-wrap">{typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)}</p>
                      : <MarkdownBlock text={typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content, null, 2)} />
                    }
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {chatLoading && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon-green/50 transition-all"
            />
            <Button type="submit" disabled={chatLoading || !input.trim()} className="px-5">
              <Send size={16} />
            </Button>
            {chatMessages.length > 0 && (
              <button type="button" onClick={() => dispatch(clearChat())} className="p-3 glass rounded-xl text-gray-400 hover:text-neon-red transition-colors">
                <Trash2 size={16} />
              </button>
            )}
          </form>
        </GlassCard>
      )}

      {/* Content Tabs */}
      {tab === "insights" && (
        <GlassCard>{loading ? <LoadingSpinner /> : renderInsights()}</GlassCard>
      )}
      {tab === "summary" && (
        <GlassCard>{loading ? <LoadingSpinner /> : renderSummary()}</GlassCard>
      )}
      {tab === "analytics" && isPro && (
        <GlassCard>{loading ? <LoadingSpinner /> : renderAnalytics()}</GlassCard>
      )}
      {tab === "predict" && isPro && (
        <GlassCard>{loading ? <LoadingSpinner /> : renderPredictions()}</GlassCard>
      )}
      {tab === "budget" && isPro && (
        <GlassCard>{loading ? <LoadingSpinner /> : renderBudget()}</GlassCard>
      )}
    </div>
  );
}
