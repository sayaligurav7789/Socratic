"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import Image from "next/image"

export default function ChoosePage() {
    const router = useRouter()
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    const handleSelect = (persona: "mia" | "leo") => {
        router.push(`/onboard?persona=${persona}`)
    }

    return (
        <div
            className="relative min-h-screen w-full flex flex-col items-center justify-center px-6"
            style={{ background: isDark ? "#0D0D18" : "#F5F3EE" }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl"
            >
                <p
                    className="text-center text-xs font-semibold tracking-widest uppercase mb-4"
                    style={{ color: isDark ? "#6B6B8A" : "#9999BB" }}
                >
                    Choose your student
                </p>
                <h1
                    className="text-center text-3xl font-light mb-2"
                    style={{
                        fontFamily: "var(--font-display, 'Fraunces', serif)",
                        color: isDark ? "#E8E6E0" : "#2A2A3E",
                    }}
                >
                    Who are you teaching today?
                </h1>
                <p
                    className="text-center text-sm mb-12"
                    style={{ color: isDark ? "#6B6B8A" : "#8080A0" }}
                >
                    Each student tests a different kind of recall.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Mia Card */}
                    <motion.button
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect("mia")}
                        className="group relative text-left rounded-2xl p-6 border transition-all duration-200 cursor-pointer"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #13131F 0%, #1A1A2E 100%)"
                                : "linear-gradient(135deg, #FFFFFF 0%, #F0EEF8 100%)",
                            border: isDark ? "1px solid #2A2A45" : "1px solid #E2DFD8",
                            boxShadow: isDark
                                ? "0 4px 24px rgba(0,0,0,0.3)"
                                : "0 4px 24px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div className="flex justify-center mb-4">
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Image
                                    src="/mia_cartoon.png"
                                    alt="Mia"
                                    width={110}
                                    height={110}
                                    className="rounded-full"
                                    style={{
                                        border: "3px solid #00897B33",
                                        background: isDark ? "#1A2A28" : "#E8F5F3"
                                    }}
                                />
                            </motion.div>
                        </div>

                        <h2
                            className="text-xl font-semibold mb-1"
                            style={{
                                fontFamily: "var(--font-display, 'Fraunces', serif)",
                                color: isDark ? "#E8E6E0" : "#2A2A3E",
                            }}
                        >
                            Mia
                        </h2>
                        <p
                            className="text-xs font-semibold uppercase tracking-wider mb-3"
                            style={{ color: "#00897B" }}
                        >
                            Deep understanding
                        </p>
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: isDark ? "#8080AA" : "#606080" }}
                        >
                            Mia pushes you to explain the <em>why</em> behind everything. She asks follow-up questions, makes connections between concepts, and won't move on until she truly understands.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {["Mechanisms", "Connections", "Application"].map(tag => (
                                <span
                                    key={tag}
                                    className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                                    style={{
                                        background: isDark ? "#00897B22" : "#00897B15",
                                        color: "#00897B"
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div
                            className="mt-5 text-xs font-medium flex items-center gap-1"
                            style={{ color: "#00897B" }}
                        >
                            Teach Mia →
                        </div>
                    </motion.button>

                    {/* Leo Card */}
                    <motion.button
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect("leo")}
                        className="group relative text-left rounded-2xl p-6 border transition-all duration-200 cursor-pointer"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #13131F 0%, #1D1824 100%)"
                                : "linear-gradient(135deg, #FFFFFF 0%, #F5F0FF 100%)",
                            border: isDark ? "1px solid #2E2040" : "1px solid #E2DFD8",
                            boxShadow: isDark
                                ? "0 4px 24px rgba(0,0,0,0.3)"
                                : "0 4px 24px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div className="flex justify-center mb-4">
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            >
                                <Image
                                    src="/leo_cartoon.png"
                                    alt="Leo"
                                    width={110}
                                    height={110}
                                    className="rounded-full"
                                    style={{
                                        border: "3px solid #7C3AED33",
                                        background: isDark ? "#1E1828" : "#F0EBF8"
                                    }}
                                />
                            </motion.div>
                        </div>

                        <h2
                            className="text-xl font-semibold mb-1"
                            style={{
                                fontFamily: "var(--font-display, 'Fraunces', serif)",
                                color: isDark ? "#E8E6E0" : "#2A2A3E",
                            }}
                        >
                            Leo
                        </h2>
                        <p
                            className="text-xs font-semibold uppercase tracking-wider mb-3"
                            style={{ color: "#7C3AED" }}
                        >
                            Surface understanding
                        </p>
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: isDark ? "#8080AA" : "#606080" }}
                        >
                            Leo wants the key facts and definitions — the gist. He's satisfied with clear, concise answers and moves quickly through topics. Great for testing broad recall.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {["Definitions", "Key facts", "Overview"].map(tag => (
                                <span
                                    key={tag}
                                    className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                                    style={{
                                        background: isDark ? "#7C3AED22" : "#7C3AED15",
                                        color: "#7C3AED"
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div
                            className="mt-5 text-xs font-medium flex items-center gap-1"
                            style={{ color: "#7C3AED" }}
                        >
                            Teach Leo →
                        </div>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )
}
