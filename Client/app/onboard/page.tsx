"use client"
export const dynamic = "force-dynamic"

import { cn } from "@/lib/utils"
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern"
import { OrbitingCircles } from "@/components/ui/orbiting-circles"
import { Brain, BookOpen, Sparkles, Lightbulb, Pencil, Loader2, FileText, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useTheme } from "@/components/theme-provider"
import { BACKEND_URL } from "@/lib/config"

const Onboard = () => {
    const router = useRouter()
    const searchParams = typeof window !== "undefined" ? useSearchParams() : null
    const persona = (searchParams?.get("persona") === "leo" ? "leo" : "mia") as "mia" | "leo"
    const personaName = persona === "leo" ? "Leo" : "Mia"
    const LOADING_MESSAGES = [
        "Understanding your topic...",
        `Building ${personaName}'s knowledge...`,
        "Preparing your session..."
    ]
    const { user } = useUser()
    const { theme } = useTheme()
    const isDark = theme === "dark"
    const [topic, setTopic] = useState("")
    const [isShaking, setIsShaking] = useState(false)
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
    const [messageIndex, setMessageIndex] = useState(0)

    // File Attachment State
    const [isAttachmentFlipped, setIsAttachmentFlipped] = useState(false)
    const [attachedFile, setAttachedFile] = useState<File | null>(null)
    const [sourceUrl, setSourceUrl] = useState("")
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)
    const [urlInput, setUrlInput] = useState("")
    const [urlError, setUrlError] = useState("")
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const txtInputRef = useRef<HTMLInputElement>(null)

    const isValidYouTubeUrl = (value: string) => {
        try {
            const parsed = new URL(value.trim())
            const host = parsed.hostname.toLowerCase()
            const allowedHosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"]
            if (!allowedHosts.includes(host)) return false

            if (host.includes("youtu.be")) {
                return parsed.pathname.length > 1
            }

            const path = parsed.pathname.toLowerCase()
            if (path === "/watch") {
                return Boolean(parsed.searchParams.get("v"))
            }

            return path.startsWith("/shorts/") || path.startsWith("/embed/") || path.startsWith("/live/")
        } catch {
            return false
        }
    }

    useEffect(() => {
        if (status !== "loading") return
        
        const timer1 = setTimeout(() => setMessageIndex(1), 1500)
        const timer2 = setTimeout(() => setMessageIndex(2), 3000)
        return () => { clearTimeout(timer1); clearTimeout(timer2) }
    }, [status])

    const handleStart = async () => {
        if (!topic.trim() || !user) {
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 500)
            setStatus("idle")
            return
        }

        setStatus("loading")
        setMessageIndex(0)

        try {
            const formData = new FormData()
            formData.append("topic", topic)
            formData.append("user_id", user.id)
            formData.append("persona", persona)
            
            if (user.primaryEmailAddress) formData.append("email", user.primaryEmailAddress.emailAddress)
            if (user.firstName) formData.append("firstName", user.firstName)
            if (user.lastName) formData.append("lastName", user.lastName)
            if (user.imageUrl) formData.append("imageUrl", user.imageUrl)
            
            if (attachedFile) {
                formData.append("file", attachedFile)
            }
            if (sourceUrl) {
                formData.append("source_url", sourceUrl)
            }

            const response = await fetch(`${BACKEND_URL}/api/sessions/init`, {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                console.error("Failed to initialize session:", data)
                throw new Error(data.message || "Failed to initialize session")
            }
            
            router.push(`/session/${data.data.sessionId}`) 
        } catch (error) {
            console.error("Initialization error:", error)
            setStatus("error")
        }
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#F5F3EE] dark:bg-[#0D0D18]">
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>

            {/* Full-page interactive grid background - STRAIGHT (no skew) */}
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

            {/* Centered glassmorphism card */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
                <div
                    className="relative flex w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl"
                    style={{
                        border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.60)",
                        background: isDark ? "rgba(13,13,28,0.88)" : "rgba(255,255,255,0.48)",
                        backdropFilter: "blur(24px) saturate(180%)",
                        WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    }}
                >
                    {/* Left panel — input & actions / loading state */}
                    <div className="relative z-20 flex flex-1 flex-col gap-5 p-8" style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}>
                        
                        {status === "loading" ? (
                            <div className="flex h-full flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
                                <Loader2 className="animate-spin" size={32} style={{ color: "#00897B" }} />
                                <div className="relative h-8 w-full">
                                    {LOADING_MESSAGES.map((msg, index) => (
                                        <p
                                            key={msg}
                                            className={cn(
                                                "absolute inset-0 text-center transition-opacity duration-300",
                                                messageIndex === index ? "opacity-100" : "opacity-0"
                                            )}
                                            style={{
                                                fontFamily: "var(--font-display, 'Fraunces', serif)",
                                                fontSize: "19px",
                                                fontWeight: 300,
                                                fontStyle: "italic",
                                                color: isDark ? "#FFFFFF" : "#1A1A2E",
                                            }}
                                        >
                                            {msg}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col gap-5 animate-in fade-in duration-300">
                                <h2
                                    style={{
                                        fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                        fontSize: "20px",
                                        fontWeight: 600,
                                        color: isDark ? "#FFFFFF" : "#1A1A2E",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    Enter your topic
                                </h2>

                                <div className="flex flex-col gap-2">
                                    <textarea
                                        rows={5}
                                        value={topic}
                                        onChange={(e) => {
                                            setTopic(e.target.value)
                                            if (status === "error") setStatus("idle")
                                        }}
                                        placeholder="What do you want to teach today? Try 'Photosynthesis' or 'How React hooks work'"
                                        className={cn(
                                            "w-full resize-none rounded-2xl px-4 py-3 outline-none transition shadow-inner",
                                            isShaking && "animate-shake border-[#EF4444]"
                                        )}
                                        style={{
                                            fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                            fontSize: "16px",
                                            fontWeight: 400,
                                            fontStyle: topic ? "normal" : "italic",
                                            background: isDark ? "rgba(255,255,255,0.06)" : "#F0EEE9",
                                            border: isShaking || status === "error" ? "1px solid #EF4444" : isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E2DFD8",
                                            color: isDark ? "#FFFFFF" : "#1A1A2E",
                                            lineHeight: 1.6,
                                        }}
                                        onFocus={e => {
                                            if (!isShaking && status !== "error") e.currentTarget.style.border = "1px solid #00897B"
                                            e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.9)"
                                            e.currentTarget.style.fontStyle = "normal"
                                        }}
                                        onBlur={e => {
                                            if (!isShaking && status !== "error") e.currentTarget.style.border = isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E2DFD8"
                                            e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#F0EEE9"
                                            e.currentTarget.style.fontStyle = topic ? "normal" : "italic"
                                        }}
                                    />
                                    {isShaking && (
                                        <span className="text-sm px-1 animate-in fade-in" style={{ color: "#EF4444" }}>
                                            Please enter a topic first.
                                        </span>
                                    )}
                                </div>

                                <div className="mx-auto h-[44px] w-[280px] relative perspective-[1000px]">
                                    <div 
                                        className={cn(
                                            "relative w-full h-full transition-transform duration-500 transform-3d",
                                            isAttachmentFlipped ? "transform-[rotateX(180deg)]" : ""
                                        )}
                                    >
                                        <div className="absolute inset-0 backface-hidden">
                                            <button
                                                onClick={() => setIsAttachmentFlipped(true)}
                                                className={cn(
                                                    "w-full h-full flex items-center justify-center gap-2 rounded-xl border outline-none transition-colors",
                                                    (attachedFile || sourceUrl)
                                                    ? "border-[#00897B] bg-[#E8F8F4] text-[#00695C] border-solid" 
                                                    : "border-dashed border-[#C8C5BC] text-[#4A4A68] hover:border-[#00897B] hover:text-[#00695C] hover:bg-[#00897B]/5"
                                                )}
                                                style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}
                                            >
                                                {(attachedFile || sourceUrl) ? (
                                                    <div className="flex w-full items-center justify-between px-3">
                                                        <div className="flex items-center gap-2 overflow-hidden max-w-[85%]">
                                                            <FileText size={16} className="shrink-0 text-[#00897B]" />
                                                            <span className="font-medium text-[13px] truncate">{attachedFile ? attachedFile.name : sourceUrl}</span>
                                                        </div>
                                                        <div 
                                                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#00695C] hover:bg-[#00897B]/15 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAttachedFile(null);
                                                                setSourceUrl("");
                                                                if (pdfInputRef.current) pdfInputRef.current.value = "";
                                                                if (txtInputRef.current) txtInputRef.current.value = "";
                                                            }}
                                                        >
                                                            <X size={14} strokeWidth={2.5}/>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: "16px", lineHeight: 1 }}>⊕</span>
                                                        <span className="font-medium text-[13px]">Add source material</span>
                                                        <span className="text-[#9898AA] font-medium text-[13px]">(optional)</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="absolute inset-0 backface-hidden transform-[rotateX(180deg)] flex items-center gap-2 justify-between">
                                            <button 
                                                onClick={() => pdfInputRef.current?.click()}
                                                className="flex-1 h-full rounded-xl border border-[#E2DFD8] bg-white flex items-center justify-center gap-1 text-[#4A4A68] hover:border-[#00897B] hover:text-[#00897B] transition-colors shadow-sm"
                                            >
                                                <FileText size={14} /> <span className="text-[13px] font-medium">PDF</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => txtInputRef.current?.click()}
                                                className="flex-1 h-full rounded-xl border border-[#E2DFD8] bg-white flex items-center justify-center gap-1 text-[#4A4A68] hover:border-[#00897B] hover:text-[#00897B] transition-colors shadow-sm"
                                            >
                                                <FileText size={14} /> <span className="text-[13px] font-medium">TXT</span>
                                            </button>

                                            <button 
                                                onClick={() => {
                                                    setUrlInput(sourceUrl)
                                                    setUrlError("")
                                                    setIsUrlModalOpen(true)
                                                }}
                                                className="flex-1 h-full rounded-xl border border-[#E2DFD8] bg-white flex items-center justify-center gap-1 text-[#4A4A68] hover:border-[#00897B] hover:text-[#00897B] transition-colors shadow-sm"
                                            >
                                                <BookOpen size={14} /> <span className="text-[13px] font-medium">URL</span>
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsAttachmentFlipped(false);
                                                }}
                                                className="w-[44px] shrink-0 h-full rounded-xl border border-[#E2DFD8] bg-[#F7F6F2] flex items-center justify-center text-[#9898AA] hover:text-[#EF4444] hover:bg-[#FEE2E2] hover:border-[#EF4444]/30 transition-colors shadow-sm"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        className="hidden" 
                                        ref={pdfInputRef} 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAttachedFile(file);
                                                setSourceUrl("");
                                                setIsAttachmentFlipped(false);
                                            }
                                        }}
                                    />
                                    <input 
                                        type="file" 
                                        accept=".txt" 
                                        className="hidden" 
                                        ref={txtInputRef} 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAttachedFile(file);
                                                setSourceUrl("");
                                                setIsAttachmentFlipped(false);
                                            }
                                        }}
                                    />
                                </div>

                                {status === "error" && (
                                    <span className="mx-auto text-sm animate-in fade-in" style={{ color: "#EF4444" }}>
                                        Something went wrong — want to try again?
                                    </span>
                                )}

                                <button
                                    onClick={handleStart}
                                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-white shadow-lg transition active:scale-[0.98]"
                                    style={{
                                        fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                        fontSize: "15px",
                                        fontWeight: 600,
                                        background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                                        letterSpacing: 0,
                                    }}
                                    onMouseEnter={e =>
                                    (e.currentTarget.style.background =
                                        "linear-gradient(135deg, #00695C 0%, #004D40 100%)")
                                    }
                                    onMouseLeave={e =>
                                    (e.currentTarget.style.background =
                                        "linear-gradient(135deg, #00897B 0%, #00695C 100%)")
                                    }
                                >
                                    Start Teaching →
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-px self-stretch" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.50)" }} />

                    <div className="relative z-20 flex flex-1 items-center justify-center p-6">
                        <div className="relative flex h-[280px] w-[280px] items-center justify-center">
                            <div className="flex flex-col items-center gap-1 text-center">
                                <span
                                    style={{
                                        fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        color: isDark ? "#E8E8FF" : "#9898AA",
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Socratic
                                </span>
                            </div>

                            <OrbitingCircles
                                radius={120}
                                duration={18}
                                iconSize={34}
                                path
                                pathColor={isDark ? "#FFFFFF" : "rgba(0,0,0,0.1)"}
                            >
                                <div
                                    className="flex items-center justify-center rounded-full shadow-sm"
                                    style={{
                                        width: 38,
                                        height: 38,
                                        background: isDark ? "rgba(0,137,123,0.25)" : "rgba(0,137,123,0.10)",
                                        color: "#00897B",
                                    }}
                                >
                                    <Brain size={18} strokeWidth={1.8} />
                                </div>
                                <div
                                    className="flex items-center justify-center rounded-full shadow-sm"
                                    style={{
                                        width: 38,
                                        height: 38,
                                        background: isDark ? "rgba(0,137,123,0.25)" : "rgba(0,137,123,0.10)",
                                        color: "#00897B",
                                    }}
                                >
                                    <BookOpen size={18} strokeWidth={1.8} />
                                </div>
                                <div
                                    className="flex items-center justify-center rounded-full shadow-sm"
                                    style={{
                                        width: 38,
                                        height: 38,
                                        background: isDark ? "rgba(0,137,123,0.25)" : "rgba(0,137,123,0.10)",
                                        color: "#00897B",
                                    }}
                                >
                                    <Sparkles size={18} strokeWidth={1.8} />
                                </div>
                            </OrbitingCircles>

                            <OrbitingCircles
                                radius={58}
                                duration={12}
                                reverse
                                iconSize={28}
                                path
                                pathColor={isDark ? "#FFFFFF" : "rgba(0,0,0,0.1)"}
                            >
                                <div
                                    className="flex items-center justify-center rounded-full shadow-sm"
                                    style={{
                                        width: 30,
                                        height: 30,
                                        background: isDark ? "rgba(88,73,232,0.25)" : "rgba(88,73,232,0.10)",
                                        color: "#5849E8",
                                    }}
                                >
                                    <Lightbulb size={14} strokeWidth={1.8} />
                                </div>
                                <div
                                    className="flex items-center justify-center rounded-full shadow-sm"
                                    style={{
                                        width: 30,
                                        height: 30,
                                        background: isDark ? "rgba(88,73,232,0.25)" : "rgba(88,73,232,0.10)",
                                        color: "#5849E8",
                                    }}
                                >
                                    <Pencil size={14} strokeWidth={1.8} />
                                </div>
                            </OrbitingCircles>
                        </div>
                    </div>
                </div>
            </div>

            {isUrlModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl border border-[#E2DFD8]">
                        <h3 className="text-[18px] font-semibold text-[#1A1A2E]">Add YouTube URL</h3>
                        <p className="mt-1 text-[13px] text-[#4A4A68]">
                            Paste a YouTube video URL. We will fetch transcript/text and use it as source material.
                        </p>

                        <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => {
                                setUrlInput(e.target.value)
                                if (urlError) setUrlError("")
                            }}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="mt-4 w-full rounded-xl border border-[#E2DFD8] bg-[#F0EEE9] px-4 py-3 text-[14px] text-[#1A1A2E] outline-none focus:border-[#00897B]"
                        />

                        {urlError && (
                            <p className="mt-2 text-[12px] text-[#EF4444]">{urlError}</p>
                        )}

                        <div className="mt-5 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsUrlModalOpen(false)
                                    setUrlError("")
                                }}
                                className="rounded-xl border border-[#E2DFD8] bg-white px-4 py-2 text-[13px] font-medium text-[#4A4A68] hover:bg-[#F7F6F2]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const candidate = urlInput.trim()
                                    if (!isValidYouTubeUrl(candidate)) {
                                        setUrlError("Please enter a valid YouTube video URL.")
                                        return
                                    }

                                    setSourceUrl(candidate)
                                    setAttachedFile(null)
                                    if (pdfInputRef.current) pdfInputRef.current.value = ""
                                    if (txtInputRef.current) txtInputRef.current.value = ""
                                    setIsAttachmentFlipped(false)
                                    setIsUrlModalOpen(false)
                                    setUrlError("")
                                }}
                                className="rounded-xl px-4 py-2 text-[13px] font-semibold text-white"
                                style={{ background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)" }}
                            >
                                Use URL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Onboard