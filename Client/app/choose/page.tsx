"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { motion } from "motion/react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern"

export default function ChoosePage() {
    const router = useRouter()
    const { theme } = useTheme()
    const isDark = theme === "dark"

    const handleSelect = (persona: "mia" | "leo") => {
        router.push(`/onboard?persona=${persona}`)
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#F5F3EE] dark:bg-[#0D0D18]">
            {/* Full-page interactive grid background */}
            <InteractiveGridPattern
                width={50}
                height={50}
                squares={[40, 30]}
                className={cn(
                    "mask-[radial-gradient(900px_circle_at_center,white,transparent)]",
                    "inset-x-0 inset-y-[-30%] h-[200%]"
                )}
                squaresClassName={isDark ? "hover:fill-white/5 stroke-white/10" : "hover:fill-black/5 stroke-black/10"}
            />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl relative z-10 mx-auto px-6 min-h-screen flex flex-col items-center justify-center"
            >
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center text-[11px] font-medium tracking-[0.2em] uppercase mb-6"
                    style={{ 
                        color: isDark ? "#6B6B8A" : "#9999BB",
                        letterSpacing: "0.2em"
                    }}
                >
                    Choose your student
                </motion.p>
                
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-4"
                    style={{
                        fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                        color: isDark ? "#FFFFFF" : "#1A1A2E",
                        fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
                        fontWeight: 600,
                        lineHeight: 1.3,
                        letterSpacing: "-0.01em"
                    }}
                >
                    Who are you teaching today?
                </motion.h1>
                
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-12"
                    style={{ 
                        color: isDark ? "#6B6B8A" : "#8080A0",
                        fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                        fontSize: "0.95rem",
                        fontWeight: 400,
                        lineHeight: 1.6
                    }}
                >
                    Each student tests a different kind of recall.
                </motion.p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Mia Card */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect("mia")}
                        className="group relative text-left rounded-2xl p-4 border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, rgba(19,19,31,0.9), rgba(26,26,46,0.9))"
                                : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,238,248,0.9))",
                            border: isDark ? "1px solid rgba(42,42,69,0.5)" : "1px solid rgba(226,223,216,0.5)",
                            boxShadow: isDark
                                ? "0 8px 32px rgba(0,0,0,0.2)"
                                : "0 8px 32px rgba(0,0,0,0.06)",
                            backdropFilter: "blur(10px)"
                        }}
                    >
        
                        {/* Hover light effect */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00897B] to-transparent opacity-30 blur-xl"
                                style={{
                                    transform: "translateX(-100%)",
                                    animation: "shimmer 1.5s infinite"
                                }}
                            />
                            <div 
                                className="absolute inset-0 rounded-2xl"
                                style={{
                                    background: "radial-gradient(circle at 50% 0%, rgba(0,137,123,0.2), transparent 70%)"
                                }}
                            />
                        </motion.div>

                        <div className="flex justify-center mb-4 relative z-10">
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="relative"
                            >
                                <motion.div 
                                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                                    style={{ background: "#00897B" }}
                                    whileHover={{ scale: 1.2 }}
                                />
                                <Image
                                    src="/mia_cartoon.png"
                                    alt="Mia"
                                    width={110}
                                    height={110}
                                    className="rounded-full relative"
                                    style={{
                                        border: "3px solid #00897B33",
                                        background: isDark ? "#1A2A28" : "#E8F5F3"
                                    }}
                                />
                            </motion.div>
                        </div>

                        <h2
                            className="text-xl font-semibold mb-1 relative z-10"
                            style={{
                                fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                color: isDark ? "#FFFFFF" : "#1A1A2E",
                                fontWeight: 600
                            }}
                        >
                            Mia
                        </h2>
                        <p
                            className="text-xs font-semibold uppercase tracking-wider mb-3 relative z-10"
                            style={{ color: "#00897B" }}
                        >
                            Deep understanding
                        </p>
                        <p
                            className="text-sm leading-relaxed relative z-10"
                            style={{ 
                                color: isDark ? "#8080AA" : "#606080",
                                fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                lineHeight: 1.6
                            }}
                        >
                            Mia pushes you to explain the <em className="font-semibold" style={{ color: "#00897B" }}>why</em> behind everything. She asks follow-up questions, makes connections between concepts, and won't move on until she truly understands.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2 relative z-10">
                            {["Mechanisms", "Connections", "Application"].map(tag => (
                                <motion.span
                                    key={tag}
                                    whileHover={{ scale: 1.05 }}
                                    className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-200"
                                    style={{
                                        background: isDark ? "#00897B22" : "#00897B15",
                                        color: "#00897B",
                                        fontFamily: "var(--font-ui, 'DM Sans', sans-serif)"
                                    }}
                                >
                                    {tag}
                                </motion.span>
                            ))}
                        </div>

                        <motion.div
                            className="mt-5 text-xs font-medium flex items-center gap-1 relative z-10"
                            style={{ color: "#00897B", fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}
                            whileHover={{ gap: "0.5rem" }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            Teach Mia →
                        </motion.div>
                    </motion.button>

                    {/* Leo Card */}
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect("leo")}
                        className="group relative text-left rounded-2xl p-6 border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, rgba(19,19,31,0.9), rgba(29,24,36,0.9))"
                                : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,240,255,0.9))",
                            border: isDark ? "1px solid rgba(46,32,64,0.5)" : "1px solid rgba(226,223,216,0.5)",
                            boxShadow: isDark
                                ? "0 8px 32px rgba(0,0,0,0.2)"
                                : "0 8px 32px rgba(0,0,0,0.06)",
                            backdropFilter: "blur(10px)"
                        }}
                    >
                        {/* Hover light effect */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent opacity-30 blur-xl"
                                style={{
                                    transform: "translateX(-100%)",
                                    animation: "shimmer 1.5s infinite"
                                }}
                            />
                            <div 
                                className="absolute inset-0 rounded-2xl"
                                style={{
                                    background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.2), transparent 70%)"
                                }}
                            />
                        </motion.div>

                        <div className="flex justify-center mb-4 relative z-10">
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="relative"
                            >
                                <motion.div 
                                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                                    style={{ background: "#7C3AED" }}
                                    whileHover={{ scale: 1.2 }}
                                />
                                <Image
                                    src="/leo_cartoon.png"
                                    alt="Leo"
                                    width={110}
                                    height={110}
                                    className="rounded-full relative"
                                    style={{
                                        border: "3px solid #7C3AED33",
                                        background: isDark ? "#1E1828" : "#F0EBF8"
                                    }}
                                />
                            </motion.div>
                        </div>

                        <h2
                            className="text-xl font-semibold mb-1 relative z-10"
                            style={{
                                fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                color: isDark ? "#FFFFFF" : "#1A1A2E",
                                fontWeight: 600
                            }}
                        >
                            Leo
                        </h2>
                        <p
                            className="text-xs font-semibold uppercase tracking-wider mb-3 relative z-10"
                            style={{ color: "#7C3AED" }}
                        >
                            Surface understanding
                        </p>
                        <p
                            className="text-sm leading-relaxed relative z-10"
                            style={{ 
                                color: isDark ? "#8080AA" : "#606080",
                                fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                lineHeight: 1.6
                            }}
                        >
                            Leo wants the key facts and definitions — the gist. He's satisfied with clear, concise answers and moves quickly through topics. Great for testing broad recall.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2 relative z-10">
                            {["Definitions", "Key facts", "Overview"].map(tag => (
                                <motion.span
                                    key={tag}
                                    whileHover={{ scale: 1.05 }}
                                    className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-200"
                                    style={{
                                        background: isDark ? "#7C3AED22" : "#7C3AED15",
                                        color: "#7C3AED",
                                        fontFamily: "var(--font-ui, 'DM Sans', sans-serif)"
                                    }}
                                >
                                    {tag}
                                </motion.span>
                            ))}
                        </div>

                        <motion.div
                            className="mt-5 text-xs font-medium flex items-center gap-1 relative z-10"
                            style={{ color: "#7C3AED", fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}
                            whileHover={{ gap: "0.5rem" }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            Teach Leo →
                        </motion.div>
                    </motion.button>
                </div>
            </motion.div>

            {/* Add shimmer animation keyframes */}
            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    )
}