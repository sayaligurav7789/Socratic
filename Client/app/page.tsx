"use client"

import Link from "next/link"
import {
  Brain, BookOpen, Sparkles, Lightbulb, BarChart2, MessageCircle,
  ArrowRight, CheckCircle, AlertCircle, X, Mic, Zap
} from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

const features = [
  {
    icon: <MessageCircle size={20} strokeWidth={1.8} />,
    color: "#00897B",
    darkBg: "rgba(0,137,123,0.15)",
    lightBg: "rgba(0,137,123,0.10)",
    title: "Teach Mia",
    desc: "Explain your topic to Mia, an AI student who asks questions like a real learner — not a tutor.",
  },
  {
    icon: <BarChart2 size={20} strokeWidth={1.8} />,
    color: "#7C6FE8",
    darkBg: "rgba(124,111,232,0.15)",
    lightBg: "rgba(88,73,232,0.10)",
    title: "Live knowledge radar",
    desc: "A radar chart updates in real time as you cover each concept, exposing gaps as they happen.",
  },
  {
    icon: <Brain size={20} strokeWidth={1.8} />,
    color: "#00897B",
    darkBg: "rgba(0,137,123,0.15)",
    lightBg: "rgba(0,137,123,0.10)",
    title: "Misconception detection",
    desc: "Mia quietly plants a wrong belief. If you don't catch it, the report flags it as a blind spot.",
  },
  {
    icon: <Mic size={20} strokeWidth={1.8} />,
    color: "#E87C6F",
    darkBg: "rgba(232,124,111,0.15)",
    lightBg: "rgba(232,124,111,0.10)",
    title: "Voice mode",
    desc: "Speak your explanations out loud. Mia responds in her own voice — a full spoken conversation.",
  },
  {
    icon: <BookOpen size={20} strokeWidth={1.8} />,
    color: "#7C6FE8",
    darkBg: "rgba(124,111,232,0.15)",
    lightBg: "rgba(88,73,232,0.10)",
    title: "Add source material",
    desc: "Paste a URL or upload a PDF. Mia adapts her knowledge to exactly what you're trying to learn.",
  },
  {
    icon: <Lightbulb size={20} strokeWidth={1.8} />,
    color: "#00897B",
    darkBg: "rgba(0,137,123,0.15)",
    lightBg: "rgba(0,137,123,0.10)",
    title: "Mastery report",
    desc: "Every session ends with a full animated report — a score, concept notes, and your best moment.",
  },
]

const steps = [
  {
    n: "01",
    label: "Enter your topic",
    sub: "Any subject — from photosynthesis to React hooks to the French Revolution.",
    icon: <Zap size={16} />,
  },
  {
    n: "02",
    label: "Teach Mia live",
    sub: "Mia asks questions. You explain. Gaps and blind spots surface naturally through conversation.",
    icon: <MessageCircle size={16} />,
  },
  {
    n: "03",
    label: "Get your report",
    sub: "Score, blind spots, best moment — everything you need to know in one animated report.",
    icon: <Brain size={16} />,
  },
]

const chatPreview = [
  { role: "mia", text: "Wait — so what actually is photosynthesis? Like, in simple terms?" },
  { role: "user", text: "It's how plants make their own food using sunlight, water, and CO₂." },
  { role: "mia", text: "Okay that makes sense! But... where exactly does the sunlight part happen? I always thought it was the whole leaf?" },
  { role: "user", text: "Good question — it actually happens inside structures called chloroplasts, specifically in the thylakoid membranes." },
  { role: "mia", text: "Oh wow, I had no idea it was that specific. So the chloroplast is like a mini power plant inside the cell?" },
]

function AuthToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get("auth") === "required") {
      setVisible(true)
      router.replace(pathname, { scroll: false })
      const timer = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router, pathname])

  if (!visible) return null

  return (
    <div className="fixed top-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-4 bg-white dark:bg-[#1A1A2E] border border-[#E2DFD8] dark:border-white/10">
      <AlertCircle size={18} className="text-amber-500" />
      <span className="text-sm font-medium text-[#1A1A2E] dark:text-[#E8E8F0]">
        Please sign in or create an account to continue.
      </span>
      <button onClick={() => setVisible(false)} className="ml-2 rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-white/10">
        <X size={14} className="text-[#9898AA]" />
      </button>
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F3EE] dark:bg-[#0D0D18]" style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}>
      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-24 text-center">

        {/* Animated background orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb orb-teal" />
          <div className="orb orb-purple" />
          <div className="orb orb-peach" />
        </div>

        {/* Pill badge */}
        <div className="relative mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[rgba(88,73,232,0.08)] dark:bg-[rgba(124,111,232,0.12)] border border-[rgba(88,73,232,0.18)] dark:border-[rgba(124,111,232,0.25)]">
          <Sparkles size={13} className="text-[#5849E8] dark:text-[#9B8FF0]" />
          <span className="text-[12px] font-medium tracking-wide text-[#5849E8] dark:text-[#9B8FF0]">
            AI-powered learning verification
          </span>
        </div>

        {/* Headline */}
        <h1
          className="relative mb-6 text-[#1A1A2E] dark:text-[#EEEEFF]"
          style={{
            fontFamily: "var(--font-display, 'Fraunces', serif)",
            fontSize: "clamp(2rem, 4.8vw, 3.8rem)",
            fontWeight: 300,
            fontStyle: "italic",
            lineHeight: 1.12,
            maxWidth: "780px",
          }}
        >
          Teach it.{" "}
          <span className="text-[#00897B] dark:text-[#00BFA5]">Prove it.</span>{" "}
          Own it.
        </h1>

        {/* Sub */}
        <p className="relative mb-10 max-w-[540px] text-[18px] leading-relaxed text-[#4A4A68] dark:text-[#9898BB]">
          Socratic tests your understanding by making you teach Mia, an AI student
          who asks the questions you forgot to ask yourself.
        </p>

        {/* CTAs */}
        <div className="relative flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link href="/choose">
            <button
              className="flex items-center gap-2 rounded-2xl px-8 py-3.5 text-white font-semibold text-[15px] transition-all active:scale-[0.98] hover:shadow-[0_8px_30px_rgba(0,137,123,0.4)]"
              style={{
                background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                boxShadow: "0 4px 20px rgba(0,137,123,0.28)",
              }}
            >
              Start teaching <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/sessions">
            <button className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-medium text-[#4A4A68] dark:text-[#9898BB] border border-[#E2DFD8] dark:border-white/10 bg-transparent dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all">
              View my sessions
            </button>
          </Link>
        </div>

        {/* Trust strip */}
        <div className="relative flex flex-wrap items-center justify-center gap-6">
          {["No quizzes", "No flashcards", "Real understanding"].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-[13px] text-[#9898AA] dark:text-[#6868AA]">
              <CheckCircle size={13} className="text-[#00897B] dark:text-[#00BFA5]" />
              {t}
            </span>
          ))}
        </div>

        {/* Chat preview card */}
        <div className="relative mt-20 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#E2DFD8] dark:border-white/8 bg-white dark:bg-[#13131F]">
          {/* Card header */}
          <div className="flex items-center gap-3 border-b border-[#F0EEE9] dark:border-white/6 px-5 py-3.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
            </div>
            <span className="text-[12px] text-[#9898AA] dark:text-[#6868AA] font-medium ml-1">Teaching session · Photosynthesis</span>
            <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-[rgba(0,137,123,0.1)] dark:bg-[rgba(0,191,165,0.12)] text-[#00897B] dark:text-[#00BFA5]">● Live</span>
          </div>

          {/* Messages */}
          <div className="px-5 py-5 space-y-3 text-left">
            {chatPreview.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "mia" && (
                  <div className="mr-2.5 mt-1 flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#00897B] to-[#00695C] flex items-center justify-center text-white text-[10px] font-bold">M</div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    msg.role === "mia"
                      ? "bg-[#F7F6F2] dark:bg-white/6 text-[#1A1A2E] dark:text-[#DDDDEF] rounded-tl-sm border border-[#E2DFD8] dark:border-white/6"
                      : "bg-[rgba(0,137,123,0.12)] dark:bg-[rgba(0,191,165,0.1)] text-[#00695C] dark:text-[#00BFA5] rounded-tr-sm border border-[rgba(0,137,123,0.2)] dark:border-[rgba(0,191,165,0.15)]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            <div className="flex justify-start">
              <div className="mr-2.5 mt-1 flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#00897B] to-[#00695C] flex items-center justify-center text-white text-[10px] font-bold">M</div>
              <div className="bg-[#F7F6F2] dark:bg-white/6 border border-[#E2DFD8] dark:border-white/6 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-white dark:bg-[#0F0F1C]">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-center text-[11px] font-medium tracking-widest uppercase text-[#9898AA] dark:text-[#6868AA]">
            How it works
          </p>
          <h2
            className="mb-16 text-center text-[#1A1A2E] dark:text-[#EEEEFF]"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2rem)", fontWeight: 600, lineHeight: 1.3 }}
          >
            Three steps to real mastery
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="relative rounded-2xl p-7 border border-[#E2DFD8] dark:border-white/8 bg-[#F7F6F2] dark:bg-[#13131F] hover:border-[#C8C5BC] dark:hover:border-white/15 transition-colors"
              >
                <span
                  className="mb-4 block text-[#00897B] dark:text-[#00BFA5]"
                  style={{
                    fontFamily: "var(--font-display, 'Fraunces', serif)",
                    fontSize: "38px",
                    fontWeight: 300,
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </span>
                <h3 className="mb-2 text-[16px] font-semibold text-[#1A1A2E] dark:text-[#DDDDEF]">{s.label}</h3>
                <p className="text-[14px] leading-relaxed text-[#4A4A68] dark:text-[#7878AA]">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#F5F3EE] dark:bg-[#0D0D18]">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-center text-[11px] font-medium tracking-widest uppercase text-[#9898AA] dark:text-[#6868AA]">
            Features
          </p>
          <h2
            className="mb-16 text-center text-[#1A1A2E] dark:text-[#EEEEFF]"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2rem)", fontWeight: 600, lineHeight: 1.3 }}
          >
            Built to expose what you don't know
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-6 border border-[#E2DFD8] dark:border-white/8 bg-white dark:bg-[#13131F] hover:border-[#C8C5BC] dark:hover:border-white/15 transition-colors group"
              >
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                  style={{ background: f.lightBg, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="mb-1.5 text-[15px] font-semibold text-[#1A1A2E] dark:text-[#DDDDEF]">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#4A4A68] dark:text-[#7878AA]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE STRIP ──────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white dark:bg-[#0F0F1C] border-y border-[#E2DFD8] dark:border-white/6">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="text-[#4A4A68] dark:text-[#9898BB]"
            style={{
              fontFamily: "var(--font-display, 'Fraunces', serif)",
              fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            "If you can't explain it simply, you don't understand it well enough."
          </p>
          <p className="mt-4 text-[13px] text-[#9898AA] dark:text-[#6868AA]">— Richard Feynman</p>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#F5F3EE] dark:bg-[#0D0D18]">
        <div
          className="mx-auto flex max-w-2xl flex-col items-center gap-7 rounded-3xl px-10 py-16 text-center"
          style={{
            background: "linear-gradient(135deg, #00897B 0%, #005F56 100%)",
            boxShadow: "0 12px 50px rgba(0,137,123,0.35)",
          }}
        >
          <div className="flex items-center gap-2 rounded-full px-3.5 py-1 bg-white/15 border border-white/20">
            <Sparkles size={12} className="text-white/80" />
            <span className="text-[11px] font-medium text-white/80 tracking-wide">Powered by Gemini & Groq</span>
          </div>
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display, 'Fraunces', serif)",
              fontSize: "clamp(1.7rem, 4vw, 2.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.2,
              maxWidth: "440px",
            }}
          >
            Ready to find out what you actually know?
          </h2>
          <p className="text-white/70 text-[15px] max-w-sm leading-relaxed">
            Pick a topic. Start teaching. Mia will find the gaps you didn't know you had.
          </p>
          <Link href="/choose">
            <button
              className="flex items-center gap-2 rounded-2xl px-8 py-3.5 font-semibold text-[15px] text-[#00695C] transition-all active:scale-[0.98] hover:bg-[#F0F9F7]"
              style={{ background: "#FFFFFF" }}
            >
              Start teaching <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-8 py-5 border-t border-[#E2DFD8] dark:border-white/8 bg-[#F5F3EE] dark:bg-[#0D0D18]">
        <span
          className="text-[#1A1A2E] dark:text-[#DDDDEF]"
          style={{ fontFamily: "var(--font-display, 'Fraunces', serif)", fontSize: "18px", fontWeight: 400 }}
        >
          Socratic
        </span>
        <span className="text-[12px] text-[#9898AA] dark:text-[#6868AA]">Teach it. Prove it. Own it.</span>
      </footer>
    </div>
  )
}
