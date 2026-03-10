import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Brain, TrendingUp, Shield, Zap, ChevronRight, ArrowRight,
  Sparkles, BarChart3, PiggyBank, CreditCard, Landmark,
  Eye, Globe, Cpu, Star, Check, ArrowDown,
} from "lucide-react";

import img1 from "../assets/Whisk_fb314db0454bec69c764b6edafb2865bdr.jpeg";
import img2 from "../assets/Whisk_d567af643923dacb318434b8cdf1b149dr.jpeg";
import img3 from "../assets/Whisk_c940bc9f48f9aee8e6043f9c1ad39f90dr.jpeg";
import img4 from "../assets/Whisk_80da9c5be8d6e3d8d1540b84a82e8014dr.jpeg";
import img5 from "../assets/Whisk_637597da6b008fa9d9940b841784c7b1dr.jpeg";
import img6 from "../assets/Whisk_615dcd8a845589192854d6167cccccdfdr.jpeg";
import img7 from "../assets/Whisk_1676c5a4243e320ab334df2cbe4b54f8dr.jpeg";

import FinanceScene from "../components/FinanceScene";

gsap.registerPlugin(ScrollTrigger);

// ── Scene cards data ─────────────────────────────────────────────────
const scenes = [
  {
    id: 1,
    img: img1,
    title: "Floating Dashboard Universe",
    subtitle: "Futuristic fintech panels orbiting an AI core",
    description: "Experience your finances in a whole new dimension. Dashboard panels orbit around a central AI core, pulsing with real-time financial data from your income, savings, expenses and loans.",
    tags: ["3D Orbiting Panels", "Glassmorphism UI", "Real-time Analytics"],
    accent: "from-blue-500/20 to-purple-500/20",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
    icon: Globe,
  },
  {
    id: 2,
    img: img2,
    title: "AI Brain Neural Finance",
    subtitle: "Neural networks analyzing your financial data",
    description: "A powerful AI brain built from glowing neural networks connects to your financial charts, dashboards, and data streams — processing insights in real-time.",
    tags: ["Neural Networks", "AI Processing", "Data Streams"],
    accent: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/20",
    glow: "shadow-purple-500/10",
    icon: Brain,
  },
  {
    id: 3,
    img: img3,
    title: "Floating Financial Cards",
    subtitle: "Premium glassmorphism UI cards in 3D space",
    description: "Hovering UI cards represent income, expenses, savings and loans with soft glowing edges and neon highlights — a premium SaaS experience.",
    tags: ["Glassmorphism", "3D Cards", "Parallax Shift"],
    accent: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/20",
    glow: "shadow-cyan-500/10",
    icon: CreditCard,
  },
  {
    id: 4,
    img: img4,
    title: "Data Streams Visualization",
    subtitle: "Financial data flowing through digital networks",
    description: "Watch glowing data streams form analytics charts dynamically. AI-powered finance tracking visualized as flowing particle systems through a digital network.",
    tags: ["Particle Systems", "Dynamic Charts", "Data Flow"],
    accent: "from-emerald-500/20 to-cyan-500/20",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    icon: TrendingUp,
  },
  {
    id: 5,
    img: img5,
    title: "Financial Orbital System",
    subtitle: "Financial elements orbiting an AI core",
    description: "Income, savings, loans and expenses orbit as celestial bodies around a glowing AI core. Scroll to accelerate the orbital motion.",
    tags: ["Orbital Motion", "Scroll Animation", "AI Core"],
    accent: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/10",
    icon: Sparkles,
  },
  {
    id: 6,
    img: img6,
    title: "AI Predictive Analytics",
    subtitle: "Holographic prediction sphere",
    description: "A glowing sphere displays predictive financial analytics with holographic charts rotating around it — your financial future, visualized.",
    tags: ["Predictions", "Holographic UI", "Smart Analytics"],
    accent: "from-violet-500/20 to-indigo-500/20",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
    icon: Cpu,
  },
  {
    id: 7,
    img: img7,
    title: "AI Finance Galaxy",
    subtitle: "A galaxy made of financial data",
    description: "Financial charts, digital currency particles and AI data streams form a spiral galaxy — the entire financial universe at your fingertips.",
    tags: ["Galaxy Animation", "Star Particles", "Data Universe"],
    accent: "from-pink-500/20 to-purple-500/20",
    border: "border-pink-500/20",
    glow: "shadow-pink-500/10",
    icon: Star,
  },
];

