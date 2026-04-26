"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"

import {
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
    Loader2,
    BookOpen,
    X,
    ExternalLink,
    GraduationCap,
    FileText,
    PlayCircle
} from "lucide-react"
import RadarChart from "@/components/RadarChart"
import { BACKEND_URL } from "@/lib/config"
import { DotPattern } from "@/components/ui/dot-pattern"
import Logo from "@/components/logo"
import { useLanguage } from "@/lib/i18n"

export default function ReportPage() {
    const params = useParams()
    const router = useRouter()
    const { t } = useLanguage()
    const { id } = params

    const [session, setSession] = useState<any>(null)
    const [report, setReport] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [statusMessage, setStatusMessage] = useState("Reviewing your session...")
    const [showResources, setShowResources] = useState(false)
    const [showMisconceptions, setShowMisconceptions] = useState(false)
    const [misconceptionAnswers, setMisconceptionAnswers] = useState<any>(null)
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(false)

    const reportRef = useRef<HTMLDivElement>(null)

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

                    const existingReport = data.data.report
                    const needsRegeneration = !existingReport
                        || !('studyResources' in (existingReport || {}))
                        || !('axis_scores' in (existingReport || {}))

                    if (existingReport && !needsRegeneration) {
                        setReport(existingReport)
                        setIsLoading(false)
                    } else {
                        // Generate or regenerate report (missing or missing correctedConcepts)
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

    const handleFetchMisconceptions = async () => {
        setShowMisconceptions(true)
        if (misconceptionAnswers) return // already fetched

        setIsLoadingAnswers(true)
        try {
            const res = await fetch(`${BACKEND_URL}/api/sessions/${id}/resolve-misconceptions`, {
                method: 'POST'
            })
            const rawText = await res.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error("Failed to parse response as JSON:", rawText);
                return;
            }

            if (data.success) {
                setMisconceptionAnswers(data.data)
            } else {
                console.error("API returned an error:", data.message || data);
            }
        } catch (err) {
            console.error("Error fetching misconception answers:", err)
        } finally {
            setIsLoadingAnswers(false)
        }
    }

    const handleDownload = () => {
        const canvas = document.createElement('canvas')
        const scale = 2
        canvas.width = 600 * scale
        canvas.height = 860 * scale
        const ctx = canvas.getContext('2d')!
        ctx.scale(scale, scale)

        // Background
        ctx.fillStyle = '#F5F3EE'
        ctx.fillRect(0, 0, 600, 860)

        // Top accent bar
        ctx.fillStyle = '#00897B'
        ctx.fillRect(0, 0, 600, 6)

        // Header
        ctx.fillStyle = '#1A1A2E'
        ctx.font = 'bold 26px serif'
        ctx.fillText('Socratic', 48, 60)
        ctx.fillStyle = '#9898AA'
        ctx.font = '11px sans-serif'
        ctx.fillText(`MASTERY REPORT · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}`, 48, 80)

        // Score badge (top right)
        const scoreColor = report.overall_score >= 80 ? '#00695C' : report.overall_score >= 60 ? '#3D30C4' : report.overall_score >= 40 ? '#B45309' : '#C2410C'
        const scoreLabel = report.overall_score >= 80 ? 'Strong' : report.overall_score >= 60 ? 'Good' : report.overall_score >= 40 ? 'Developing' : 'Early Stage'
        ctx.fillStyle = scoreColor
        ctx.beginPath()
        ctx.roundRect(480, 36, 76, 56, 14)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(String(report.overall_score), 518, 67)
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText(scoreLabel.toUpperCase(), 518, 83)
        ctx.textAlign = 'left'

        // Divider
        ctx.strokeStyle = '#E2DFD8'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(48, 108)
        ctx.lineTo(552, 108)
        ctx.stroke()

        // Topic
        ctx.fillStyle = '#9898AA'
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText('TOPIC', 48, 134)
        ctx.fillStyle = '#1A1A2E'
        ctx.font = 'bold 32px serif'
        const topicText = session?.topic || 'Session'
        const maxWidth = 504
        ctx.fillText(topicText.length > 30 ? topicText.slice(0, 30) + '…' : topicText, 48, 170)

        // Summary quote
        ctx.fillStyle = '#4a4a68ff'
        ctx.font = 'italic 15px serif'
        const summary = `"${report.opening_summary || ''}"`
        const words = summary.split(' ')
        let line = ''
        let y = 210
        for (const word of words) {
            const test = line ? `${line} ${word}` : word
            if (ctx.measureText(test).width > maxWidth && line) {
                ctx.fillText(line, 48, y)
                line = word
                y += 22
            } else {
                line = test
            }
        }
        if (line) { ctx.fillText(line, 48, y); y += 22 }
        y += 16

        // Stats row
        const stats = [
            { label: 'TIME SPENT', value: `${session?.durationMinutes || 0}m` },
            { label: 'EXPLANATIONS', value: String(session?.messages?.filter((m: any) => m.role === 'user').length || 0) },
            { label: 'PASTE EVENTS', value: String(session?.pasteCount || 0) }
        ]
        stats.forEach((stat, i) => {
            const x = 48 + i * 172
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.roundRect(x, y, 155, 72, 12)
            ctx.fill()
            ctx.strokeStyle = '#E2DFD8'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.roundRect(x, y, 155, 72, 12)
            ctx.stroke()
            ctx.fillStyle = '#9898AA'
            ctx.font = 'bold 9px sans-serif'
            ctx.fillText(stat.label, x + 14, y + 22)
            ctx.fillStyle = '#1A1A2E'
            ctx.font = 'bold 26px sans-serif'
            ctx.fillText(stat.value, x + 14, y + 56)
        })
        y += 88

        // Concept breakdown title
        ctx.fillStyle = '#9898AA'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('──────   CONCEPT BREAKDOWN   ──────', 300, y + 16)
        ctx.textAlign = 'left'
        y += 36

        // Concept bars
        const concepts = session?.conceptTree || []
        const depthScores = session?.depthScores || {}
        const maxConcepts = Math.min(concepts.length, 6)
        for (let i = 0; i < maxConcepts; i++) {
            const concept = concepts[i]
            const score = depthScores[concept.id] || 0
            const barY = y + i * 44

            // Concept name
            ctx.fillStyle = '#1A1A2E'
            ctx.font = `${score >= 4 ? 'bold' : 'normal'} 13px sans-serif`
            const name = concept.name.length > 32 ? concept.name.slice(0, 32) + '…' : concept.name
            ctx.fillText(name, 48, barY + 14)

            // Score dots
            for (let s = 1; s <= 5; s++) {
                ctx.fillStyle = s <= score ? '#00897B' : '#E2DFD8'
                ctx.beginPath()
                ctx.roundRect(366 + (s - 1) * 38, barY, 32, 10, 5)
                ctx.fill()
            }

            // Mastery badge
            if (score >= 4) {
                ctx.fillStyle = '#E8F8F4'
                ctx.beginPath()
                ctx.roundRect(48, barY + 20, 55, 16, 8)
                ctx.fill()
                ctx.fillStyle = '#00695C'
                ctx.font = 'bold 9px sans-serif'
                ctx.fillText('✦ MASTERY', 54, barY + 32)
            }

            // Row divider
            if (i < maxConcepts - 1) {
                ctx.strokeStyle = '#E2DFD8'
                ctx.lineWidth = 0.5
                ctx.beginPath()
                ctx.moveTo(48, barY + 40)
                ctx.lineTo(552, barY + 40)
                ctx.stroke()
            }
        }

        // Footer
        ctx.fillStyle = '#E2DFD8'
        ctx.fillRect(0, 824, 600, 1)
        ctx.fillStyle = '#9898AA'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Generated by Socratic · Verified Mastery Report', 300, 848)

        // Download
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

            <Logo />
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
                        <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#4A4A68] mb-4">{t("report.score")}</h2>
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
                        {/* Light: Solid Black | Dark: Solid White */}
                        <p className="text-[22px] font-serif italic text-black dark:text-white leading-relaxed">
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
                        {/* Light: Deep Navy-Gray | Dark: Pure White */}
                        <span className="text-[11px] font-bold text-[#1A1A2E] dark:text-white uppercase tracking-widest">
                            Scroll to explore
                        </span>
                        <ChevronDown className="text-[#1A1A2E] dark:text-white animate-bounce" size={16} />
                    </motion.div>
                </section>

                {/* 2. Knowledge Radar & Summary */}
                <section className="grid lg:grid-cols-2 gap-12 items-center mb-32">
                    <motion.div
                        initial={{ x: -40, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-white/40 dark:bg-white/[0.04] backdrop-blur-xl rounded-[2.5rem] border border-white/60 dark:border-white/10 p-8 shadow-sm aspect-square flex items-center justify-center relative"
                    >
                        <RadarChart
                            concepts={session.conceptTree}
                            depthScores={session.depthScores}
                            theoreticalScores={
                                report?.axis_scores
                                    ? Object.fromEntries(report.axis_scores.map((a: any) => [a.id, a.theoretical]))
                                    : undefined
                            }
                            practicalScores={
                                report?.axis_scores
                                    ? Object.fromEntries(report.axis_scores.map((a: any) => [a.id, a.practical]))
                                    : undefined
                            }
                        />
                        {/* Legend (only in dual mode) */}
                        {report?.axis_scores && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full bg-white/70 dark:bg-white/[0.06] backdrop-blur border border-white/60 dark:border-white/10 text-[11px] font-bold tracking-wide">
                                <span className="flex items-center gap-2 text-[#00695C] dark:text-[#4DB6AC]">
                                    <span className="inline-block w-3 h-[2px] bg-[#00897B] dark:bg-[#4DB6AC]" />
                                    {t("report.theoretical") || "THEORETICAL"}
                                </span>
                                <span className="flex items-center gap-2 text-[#B45309] dark:text-[#FBBF24]">
                                    <span className="inline-block w-3 h-[2px] bg-[#F59E0B]" style={{ backgroundImage: 'linear-gradient(to right, #F59E0B 60%, transparent 40%)', backgroundSize: '6px 2px' }} />
                                    {t("report.practical") || "PRACTICAL"}
                                </span>
                            </div>
                        )}
                        {/* Blind spot warning axis highlight if exists */}
                        {session.blindSpots?.some((b: any) => b.type === 'missed') && (
                            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF3C7] dark:bg-[#F59E0B]/15 border border-[#F59E0B]/30 dark:border-[#F59E0B]/30 text-[#B45309] dark:text-[#FBBF24] text-[11px] font-bold">
                                <AlertCircle size={14} />
                                {t("report.blindSpotDetected")}
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
                            <h3 className="text-[28px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF] leading-tight">
                                Your Knowledge Radar for <span className="text-[#00897B] dark:text-[#4DB6AC]">{session.topic}</span>
                            </h3>
                            <p className="text-[16px] text-[#4A4A68] dark:text-[#9898BB] mt-4 leading-relaxed">
                                You covered <span className="font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">{Object.values(session.depthScores).filter((s: any) => s >= 3).length} of {session.conceptTree.length}</span> core concepts at an adequate depth.
                                {report.overall_score >= 80 ? " You demonstrated exceptional mastery, connecting complex ideas effortlessly." :
                                    report.overall_score >= 60 ? " You have a solid grasp, but a few areas could benefit from more detailed explanation." :
                                        " You're in the early stages of mastering this topic. Focus on explaining the foundational concepts clearly."}
                            </p>
                        </motion.div>

                        {/* Dual-axis scores: Theoretical vs Practical */}
                        {typeof report?.theoretical_score === 'number' && typeof report?.practical_score === 'number' && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/50 dark:bg-white/[0.04] backdrop-blur-md p-5 rounded-3xl border border-[#00897B]/30 dark:border-[#4DB6AC]/25 shadow-sm">
                                        <div className="text-[11px] font-bold text-[#00695C] dark:text-[#4DB6AC] uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <span className="inline-block w-3 h-[2px] bg-[#00897B] dark:bg-[#4DB6AC]" />
                                            {t("report.theoretical") || "Theoretical"}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[28px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">{report.theoretical_score}</span>
                                            <span className="text-[13px] text-[#9898AA] dark:text-[#7C7CA8]">/100</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 dark:bg-white/[0.04] backdrop-blur-md p-5 rounded-3xl border border-[#F59E0B]/30 dark:border-[#F59E0B]/25 shadow-sm">
                                        <div className="text-[11px] font-bold text-[#B45309] dark:text-[#FBBF24] uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <span className="inline-block w-3 h-[2px]" style={{ backgroundImage: 'linear-gradient(to right, #F59E0B 60%, transparent 40%)', backgroundSize: '6px 2px' }} />
                                            {t("report.practical") || "Practical"}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[28px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">{report.practical_score}</span>
                                            <span className="text-[13px] text-[#9898AA] dark:text-[#7C7CA8]">/100</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Gap callout */}
                                {report.gap_label && (() => {
                                    const gap = report.gap || 0;
                                    const isTheory = report.gap_label === 'theory_heavy';
                                    const isPractice = report.gap_label === 'practice_heavy';
                                    const isBalanced = report.gap_label === 'balanced';
                                    const headline = isTheory
                                        ? (t("report.gap.theoryHeavy.title") || "Theory-heavy understanding")
                                        : isPractice
                                            ? (t("report.gap.practiceHeavy.title") || "Intuitive but unexplained")
                                            : (t("report.gap.balanced.title") || "Balanced understanding");
                                    const body = isTheory
                                        ? (t("report.gap.theoryHeavy.body") || "You can explain what the concepts are, but haven't yet shown how to apply them. Try a small worked example to close the gap.")
                                        : isPractice
                                            ? (t("report.gap.practiceHeavy.body") || "You can use the ideas in practice, but haven't fully articulated why they work. Try explaining the mechanism in your own words.")
                                            : (t("report.gap.balanced.body") || "Your theory and practice scores track closely — a healthy sign of integrated understanding.");
                                    const tone = isBalanced
                                        ? "border-[#00897B]/30 dark:border-[#4DB6AC]/25 bg-[#E8F8F4]/70 dark:bg-[#00897B]/10 text-[#00695C] dark:text-[#4DB6AC]"
                                        : "border-[#F59E0B]/30 dark:border-[#F59E0B]/25 bg-[#FEF3C7]/70 dark:bg-[#F59E0B]/10 text-[#B45309] dark:text-[#FBBF24]";
                                    const sign = gap > 0 ? `+${gap}` : `${gap}`;
                                    return (
                                        <div className={`rounded-2xl border p-4 ${tone}`}>
                                            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider mb-1">
                                                <span>{t("report.gap.label") || "Gap"}: {sign}</span>
                                                <span className="opacity-50">·</span>
                                                <span>{headline}</span>
                                            </div>
                                            <p className="text-[13px] leading-relaxed opacity-90">{body}</p>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/50 dark:bg-white/[0.04] backdrop-blur-md p-5 rounded-3xl border border-white/60 dark:border-white/10 shadow-sm">
                                <div className="text-[11px] font-bold text-[#9898AA] dark:text-[#7C7CA8] uppercase tracking-wider mb-1">Time Spent</div>
                                <div className="text-[20px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">{session.durationMinutes}m</div>
                            </div>
                            <div className="bg-white/50 dark:bg-white/[0.04] backdrop-blur-md p-5 rounded-3xl border border-white/60 dark:border-white/10 shadow-sm">
                                <div className="text-[11px] font-bold text-[#9898AA] dark:text-[#7C7CA8] uppercase tracking-wider mb-1">Explanations</div>
                                <div className="text-[20px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">{session.messages.filter((m: any) => m.role === 'user').length}</div>
                            </div>
                            <div className={`bg-white/50 dark:bg-white/[0.04] backdrop-blur-md p-5 rounded-3xl border shadow-sm ${session.pasteCount > 0 ? "border-[#F59E0B]/40 dark:border-[#F59E0B]/30" : "border-white/60 dark:border-white/10"}`}>
                                <div className="text-[11px] font-bold text-[#9898AA] dark:text-[#7C7CA8] uppercase tracking-wider mb-1">{t("report.pasteEvents")}</div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-[20px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">{session.pasteCount || 0}</div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${session.pasteCount > 0 ? "bg-[#FEF3C7] dark:bg-[#F59E0B]/15 text-[#B45309] dark:text-[#FBBF24]" : "bg-[#E8F8F4] dark:bg-[#00897B]/15 text-[#00695C] dark:text-[#4DB6AC]"}`}>
                                        {session.pasteCount > 0 ? t("report.flagged") : t("report.clean")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {report?.paste_behavior?.note && (
                            <div className="rounded-2xl border border-[#F59E0B]/30 dark:border-[#F59E0B]/25 bg-[#FEF3C7]/70 dark:bg-[#F59E0B]/10 p-4 text-[13px] text-[#B45309] dark:text-[#FBBF24]">
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
                                    className="group rounded-[2rem] bg-white dark:bg-[#151525] hover:bg-[#F7F6F2] dark:hover:bg-[#1A1A2E] border border-[#E2DFD8] dark:border-white/10 p-6 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),_inset_0_1px_0_rgba(255,255,255,0.05)]"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-[17px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">{concept.name}</h4>
                                                {score >= 4 ? (
                                                    <div className="flex items-center gap-1 text-[#00897B] dark:text-[#4DB6AC] text-[11px] font-bold bg-[#E8F8F4] dark:bg-teal-500/10 px-2 py-0.5 rounded-full dark:border dark:border-teal-500/20 shadow-sm">
                                                        <Sparkles size={10} /> Mastery
                                                    </div>
                                                ) : null}
                                            </div>
                                            <p className="text-[14px] text-[#4A4A68] dark:text-[#E8E8FF] mt-1 lg:max-w-xl leading-relaxed">
                                                {notes.what_was_covered}
                                            </p>

                                            {notes.what_was_missed && (
                                                <div className="mt-4 flex items-start gap-3 text-[13px] 
                                                    /* Light Mode: Solid White with a colored shadow offset */
                                                    bg-white text-[#B45309] shadow-[4px_4px_0px_0px_rgba(245,158,11,0.2)] border border-[#F59E0B]/20 
                                                    /* Dark Mode: Deep Glass with a teal shadow offset */
                                                    dark:bg-[#1A1A2E] dark:text-[#34D399] dark:shadow-[4px_4px_0px_0px_rgba(0,137,123,0.3)] dark:border-white/10 
                                                    p-4 rounded-2xl transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(245,158,11,0.3)]"
                                                >
                                                    <Zap size={16} className="mt-0.5 shrink-0 text-[#F59E0B] dark:text-[#00897B]" />
                                                    <span>
                                                        <span className="font-bold uppercase tracking-wider text-[11px] mr-1">Growth Area:</span>
                                                        {notes.what_was_missed}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map(step => (
                                                <div
                                                    key={step}
                                                    className={`h-2.5 w-6 rounded-full transition-colors ${step <= score ? "bg-[#00897B] dark:bg-[#00897B] dark:shadow-[0_0_8px_rgba(0,137,123,0.6)]" : "bg-[#E2DFD8] dark:bg-white/10"}`}
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
                                {t("report.bestMomentTitle")}
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
                            <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#4A4A68]">{t("report.blindSpots")}</h3>
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
                <section className="py-20 space-y-4">
                    {/* Source-Authenticated Corrections — featured full-width button */}
                    {report.studyResources && report.studyResources.length > 0 && (
                        <motion.button
                            onClick={() => setShowResources(true)}
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full group relative overflow-hidden rounded-3xl px-8 py-6 flex items-center justify-between gap-6 shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2B55 60%, #3D30C4 100%)' }}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: 'linear-gradient(135deg, #2D2B55 0%, #3D30C4 60%, #5849E8 100%)' }}
                            />
                            <div className="relative flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                    <BookOpen size={22} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[17px] font-bold text-white leading-tight">Source-Authenticated Corrections</div>
                                    <div className="text-[13px] text-white/60 mt-0.5">
                                        {report.studyResources.length} gap{report.studyResources.length !== 1 ? 's' : ''} · verified resources from Khan Academy, Britannica & .edu
                                    </div>
                                </div>
                            </div>
                            <div className="relative shrink-0 h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <ExternalLink size={15} className="text-white" />
                            </div>
                        </motion.button>
                    )}

                    {/* Instant Misconception Answers */}
                    {((session.blindSpots && session.blindSpots.length > 0) || (report.studyResources && report.studyResources.length > 0)) && (
                        <motion.button
                            onClick={handleFetchMisconceptions}
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full group relative overflow-hidden rounded-3xl px-8 py-6 flex items-center justify-between gap-6 shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #0D0D18 0%, #1A1A2E 60%, #00897B 100%)' }}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #00695C 60%, #00897B 100%)' }}
                            />
                            <div className="relative flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                    {isLoadingAnswers ? <Loader2 size={22} className="text-white animate-spin" /> : <Zap size={22} className="text-white" />}
                                </div>
                                <div className="text-left">
                                    <div className="text-[17px] font-bold text-white leading-tight">Instant Answers for Misconceptions</div>
                                    <div className="text-[13px] text-white/60 mt-0.5">
                                        {isLoadingAnswers ? "Generating detailed explanations..." : `Resolve ${(session.blindSpots?.length || 0) + (report.studyResources?.length || 0)} misconception${((session.blindSpots?.length || 0) + (report.studyResources?.length || 0)) !== 1 ? 's' : ''} instantly`}
                                    </div>
                                </div>
                            </div>
                            <div className="relative shrink-0 h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <ExternalLink size={15} className="text-white" />
                            </div>
                        </motion.button>
                    )}

                    {/* Secondary row */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={() => router.push('/onboard')}
                            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#00897B] text-white font-bold shadow-lg hover:scale-105 transition active:scale-95 flex items-center justify-center gap-2 text-[14px]"
                        >
                            <RefreshCcw size={16} />
                            Teach Something Else
                        </button>
                        <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white border border-[#E2DFD8] text-[#1A1A2E] font-bold shadow-sm hover:bg-[#F7F6F2] transition active:scale-95 flex items-center justify-center gap-2 text-[14px]"
                        >
                            <Download size={16} />
                            {t("report.download")}
                        </button>
                        <button
                            onClick={copyLink}
                            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white border border-[#E2DFD8] text-[#1A1A2E] font-bold shadow-sm hover:bg-[#F7F6F2] transition active:scale-95 flex items-center justify-center gap-2 text-[14px]"
                        >
                            <LinkIcon size={16} />
                            {t("report.share")}
                        </button>
                    </div>
                </section>
            </div>

            {/* Public Footer */}
            <footer className="py-12 border-t border-[#E2DFD8] text-center">
                <p className="text-[13px] text-[#9898AA]">
                    Powered by <span className="font-bold text-[#1A1A2E]">Socratic</span> · Verified Mastery Report
                </p>
            </footer>

            {/* Source-Authenticated Corrections Slide-Over Panel */}
            <AnimatePresence>
                {showResources && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowResources(false)}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-[#F5F3EE] dark:bg-[#0D0D18] shadow-2xl overflow-y-auto"
                        >
                            {/* Panel Header */}
                            <div className="sticky top-0 z-10 bg-[#F5F3EE]/90 dark:bg-[#0D0D18]/90 backdrop-blur-md border-b border-[#E2DFD8] px-8 py-6 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <GraduationCap size={18} className="text-[#00897B]" />
                                        <h2 className="text-[18px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">Source-Authenticated Corrections</h2>
                                    </div>
                                    <p className="text-[13px] text-[#9898AA]">
                                        Trusted study resources for every knowledge gap identified in your session.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowResources(false)}
                                    className="shrink-0 p-2 rounded-xl hover:bg-[#E2DFD8] transition-colors"
                                >
                                    <X size={20} className="text-[#4A4A68]" />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="px-8 py-8 space-y-8">
                                {report.studyResources.map((item: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ y: 16, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.08 }}
                                        className="rounded-3xl border border-[#E2DFD8] bg-white dark:bg-[#1A1A2E] overflow-hidden"
                                    >
                                        {/* Concept Header */}
                                        <div className="px-6 pt-6 pb-4 border-b border-[#E2DFD8]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-2 w-2 rounded-full bg-[#00897B]" />
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#9898AA]">Gap identified</span>
                                            </div>
                                            <h3 className="text-[16px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF] mb-1">{item.concept}</h3>
                                            <p className="text-[13px] text-[#4A4A68] dark:text-[#9898AA] leading-relaxed">{item.gap_summary}</p>
                                        </div>

                                        {/* Resources */}
                                        <div className="px-6 py-5 space-y-3">
                                            <div className="text-[11px] font-bold uppercase tracking-widest text-[#9898AA] mb-3">{t("report.studyResources")}</div>
                                            {item.resources && item.resources.length > 0 ? item.resources.map((res: any, rIdx: number) => {
                                                const typeIcon = res.type === 'video'
                                                    ? <PlayCircle size={14} className="text-[#5849E8]" />
                                                    : res.type === 'lesson'
                                                        ? <GraduationCap size={14} className="text-[#00897B]" />
                                                        : <FileText size={14} className="text-[#B45309]" />
                                                const typeColor = res.type === 'video'
                                                    ? 'bg-[#F3F0FF] text-[#5849E8]'
                                                    : res.type === 'lesson'
                                                        ? 'bg-[#E8F8F4] text-[#00695C]'
                                                        : 'bg-[#FEF3C7] text-[#B45309]'
                                                return (
                                                    <a
                                                        key={rIdx}
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-start gap-4 p-4 rounded-2xl border border-[#E2DFD8] hover:border-[#00897B]/40 hover:bg-[#F5F3EE] dark:hover:bg-[#0D0D18] transition-all group"
                                                    >
                                                        <div className={`mt-0.5 shrink-0 p-2 rounded-xl ${typeColor}`}>
                                                            {typeIcon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[14px] font-semibold text-[#1A1A2E] dark:text-[#EEEEFF] leading-snug group-hover:text-[#00897B] transition-colors">
                                                                {res.title}
                                                            </div>
                                                            <div className="text-[12px] text-[#9898AA] mt-0.5">{res.source_name}</div>
                                                        </div>
                                                        <ExternalLink size={14} className="shrink-0 mt-1 text-[#9898AA] group-hover:text-[#00897B] transition-colors" />
                                                    </a>
                                                )
                                            }) : (
                                                <p className="text-[13px] text-[#9898AA] italic">No verified sources available for this gap.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Instant Misconception Answers Slide-Over Panel */}
            <AnimatePresence>
                {showMisconceptions && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMisconceptions(false)}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-[#F5F3EE] dark:bg-[#0D0D18] shadow-2xl overflow-y-auto"
                        >
                            {/* Panel Header */}
                            <div className="sticky top-0 z-10 bg-[#F5F3EE]/90 dark:bg-[#0D0D18]/90 backdrop-blur-md border-b border-[#E2DFD8] px-8 py-6 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap size={18} className="text-[#00897B]" />
                                        <h2 className="text-[18px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">Instant Misconception Answers</h2>
                                    </div>
                                    <p className="text-[13px] text-[#9898AA]">
                                        Detailed explanations for the confusions identified during your session.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowMisconceptions(false)}
                                    className="shrink-0 p-2 rounded-xl hover:bg-[#E2DFD8] transition-colors"
                                >
                                    <X size={20} className="text-[#4A4A68]" />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="px-8 py-8 space-y-8">
                                {isLoadingAnswers ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-[#4A4A68]">
                                        <Loader2 size={32} className="animate-spin text-[#00897B] mb-4" />
                                        <p>Generating detailed answers...</p>
                                    </div>
                                ) : misconceptionAnswers && misconceptionAnswers.length > 0 ? (
                                    misconceptionAnswers.map((item: any, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ y: 16, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: idx * 0.08 }}
                                            className="rounded-3xl border border-[#E2DFD8] bg-white dark:bg-[#1A1A2E] overflow-hidden"
                                        >
                                            <div className="px-6 pt-6 pb-4 border-b border-[#E2DFD8]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-2 w-2 rounded-full bg-[#B45309]" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#9898AA]">Confusion</span>
                                                </div>
                                                <h3 className="text-[16px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF] mb-1">{item.wrong_belief}</h3>
                                            </div>

                                            <div className="px-6 py-5 bg-[#E8F8F4]/30 dark:bg-[#00897B]/5">
                                                <div className="text-[11px] font-bold uppercase tracking-widest text-[#00695C] dark:text-[#4DB6AC] mb-2 flex items-center gap-2">
                                                    <CheckCircle2 size={14} /> Correct Insight
                                                </div>
                                                <p className="text-[14px] font-semibold text-[#1A1A2E] dark:text-[#EEEEFF] leading-relaxed mb-4">{item.correct_belief}</p>
                                                
                                                <div className="space-y-4 text-[13px] text-[#4A4A68] dark:text-[#9898AA] leading-relaxed">
                                                    <p>{item.detailed_answer}</p>
                                                    {item.analogy_or_example && (
                                                        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D18] border border-[#E2DFD8] dark:border-white/10 italic">
                                                            <span className="font-bold mr-1 not-italic">Example/Analogy:</span> {item.analogy_or_example}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <p className="text-[13px] text-[#9898AA] italic">No misconceptions were identified.</p>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}