"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Trophy,
    Target,
    Zap,
    AlertCircle,
    ChevronDown,
    Download,
    Link as LinkIcon,
    ArrowLeft,
    RefreshCcw,
    Sparkles,
    Quote,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react"
import RadarChart from "@/components/RadarChart"
import { BACKEND_URL } from "@/lib/config"
import { DotPattern } from "@/components/ui/dot-pattern"
import html2canvas from "html2canvas"

export default function ReportPage() {
    const params = useParams()
    const router = useRouter()
    const { id } = params

    const [session, setSession] = useState<any>(null)
    const [report, setReport] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [statusMessage, setStatusMessage] = useState("Reviewing your session...")

    // For share card download
    const reportRef = useRef<HTMLDivElement>(null)
    const shareCardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!id) return

        const fetchOrCreateReport = async () => {
            try {
                // 1. Check if session already has a report
                const res = await fetch(`${BACKEND_URL}/api/sessions/${id}`)
                const text = await res.text()
                console.log("RAW RESPONSE:", text)

                let data
                try {
                    data = JSON.parse(text)
                } catch (e) {
                    console.error("Not JSON response:", text)
                    return
                }

                if (data.success) {
                    setSession(data.data)

                    if (data.data.report) {
                        setReport(data.data.report)
                        setIsLoading(false)
                    } else {
                        // 2. Generate report if it doesn't exist
                        setStatusMessage("Analyzing your explanations...")
                        const reportRes = await fetch(`${BACKEND_URL}/api/sessions/${id}/report`, {
                            method: 'POST'
                        })
                        const reportData = await reportRes.json()
                        if (reportData.success) {
                            setReport(reportData.data)
                            // Re-fetch session to get updated scores/stats
                            const updatedRes = await fetch(`${BACKEND_URL}/api/sessions/${id}`)
                            const updatedData = await updatedRes.json()
                            setSession(updatedData.data)
                        }
                        setIsLoading(false)
                    }
                }
            } catch (err) {
                console.error("Error fetching report:", err)
            }
        }

        fetchOrCreateReport()
    }, [id])

    // Cycle through loading messages
    useEffect(() => {
        if (!isLoading) return
        const messages = [
            "Reviewing your session...",
            "Analyzing your explanations...",
            "Calculating concept coverage...",
            "Identifying your strongest moments...",
            "Preparing your mastery report..."
        ]
        let i = 0
        const interval = setInterval(() => {
            i = (i + 1) % messages.length
            setStatusMessage(messages[i])
        }, 2500)
        return () => clearInterval(interval)
    }, [isLoading])

    const handleDownload = async () => {
        if (!shareCardRef.current) return

        // Temporarily show the card for capture
        const card = shareCardRef.current
        card.style.display = 'block'
        card.style.opacity = '1'
        card.style.position = 'fixed'
        card.style.top = '0'
        card.style.left = '0'
        card.style.zIndex = '9999'

        await new Promise(resolve => setTimeout(resolve, 100))
        const canvas = await html2canvas(card, {
            backgroundColor: "#F5F3EE",
            scale: 2,
            logging: false,
            useCORS: true,
            width: 600,
            height: 800
        } as any)

        card.style.display = 'none'

        const link = document.createElement('a')
        link.download = `Socratic-report-${session?.topic || 'session'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert("Link copied to clipboard!")
    }

    if (isLoading || !report || !session) {
        return (
            <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#0D0D18] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="mb-8"
                >
                    <div className="h-16 w-16 rounded-full border-4 border-[#00897B]/20 border-t-[#00897B]" />
                </motion.div>
                <motion.p
                    key={statusMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[20px] italic text-[#1A1A2E] font-serif"
                >
                    {statusMessage}
                </motion.p>
            </div>
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-[#00695C]"
        if (score >= 60) return "text-[#3D30C4]"
        if (score >= 40) return "text-[#B45309]"
        return "text-[#C2410C]"
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Strong"
        if (score >= 60) return "Good"
        if (score >= 40) return "Developing"
        return "Early Stage"
    }

    return (
        <div className="relative min-h-screen bg-[#F5F3EE] dark:bg-[#0D0D18] text-[#1A1A2E] dark:text-[#EEEEFF] selection:bg-[#00897B]/20">
            <DotPattern
                width={16}
                height={16}
                cx={1}
                cy={1}
                cr={1.5}
                className="absolute inset-0 z-0 opacity-40 text-[#C4C3CE]"
                glow={false}
            />

            <div ref={reportRef} className="relative z-10 mx-auto max-w-4xl px-6 py-20 lg:py-32 overflow-hidden">

                {/* 1. Opening Score Card */}
                <section className="min-h-[70vh] flex flex-col items-center justify-center text-center mb-20">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "backOut" }}
                        className="relative"
                    >
                        <div className="absolute inset-0 -z-10 bg-[#00897B] opacity-10 blur-[120px] rounded-full" />
                        <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#4A4A68] mb-4">Mastery Score</h2>
                        <div className={`text-[120px] font-bold tracking-tight leading-none ${getScoreColor(report.overall_score)}`}>
                            {report.overall_score}
                        </div>
                        <div className={`mt-2 font-semibold text-[18px] uppercase tracking-wider ${getScoreColor(report.overall_score)}`}>
                            {getScoreLabel(report.overall_score)}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-12 max-w-lg"
                    >
                        <p className="text-[22px] font-serif italic text-[#1A1A2E]/90 leading-relaxed">
                            "{report.opening_summary}"
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="mt-10 flex flex-col items-center gap-2"
                    >
                        <span className="text-[11px] font-medium text-[#9898AA] uppercase tracking-widest">Scroll to explore</span>
                        <ChevronDown className="text-[#9898AA] animate-bounce" size={16} />
                    </motion.div>
                </section>

                {/* 2. Knowledge Radar & Summary */}
                <section className="grid lg:grid-cols-2 gap-12 items-center mb-32">
                    <motion.div
                        initial={{ x: -40, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-8 shadow-sm aspect-square flex items-center justify-center relative"
                    >
                        <RadarChart
                            concepts={session.conceptTree}
                            depthScores={session.depthScores}
                        />
                        {/* Blind spot warning axis highlight if exists */}
                        {session.blindSpots?.some((b: any) => b.type === 'missed') && (
                            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF3C7] border border-[#F59E0B]/30 text-[#B45309] text-[11px] font-bold">
                                <AlertCircle size={14} />
                                Blind Spot Detected
                            </div>
                        )}
                    </motion.div>

                    <div className="space-y-8">
                        <motion.div
                            initial={{ x: 40, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h3 className="text-[28px] font-bold text-[#1A1A2E] leading-tight">
                                Your Knowledge Radar for <span className="text-[#00897B]">{session.topic}</span>
                            </h3>
                            <p className="text-[16px] text-[#4A4A68] mt-4 leading-relaxed">
                                You covered <span className="font-bold text-[#1A1A2E]">{Object.values(session.depthScores).filter((s: any) => s >= 3).length} of {session.conceptTree.length}</span> core concepts at an adequate depth.
                                {report.overall_score >= 80 ? " You demonstrated exceptional mastery, connecting complex ideas effortlessly." :
                                    report.overall_score >= 60 ? " You have a solid grasp, but a few areas could benefit from more detailed explanation." :
                                        " You're in the early stages of mastering this topic. Focus on explaining the foundational concepts clearly."}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/50 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                                <div className="text-[11px] font-bold text-[#9898AA] uppercase tracking-wider mb-1">Time Spent</div>
                                <div className="text-[20px] font-bold text-[#1A1A2E]">{session.durationMinutes}m</div>
                            </div>
                            <div className="bg-white/50 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                                <div className="text-[11px] font-bold text-[#9898AA] uppercase tracking-wider mb-1">Explanations</div>
                                <div className="text-[20px] font-bold text-[#1A1A2E]">{session.messages.filter((m: any) => m.role === 'user').length}</div>
                            </div>
                            <div className={`bg-white/50 backdrop-blur-md p-5 rounded-3xl border shadow-sm ${session.pasteCount > 0 ? "border-[#F59E0B]/40" : "border-white/60"}`}>
                                <div className="text-[11px] font-bold text-[#9898AA] uppercase tracking-wider mb-1">Paste Events</div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[20px] font-bold text-[#1A1A2E]">{session.pasteCount || 0}</div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${session.pasteCount > 0 ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#E8F8F4] text-[#00695C]"}`}>
                                        {session.pasteCount > 0 ? "Flagged" : "Clean"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {report?.paste_behavior?.note && (
                            <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#FEF3C7]/70 p-4 text-[13px] text-[#B45309]">
                                {report.paste_behavior.note}
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Concept Breakdown */}
                <section className="mb-32">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-px flex-1 bg-[#E2DFD8]" />
                        <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#4A4A68]">In-Depth Breakdown</h3>
                        <div className="h-px flex-1 bg-[#E2DFD8]" />
                    </div>

                    <div className="space-y-4">
                        {session.conceptTree.map((concept: any, idx: number) => {
                            const score = session.depthScores[concept.id] || 0;
                            const notes = report.concept_notes?.[concept.id] || { what_was_covered: "Covered during the session.", what_was_missed: null };

                            return (
                                <motion.div
                                    key={concept.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    className="group rounded-[2rem] bg-white hover:bg-[#F7F6F2] border border-[#E2DFD8] p-6 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-[17px] font-bold text-[#1A1A2E]">{concept.name}</h4>
                                                {score >= 4 ? (
                                                    <div className="flex items-center gap-1 text-[#00897B] text-[11px] font-bold bg-[#E8F8F4] px-2 py-0.5 rounded-full">
                                                        <Sparkles size={10} /> Mastery
                                                    </div>
                                                ) : null}
                                            </div>
                                            <p className="text-[14px] text-[#4A4A68] mt-1 lg:max-w-xl">{notes.what_was_covered}</p>
                                            {notes.what_was_missed && (
                                                <div className="mt-3 flex items-start gap-2 text-[13px] text-[#B45309] bg-[#FEF3C7]/50 p-3 rounded-xl border border-[#F59E0B]/20">
                                                    <Zap size={14} className="mt-0.5 shrink-0" />
                                                    <span><span className="font-bold">Growth Area:</span> {notes.what_was_missed}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map(step => (
                                                <div
                                                    key={step}
                                                    className={`h-2.5 w-6 rounded-full transition-colors ${step <= score ? "bg-[#00897B]" : "bg-[#E2DFD8]"}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </section>

                {/* 4. Best Moment Pull Quote */}
                {report.best_moment_note && (
                    <section className="mb-32">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative bg-[#1A1A2E] rounded-[3rem] p-12 lg:p-20 text-center text-white overflow-hidden shadow-2xl"
                        >
                            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#00897B] opacity-20 blur-[80px]" />
                            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#5849E8] opacity-20 blur-[80px]" />

                            <Quote className="mx-auto mb-8 text-[#00897B]" size={48} />
                            <h3 className="text-[24px] lg:text-[32px] font-serif italic leading-relaxed mb-8">
                                "The moment it all clicked for Mia."
                            </h3>
                            <p className="text-[17px] text-white/70 max-w-xl mx-auto leading-relaxed">
                                {report.best_moment_note}
                            </p>

                            <div className="mt-12 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/20 text-[13px] font-bold">
                                <Sparkles size={16} className="text-[#00897B]" />
                                {report.standout_stat}
                            </div>
                        </motion.div>
                    </section>
                )}

                {/* 5. Blind Spots (Misconceptions) */}
                {(session.blindSpots && session.blindSpots.length > 0) && (
                    <section className="mb-32">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-px flex-1 bg-[#E2DFD8]" />
                            <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#4A4A68]">Blind Spots</h3>
                            <div className="h-px flex-1 bg-[#E2DFD8]" />
                        </div>

                        <div className="grid gap-6">
                            {session.blindSpots.map((spot: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true }}
                                    className={`rounded-[2.5rem] border p-8 flex flex-col md:flex-row gap-8 items-start ${spot.type === 'caught'
                                        ? "bg-[#E8F8F4] border-[#00897B]/30"
                                        : "bg-[#FEF3C7] border-[#F59E0B]/30"
                                        }`}
                                >
                                    <div className={`h-14 w-14 rounded-2xl shrink-0 flex items-center justify-center ${spot.type === 'caught' ? "bg-[#00897B] text-white" : "bg-[#F59E0B] text-white"
                                        }`}>
                                        {spot.type === 'caught' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className={`text-[20px] font-bold ${spot.type === 'caught' ? "text-[#00695C]" : "text-[#B45309]"}`}>
                                            {spot.type === 'caught' ? "Confusion Clarified" : "Uncorrected Misconception"}
                                        </h4>
                                        <p className={`mt-2 text-[15px] opacity-80 ${spot.type === 'caught' ? "text-[#00695C]" : "text-[#B45309]"}`}>
                                            {spot.type === 'caught'
                                                ? `Mia was confused about ${spot.wrong_belief}, but you steered her right.`
                                                : `Mia expressed a common doubt: "${spot.wrong_belief}". Try to explicitly address this next time.`}
                                        </p>

                                        <div className="mt-6 p-4 rounded-2xl bg-white/40 border border-white/50">
                                            <div className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Correct Insight</div>
                                            <div className="text-[14px] font-medium leading-relaxed">{spot.correct_belief}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 6. Actions */}
                <section className="flex flex-col sm:flex-row items-center justify-center gap-4 py-20">
                    <button
                        onClick={() => router.push('/onboard')}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00897B] text-white font-bold shadow-xl hover:scale-105 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} />
                        Teach Something Else
                    </button>
                    <button
                        onClick={handleDownload}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-[#E2DFD8] text-[#1A1A2E] font-bold shadow-md hover:bg-[#F7F6F2] transition active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        Download Report
                    </button>
                    <button
                        onClick={copyLink}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-[#E2DFD8] text-[#1A1A2E] font-bold shadow-md hover:bg-[#F7F6F2] transition active:scale-95 flex items-center justify-center gap-2"
                    >
                        <LinkIcon size={18} />
                        Share Result
                    </button>
                </section>
            </div>

            {/* 7. Hidden Share Card for Download */}
            <div
                ref={shareCardRef}
                style={{ display: 'none', width: '600px' }}
                className="bg-[#F5F3EE] p-12 text-[#1A1A2E] font-sans relative"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00897B]/10 blur-[80px] -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5849E8]/10 blur-[80px] -z-10" />

                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-[28px] font-serif tracking-tight">Socratic</h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9898AA]">Mastery Report · {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="bg-[#00897B] text-white px-4 py-2 rounded-xl text-[20px] font-bold">
                        {report.overall_score}
                    </div>
                </div>

                <div className="mb-12">
                    <p className="text-[13px] font-bold uppercase tracking-widest text-[#4A4A68] mb-1">Topic</p>
                    <h2 className="text-[36px] font-bold leading-none">{session.topic}</h2>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/60 border border-white p-6 rounded-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9898AA] mb-2">Explanations</p>
                        <p className="text-[24px] font-bold">{session.messages.filter((m: any) => m.role === 'user').length}</p>
                    </div>
                    <div className="bg-white/60 border border-white p-6 rounded-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9898AA] mb-2">Duration</p>
                        <p className="text-[24px] font-bold">{session.durationMinutes}m</p>
                    </div>
                    <div className="bg-white/60 border border-white p-6 rounded-3xl">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9898AA] mb-2">Paste Events</p>
                        <p className="text-[24px] font-bold">{session.pasteCount || 0}</p>
                    </div>
                </div>

                <div className="bg-white/80 border border-white p-8 rounded-[2.5rem] mb-12 flex items-center justify-center aspect-square shadow-sm">
                    {/* Note: In a real app, you'd want a static image or a separate render of the radar here */}
                    <div className="text-center">
                        <Trophy className="mx-auto mb-4 text-[#00897B]" size={48} />
                        <p className="text-[18px] font-serif italic">"{report.opening_summary}"</p>
                    </div>
                </div>

                <div className="text-center text-[#9898AA] text-[12px]">
                    teachback.app/report/{id}
                </div>
            </div>

            {/* Public Footer */}
            <footer className="py-12 border-t border-[#E2DFD8] text-center">
                <p className="text-[13px] text-[#9898AA]">
                    Powered by <span className="font-bold text-[#1A1A2E]">Socratic</span> · Verified Mastery Report
                </p>
            </footer>
        </div>
    )
}