const features = [
  { icon: BarChart3, title: "Smart Income Tracking", desc: "Multi-source income management with intelligent categorization across salary, freelance, business & more." },
  { icon: TrendingUp, title: "Expense Analytics", desc: "Deep spending breakdowns across 15 categories with daily patterns, trends, and visual insights." },
  { icon: PiggyBank, title: "Savings Goals", desc: "Set monthly savings targets, track progress with visual indicators, and stay on top of your goals." },
  { icon: Landmark, title: "Loan & EMI Tracker", desc: "Full loan lifecycle management with EMI calculations, remaining balance tracking, and payoff projections." },
  { icon: Brain, title: "AI Financial Advisor", desc: "Google Gemini AI analyzes your data to deliver personalized insights, predictions, and budget advice." },
  { icon: Shield, title: "Pro Subscription", desc: "Unlock advanced analytics, AI predictions, budget advice, and unlimited AI requests with Pro." },
];

const stats = [
  { value: "15+", label: "Expense Categories" },
  { value: "8+", label: "Chart Types" },
  { value: "7", label: "AI Features" },
  { value: "3D", label: "Visualizations" },
];

// ── Floating image component with parallax ──────────────────────────
function FloatingImage({ src, className, delay = 0 }) {
  const ref = useRef();

  useEffect(() => {
    gsap.to(ref.current, {
      y: "random(-20, 20)",
      x: "random(-10, 10)",
      rotation: "random(-3, 3)",
      duration: "random(3, 5)",
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay,
    });
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      <img src={src} alt="" className="w-full h-full object-cover rounded-2xl" loading="lazy" />
    </div>
  );
}

// ── Main Landing Page ───────────────────────────────────────────────
export default function LandingPage() {
  const containerRef = useRef();
  const heroRef = useRef();
  const scenesRef = useRef();
  const [activeScene, setActiveScene] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  // Mouse parallax
  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // GSAP scroll animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text entrance
      gsap.fromTo(".hero-title", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.2 });
      gsap.fromTo(".hero-subtitle", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.5 });
      gsap.fromTo(".hero-cta", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.8 });
      gsap.fromTo(".hero-stats", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 1 });

      // Floating hero images
      gsap.fromTo(".hero-float-img", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.15, duration: 1, ease: "back.out(1.5)", delay: 0.6 });

      // Scene cards scroll-in
      gsap.utils.toArray(".scene-card").forEach((card, i) => {
        gsap.fromTo(card,
          { y: 100, opacity: 0, rotateX: 10 },
          {
            y: 0, opacity: 1, rotateX: 0, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse" },
          }
        );
      });

      // Feature cards
      gsap.utils.toArray(".feature-card").forEach((card) => {
        gsap.fromTo(card,
          { y: 60, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.6, ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 88%", toggleActions: "play none none reverse" },
          }
        );
      });

      // CTA section
      gsap.fromTo(".cta-section",
        { y: 80, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: ".cta-section", start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Auto-rotate active scene
  useEffect(() => {
    const interval = setInterval(() => setActiveScene((p) => (p + 1) % scenes.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050510] text-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Three.js background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <FinanceScene />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050510]/50 to-[#050510] z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-purple-900/10 z-[1]" />

        {/* Animated grid */}
        <div className="absolute inset-0 z-[1] opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Floating preview images */}
        <FloatingImage src={img1} delay={0} className="hero-float-img absolute top-[10%] left-[3%] w-44 h-28 rounded-2xl opacity-60 shadow-2xl shadow-blue-500/20 border border-white/5 overflow-hidden hidden lg:block z-[2]" />
        <FloatingImage src={img3} delay={0.5} className="hero-float-img absolute top-[15%] right-[4%] w-40 h-32 rounded-2xl opacity-50 shadow-2xl shadow-cyan-500/20 border border-white/5 overflow-hidden hidden lg:block z-[2]" />
        <FloatingImage src={img7} delay={1} className="hero-float-img absolute bottom-[20%] left-[5%] w-48 h-30 rounded-2xl opacity-50 shadow-2xl shadow-purple-500/20 border border-white/5 overflow-hidden hidden lg:block z-[2]" />
        <FloatingImage src={img5} delay={1.5} className="hero-float-img absolute bottom-[25%] right-[3%] w-36 h-28 rounded-2xl opacity-40 shadow-2xl shadow-orange-500/20 border border-white/5 overflow-hidden hidden lg:block z-[2]" />
        <FloatingImage src={img2} delay={0.8} className="hero-float-img absolute top-[45%] left-[12%] w-32 h-24 rounded-2xl opacity-30 shadow-2xl shadow-purple-500/20 border border-white/5 overflow-hidden hidden xl:block z-[2]" />

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <div className="hero-title" style={{ opacity: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8 backdrop-blur-sm">
              <Sparkles size={14} className="text-yellow-400" />
              Powered by Google Gemini AI
              <ChevronRight size={14} />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95]">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
                AI Income
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                Tracker
              </span>
            </h1>
          </div>

          <p className="hero-subtitle mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed" style={{ opacity: 0 }}>
            The future of personal finance. AI-powered insights, 3D visualizations,
            and intelligent analytics — all in one stunning dashboard.
          </p>

          <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ opacity: 0 }}>
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-semibold text-lg text-white overflow-hidden transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-2xl font-semibold text-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all hover:border-white/20"
            >
              Sign In
            </Link>
          </div>

          {/* Stats bar */}
          <div className="hero-stats mt-16 flex items-center justify-center gap-8 sm:gap-12" style={{ opacity: 0 }}>
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">{s.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown size={20} className="text-gray-600" />
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════
          SHOWCASE GALLERY — Scene highlight
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm uppercase tracking-[0.3em] text-emerald-400 font-medium mb-4"
            >
              Visual Experience
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Finance Meets
              </span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Art
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 mt-4 max-w-xl mx-auto"
            >
              Every visualization is crafted with cinematic precision — turning your financial data into an immersive experience.
            </motion.p>
          </div>

          {/* Active scene spotlight */}
          <div className="relative mb-16 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="relative"
              >
                <div className="aspect-[21/9] overflow-hidden">
                  <img
                    src={scenes[activeScene].img}
                    alt={scenes[activeScene].title}
                    className="w-full h-full object-cover"
                    style={{
                      transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px) scale(1.05)`,
                      transition: "transform 0.3s ease-out",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050510]/60 via-transparent to-[#050510]/60" />
                </div>

                {/* Spotlight overlay info */}
                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => { const Icon = scenes[activeScene].icon; return <Icon size={20} className="text-emerald-400" />; })()}
                    <span className="text-emerald-400 text-sm font-medium uppercase tracking-wider">Scene {activeScene + 1} of {scenes.length}</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">{scenes[activeScene].title}</h3>
                  <p className="text-gray-400 text-lg max-w-2xl">{scenes[activeScene].description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {scenes[activeScene].tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Scene selector dots */}
            <div className="absolute top-6 right-6 flex gap-2">
              {scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScene(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === activeScene ? "bg-emerald-400 w-8" : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Scene thumbnail strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {scenes.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => setActiveScene(i)}
                className={`group relative aspect-[4/3] rounded-xl overflow-hidden border transition-all ${
                  i === activeScene ? "border-emerald-500/50 ring-2 ring-emerald-500/20 scale-[1.02]" : "border-white/5 hover:border-white/20"
                }`}
              >
                <img src={scene.img} alt={scene.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] text-white/80 font-medium truncate">{scene.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCENE CARDS — Detailed showcase
          ═══════════════════════════════════════════════════════════════ */}
      <section ref={scenesRef} className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {scenes.map((scene, i) => {
            const isEven = i % 2 === 0;
            const Icon = scene.icon;
            return (
              <div key={scene.id} className={`scene-card flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}>
                {/* Image */}
                <div className="lg:w-3/5 w-full relative group">
                  <div className={`absolute -inset-4 bg-gradient-to-r ${scene.accent} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  <div className={`relative overflow-hidden rounded-2xl border ${scene.border} shadow-2xl ${scene.glow}`}>
                    <img
                      src={scene.img}
                      alt={scene.title}
                      className="w-full aspect-video object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Scene number badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                      <span className="text-emerald-400 font-bold text-sm">0{scene.id}</span>
                      <span className="text-gray-400 text-xs">/07</span>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="lg:w-2/5 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${scene.accent} flex items-center justify-center`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Scene {scene.id}</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3">{scene.title}</h3>
                  <p className="text-gray-500 text-sm mb-2 italic">{scene.subtitle}</p>
                  <p className="text-gray-400 leading-relaxed mb-6">{scene.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {scene.tags.map((tag) => (
                      <span key={tag} className={`px-3 py-1.5 rounded-lg bg-white/[0.03] border ${scene.border} text-xs text-gray-300 font-medium`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES GRID
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400 font-medium mb-4">Capabilities</p>
            <h2 className="text-4xl sm:text-5xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Everything You</span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Need</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="feature-card group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all duration-500 hover:bg-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <f.icon size={22} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRICING TEASER
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.3em] text-purple-400 font-medium mb-4">Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Start Free, Go Pro</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free tier */}
            <div className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/10">
              <h3 className="text-xl font-bold text-white mb-1">Free</h3>
              <p className="text-gray-500 text-sm mb-6">Everything you need to start</p>
              <p className="text-4xl font-black text-white mb-8">$0<span className="text-lg text-gray-500 font-normal">/forever</span></p>
              <ul className="space-y-3 mb-8">
                {["Income & Expense Tracking", "Savings Goals", "Loan Management", "5 AI Requests / Day", "Basic Dashboard Charts"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-400 text-sm">
                    <Check size={16} className="text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block text-center py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium">
                Get Started
              </Link>
            </div>

            {/* Pro tier */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-xs font-bold text-white uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
              <p className="text-gray-400 text-sm mb-6">Unlock the full power of AI</p>
              <p className="text-4xl font-black text-white mb-8">$9.99<span className="text-lg text-gray-400 font-normal">/month</span></p>
              <ul className="space-y-3 mb-8">
                {["Everything in Free", "Unlimited AI Requests", "Advanced Analytics", "AI Expense Predictions", "Personalized Budget Advice", "PDF Export", "Priority Support"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-300 text-sm">
                    <Check size={16} className="text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 rounded-full blur-[100px]" />

        <div className="cta-section max-w-4xl mx-auto relative text-center">
          {/* Floating images around CTA */}
          <div className="absolute -top-20 -left-10 w-32 h-24 rounded-xl overflow-hidden border border-white/5 opacity-30 rotate-[-8deg] hidden lg:block">
            <img src={img4} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-16 -right-10 w-28 h-20 rounded-xl overflow-hidden border border-white/5 opacity-25 rotate-[6deg] hidden lg:block">
            <img src={img6} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8">
            <Zap size={14} className="text-yellow-400" />
            Ready to transform your finances?
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
              Join the Future of
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
              Personal Finance
            </span>
          </h2>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Start tracking your income, expenses, savings, and loans with AI-powered insights.
            Your financial universe awaits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-semibold text-lg text-white hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              Join Now — It's Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-10 py-4 rounded-2xl font-semibold text-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">AI Income Tracker</span>
          </div>
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} AI Income Tracker. Built with MERN + Gemini AI.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-gray-500 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link to="/register" className="text-gray-500 hover:text-white text-sm transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
