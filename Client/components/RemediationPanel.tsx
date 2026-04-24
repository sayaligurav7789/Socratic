import { motion, AnimatePresence } from "motion/react"
import { X, Sparkles, Loader2, Zap } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface RemediationPanelProps {
    isOpen: boolean
    onClose: () => void
    lesson: string | null
    isLoading: boolean
}

export default function RemediationPanel({ isOpen, onClose, lesson, isLoading }: RemediationPanelProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-[#F5F3EE] dark:bg-[#0D0D18] shadow-2xl overflow-y-auto"
                    >
                        {/* Panel Header */}
                        <div className="sticky top-0 z-10 bg-[#F5F3EE]/90 dark:bg-[#0D0D18]/90 backdrop-blur-md border-b border-[#E2DFD8] dark:border-white/10 px-8 py-6 flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1 text-[#5849E8] dark:text-[#A78BFA]">
                                    <Zap size={20} className="fill-current" />
                                    <h2 className="text-[20px] font-bold text-[#1A1A2E] dark:text-[#EEEEFF]">Instant Remediation</h2>
                                </div>
                                <p className="text-[14px] text-[#9898AA]">
                                    A personalized lesson to clear your specific misconceptions.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="shrink-0 p-2 rounded-xl hover:bg-[#E2DFD8] dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={22} className="text-[#4A4A68] dark:text-white/60" />
                            </button>
                        </div>

                        {/* Panel Content */}
                        <div className="px-8 py-10 min-h-[50vh] flex flex-col">
                            {isLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="mb-6"
                                    >
                                        <Loader2 size={40} className="text-[#5849E8]" />
                                    </motion.div>
                                    <p className="text-[18px] font-serif italic text-[#1A1A2E] dark:text-white/80">
                                        Crafting your personalized lesson...
                                    </p>
                                </div>
                            ) : lesson ? (
                                <div className="prose prose-lg dark:prose-invert max-w-none 
                                    prose-h1:text-[24px] prose-h1:font-bold prose-h1:text-[#1A1A2E] dark:prose-h1:text-white
                                    prose-h2:text-[20px] prose-h2:font-semibold prose-h2:text-[#1A1A2E] dark:prose-h2:text-white
                                    prose-h3:text-[18px] prose-h3:font-medium prose-h3:text-[#1A1A2E] dark:prose-h3:text-white
                                    prose-p:text-[#4A4A68] dark:prose-p:text-[#E8E8FF] prose-p:leading-relaxed prose-p:mb-6
                                    prose-a:text-[#5849E8] dark:prose-a:text-[#A78BFA]
                                    prose-strong:text-[#1A1A2E] dark:prose-strong:text-white
                                    prose-code:text-[#5849E8] dark:prose-code:text-[#A78BFA] prose-code:bg-[#F3F0FF] dark:prose-code:bg-[#5849E8]/20 prose-code:px-1 prose-code:rounded
                                    prose-pre:bg-[#1A1A2E] prose-pre:text-white prose-pre:border prose-pre:border-white/10
                                    prose-blockquote:border-l-[#5849E8] prose-blockquote:bg-[#5849E8]/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-[#4A4A68] dark:prose-blockquote:text-[#E8E8FF]">
                                    <ReactMarkdown>{lesson}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-[#9898AA]">
                                    <Sparkles size={40} className="mb-4 opacity-50" />
                                    <p>No remediation available for this session.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}