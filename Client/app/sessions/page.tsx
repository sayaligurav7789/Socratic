"use client"

import Link from "next/link"
import { ArrowRight, Brain, Clock, Plus, Loader2, PlayCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { BACKEND_URL } from "@/lib/config"

// Removed dummy MOCK_SESSIONS

// Function to map score to color scheme based on PRD Mastery Scale
function getScoreStyles(score: number) {
    if (score >= 80) return { bg: "#E8F8F4", text: "#00695C", label: "Strong" }
    if (score >= 60) return { bg: "#EEF0FF", text: "#3D30C4", label: "Good" }
    if (score >= 40) return { bg: "#FEF3C7", text: "#B45309", label: "Developing" }
    return { bg: "#FFF7ED", text: "#C2410C", label: "Early stage" }
}

export default function SessionsPage() {
    const { isLoaded, isSignedIn, user } = useUser()
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSessions = async () => {
            if (!isLoaded || !isSignedIn || !user) {
                if (isLoaded && !isSignedIn) setLoading(false);
                return;
            }

            try {
                // Fetch directly from the backend server.
                const response = await fetch(`${BACKEND_URL}/api/users/${user.id}/sessions`);
                const result = await response.json();

                if (result.success) {
                    setSessions(result.data);
                }
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [isLoaded, isSignedIn, user]);

    return (
        <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#0D0D18] px-6 py-28" style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}>
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1
                            className="text-[#1A1A2E] dark:text-[#EEEEFF]"
                            style={{
                                fontFamily: "var(--font-display, 'Fraunces', serif)",
                                fontSize: "36px",
                                fontWeight: 300,
                                fontStyle: "italic",
                                lineHeight: 1.2,
                            }}
                        >
                            Your Sessions
                        </h1>
                        <p className="mt-2 text-[15px] text-[#4A4A68]">
                            Review past teaching sessions and mastery reports.
                        </p>
                    </div>

                    <Link href="/onboard">
                        <button
                            className="flex items-center gap-2 rounded-2xl px-6 py-3 text-white transition active:scale-[0.98] shadow-md"
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg, #00695C 0%, #004D40 100%)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, #00897B 0%, #00695C 100%)")}
                        >
                            <Plus size={16} /> New Session
                        </button>
                    </Link>
                </div>

                {/* Sessions Grid */}
                {loading ? (
                    <div className="flex h-48 items-center justify-center">
                        <Loader2 className="animate-spin text-[#00897B]" size={32} />
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {sessions.map((session) => {
                            const isActive = session.status === 'active' || session.status === 'initializing'
                            const style = getScoreStyles(session.overallScore || session.score || 0)
                            const href = isActive
                                ? `/session/${session.sessionId || session._id}`
                                : `/report/${session.sessionId || session._id}`

                            // Formatting the MongoDB date
                            const dateObj = new Date(session.createdAt)
                            const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

                            return (
                                <Link href={href} key={session.sessionId || session._id}>
                                    <div
                                        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-[#13131F] border border-[#E2DFD8] dark:border-white/[0.08] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = isActive ? "#00897B" : "#C8C5BC")}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                                    >
                                        <div>
                                            {/* Top Meta Row */}
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-[12px] text-[#9898AA]">
                                                    <Clock size={13} />
                                                    <span>{dateStr}{session.duration ? ` • ${session.duration}` : ""}</span>
                                                </div>
                                                {/* Status / Score Badge */}
                                                {isActive ? (
                                                    <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-[#E8F8F4] text-[#00695C]">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#00897B] animate-pulse" />
                                                        <span style={{ fontSize: "12px", fontWeight: 600 }}>In Progress</span>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                                                        style={{ background: style.bg, color: style.text }}
                                                    >
                                                        <Brain size={12} strokeWidth={2.5} />
                                                        <span style={{ fontSize: "12px", fontWeight: 600 }}>
                                                            {session.overallScore || session.score || 0}% — {style.label}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Topic */}
                                            <h3
                                                className="mb-3 text-[18px] font-semibold text-[#1A1A2E] dark:text-[#EEEEFF] leading-tight group-hover:text-[#00897B] transition-colors"
                                            >
                                                {session.topic}
                                            </h3>

                                            {/* Concepts Tags */}
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {(session.conceptTree || session.concepts)?.slice(0, 4).map((concept: any) => (
                                                    <span
                                                        key={typeof concept === 'string' ? concept : concept.id}
                                                        className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#4A4A68] dark:text-[#9898BB] bg-[#F0EEE9] dark:bg-white/[0.06] border border-[#E2DFD8] dark:border-white/[0.08]"
                                                    >
                                                        {typeof concept === 'string' ? concept : concept.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Bottom Action Row */}
                                        <div className="flex items-center justify-end border-t border-[#E2DFD8] dark:border-white/[0.08] pt-4 mt-auto">
                                            {isActive ? (
                                                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#00897B] transition-transform group-hover:translate-x-1">
                                                    <PlayCircle size={15} /> Resume Session
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[13px] font-medium text-[#00897B] transition-transform group-hover:translate-x-1">
                                                    View Report <ArrowRight size={14} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {!loading && sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl py-24 text-center border-2 border-dashed border-[#E2DFD8] dark:border-white/10 bg-white dark:bg-[#13131F]">
                        <Brain size={48} className="mb-4 text-[#C4C3CE]" />
                        <h3 className="mb-2 text-[18px] font-semibold text-[#1A1A2E]">No teaching sessions yet</h3>
                        <p className="mb-6 max-w-sm text-[14px] text-[#9898AA]">
                            Start your first session to put your knowledge to the test and uncover your blind spots.
                        </p>
                        <Link href="/onboard">
                            <button
                                className="rounded-xl px-5 py-2.5 transition"
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#fff",
                                    background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                                }}
                            >
                                Start your first session
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}