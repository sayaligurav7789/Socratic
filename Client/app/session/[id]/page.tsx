"use client"

import { DotPattern } from "@/components/ui/dot-pattern"
import { useParams } from "next/navigation"
import { Copy, ThumbsUp, Volume2, Paperclip, Sparkles, Mic, Send, Loader2, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import RadarChart from "@/components/RadarChart"
import { BACKEND_URL } from "@/lib/config"
import { User } from "lucide-react"
import Logo from "@/components/logo"
import { useLanguage } from "@/lib/i18n"


type BrowserSpeechRecognition = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart?: (() => void) | null;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type MiaVisualState = "neutral" | "curious" | "confused" | "satisfied" | "caught";
type DrawTool = "pen" | "eraser" | "rectangle" | "circle" | "line" | "triangle" | "text";

export default function SessionPage() {
    const [mounted, setMounted] = useState(false)
    const { t } = useLanguage()

    useEffect(() => {
        setMounted(true)
    }, [])

    const params = useParams()
    const { id } = params

    const [sessionData, setSessionData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const personaName = sessionData?.persona === "leo" ? "Leo" : "Mia"

    const [messages, setMessages] = useState<any[]>([])
    const [hasInput, setHasInput] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [speechSupported, setSpeechSupported] = useState(true)
    const [speechError, setSpeechError] = useState("")
    const [ttsProvider, setTtsProvider] = useState<"gemini" | "puter">("gemini")
    const [isPuterReady, setIsPuterReady] = useState(false)
    const { theme } = useTheme()
    const isDark = theme === "dark"
    const [miaVisualState, setMiaVisualState] = useState<MiaVisualState>("neutral")
    const [avatarVideoSrc, setAvatarVideoSrc] = useState("/normal.mp4")
    const [avatarOneShot, setAvatarOneShot] = useState(false)
    const [avatarPlaybackKey, setAvatarPlaybackKey] = useState(0)
    const [isSessionEnded, setIsSessionEnded] = useState(false)
    const [showEndModal, setShowEndModal] = useState(false)
    const [misconceptionAlert, setMisconceptionAlert] = useState<"triggered" | "caught" | "user_wrong" | null>(null)

    useEffect(() => {
        if (misconceptionAlert) {
            const timer = setTimeout(() => {
                setMisconceptionAlert(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [misconceptionAlert])

    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const composerInputRef = useRef<HTMLInputElement | null>(null)
    const composerValueRef = useRef("")
    const activeAudioRef = useRef<HTMLAudioElement | null>(null)
    const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null)
    const speechInputSeedRef = useRef("")
    const speechUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const speechAccumulatorRef = useRef({ final: "", interim: "" })
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const canvasContainerRef = useRef<HTMLDivElement | null>(null)
    const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null)
    const isDrawingRef = useRef(false)
    const lastPointRef = useRef<{ x: number; y: number } | null>(null)
    const shapeStartRef = useRef<{ x: number; y: number } | null>(null)
    const canvasSnapshotRef = useRef<ImageData | null>(null)
    const [drawTool, setDrawTool] = useState<DrawTool>("pen")
    const [brushColor, setBrushColor] = useState("#00897B")
    const [brushSize, setBrushSize] = useState(4)
    const [shapeText, setShapeText] = useState("")
    const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(true)
    const router = useRouter()

    const handleComposerPaste = async () => {
        if (!id) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/sessions/${id}/paste`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success && (data.data?.sessionCompleted || data.data?.pasteCount >= 3)) {
                setIsSessionEnded(true);
            }
        } catch (error) {
            console.error("Failed to record paste event:", error);
        }
    };

    const setComposerValue = (nextValue: string) => {
        composerValueRef.current = nextValue;

        if (composerInputRef.current && composerInputRef.current.value !== nextValue) {
            composerInputRef.current.value = nextValue;
        }

        const nextHasInput = nextValue.trim().length > 0;
        setHasInput((prev) => (prev === nextHasInput ? prev : nextHasInput));
    };

    const handleComposerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        composerValueRef.current = nextValue;

        const nextHasInput = nextValue.trim().length > 0;
        if (nextHasInput !== hasInput) {
            setHasInput(nextHasInput);
        }
    };

    // IMPROVED: Canvas setup that perfectly fills the container
    const setupCanvas = () => {
        const canvas = canvasRef.current;
        const container = canvasContainerRef.current;
        if (!canvas || !container) return;

        // Get precise container dimensions
        const containerRect = container.getBoundingClientRect();
        const width = Math.max(100, Math.floor(containerRect.width));
        const height = Math.max(100, Math.floor(containerRect.height));

        if (canvas.width === width && canvas.height === height) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Save existing drawing before resize
        const existingData = canvas.width > 0 && canvas.height > 0
            ? ctx.getImageData(0, 0, canvas.width, canvas.height)
            : null;

        // Set canvas dimensions to match container exactly
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Reset transform and set up drawing context
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Make canvas transparent instead of filling it, so background dots show
        // Do not use fillRect here.

        // Restore drawing over the new background
        if (existingData) {
            ctx.putImageData(existingData, 0, 0);
        }

        canvasCtxRef.current = ctx;
    };

    // Use ResizeObserver to handle container size changes dynamically
    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        // Initial setup
        setupCanvas();

        // Watch for container resize
        const resizeObserver = new ResizeObserver(() => {
            setupCanvas();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isCanvasCollapsed, isDark]);

    const getPointerPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (!mounted) return null

        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    };

    const drawShape = (
        ctx: CanvasRenderingContext2D,
        tool: DrawTool,
        start: { x: number; y: number },
        end: { x: number; y: number }
    ) => {
        const width = end.x - start.x;
        const height = end.y - start.y;

        ctx.save();
        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.lineWidth = brushSize;

        if (tool === "rectangle") {
            ctx.strokeRect(start.x, start.y, width, height);
        } else if (tool === "line") {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        } else if (tool === "circle") {
            const centerX = start.x + width / 2;
            const centerY = start.y + height / 2;
            const radiusX = Math.abs(width / 2);
            const radiusY = Math.abs(height / 2);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, Math.max(radiusX, 1), Math.max(radiusY, 1), 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tool === "triangle") {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const midX = (leftX + rightX) / 2;
            ctx.beginPath();
            ctx.moveTo(midX, topY);
            ctx.lineTo(leftX, bottomY);
            ctx.lineTo(rightX, bottomY);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    };

    const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const ctx = canvasCtxRef.current;
        const canvas = canvasRef.current;
        const point = getPointerPoint(event);
        if (!ctx || !canvas || !point) return;

        if (drawTool === "text") {
            const text = shapeText.trim();
            if (!text) {
                setSpeechError("Type text in the box before placing it on canvas.");
                return;
            }

            ctx.fillStyle = brushColor;
            ctx.font = `${Math.max(12, brushSize * 4)}px 'DM Sans', sans-serif`;
            ctx.textBaseline = "top";
            ctx.fillText(text, point.x, point.y);
            return;
        }

        setSpeechError("");

        if (drawTool !== "pen" && drawTool !== "eraser") {
            isDrawingRef.current = true;
            shapeStartRef.current = point;
            canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return;
        }

        isDrawingRef.current = true;
        lastPointRef.current = point;
        ctx.globalCompositeOperation = drawTool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = drawTool === "eraser" ? "rgba(0,0,0,1)" : brushColor;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    };

    const drawLine = (event: React.PointerEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const ctx = canvasCtxRef.current;
        const canvas = canvasRef.current;
        const point = getPointerPoint(event);
        if (!ctx || !canvas || !point || !isDrawingRef.current) return;

        if (drawTool !== "pen" && drawTool !== "eraser") {
            const start = shapeStartRef.current;
            const snapshot = canvasSnapshotRef.current;
            if (!start || !snapshot) return;

            ctx.putImageData(snapshot, 0, 0);
            drawShape(ctx, drawTool, start, point);
            return;
        }

        const prev = lastPointRef.current;
        if (!prev) {
            lastPointRef.current = point;
            return;
        }

        ctx.globalCompositeOperation = drawTool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = drawTool === "eraser" ? "rgba(0,0,0,1)" : brushColor;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastPointRef.current = point;
    };

    const stopDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
        const ctx = canvasCtxRef.current;
        const canvas = canvasRef.current;

        if (
            event &&
            ctx &&
            canvas &&
            isDrawingRef.current &&
            drawTool !== "pen" &&
            drawTool !== "eraser"
        ) {
            const start = shapeStartRef.current;
            const snapshot = canvasSnapshotRef.current;
            const end = getPointerPoint(event);
            if (start && snapshot && end) {
                ctx.putImageData(snapshot, 0, 0);
                drawShape(ctx, drawTool, start, end);
            }
        }

        isDrawingRef.current = false;
        lastPointRef.current = null;
        shapeStartRef.current = null;
        canvasSnapshotRef.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvasCtxRef.current;
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const speechCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setSpeechSupported(Boolean(speechCtor));
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const puter = (window as any).puter;
        if (puter?.ai?.txt2speech) {
            setIsPuterReady(true);
            return;
        }

        const scriptId = "puter-js-sdk";
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

        const onReady = () => {
            const readyPuter = (window as any).puter;
            setIsPuterReady(Boolean(readyPuter?.ai?.txt2speech));
        };

        if (existing) {
            existing.addEventListener("load", onReady, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://js.puter.com/v2/";
        script.async = true;
        script.onload = onReady;
        script.onerror = () => {
            setIsPuterReady(false);
            setSpeechError("Puter voice SDK could not load. Gemini voice is still available.");
            setTtsProvider("gemini");
        };
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        return () => {
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
            }
            if (speechRecognitionRef.current) {
                try {
                    speechRecognitionRef.current.stop();
                } catch (e) {
                    console.error("Cleanup error:", e);
                }
                speechRecognitionRef.current = null;
            }
            if (speechUpdateTimeoutRef.current) {
                clearTimeout(speechUpdateTimeoutRef.current);
                speechUpdateTimeoutRef.current = null;
            }
        };
    }, []);

    const startSpeechRecognition = () => {
        if (isStreaming || isRecording) return;

        const speechCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!speechCtor) {
            setSpeechSupported(false);
            setSpeechError("Speech recognition is not supported in this browser.");
            return;
        }

        if (speechRecognitionRef.current) {
            try {
                speechRecognitionRef.current.stop();
            } catch (e) {
                console.error("Error stopping previous recognition:", e);
            }
            speechRecognitionRef.current = null;
        }

        setSpeechError("");
        setIsRecording(true);
        const currentInput = composerValueRef.current.trim();
        speechInputSeedRef.current = currentInput ? `${currentInput} ` : "";
        speechAccumulatorRef.current = { final: "", interim: "" };

        try {
            const recognition: BrowserSpeechRecognition = new (speechCtor as SpeechRecognitionConstructor)();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onstart = () => {
                setSpeechError("");
            };

            recognition.onresult = (event: any) => {
                speechAccumulatorRef.current = { final: "", interim: "" };

                for (let i = event.resultIndex; i < event.results.length; i += 1) {
                    const transcript = event.results[i][0]?.transcript || "";
                    if (event.results[i].isFinal) {
                        speechAccumulatorRef.current.final += transcript;
                    } else {
                        speechAccumulatorRef.current.interim += transcript;
                    }
                }

                if (speechUpdateTimeoutRef.current) {
                    clearTimeout(speechUpdateTimeoutRef.current);
                }

                speechUpdateTimeoutRef.current = setTimeout(() => {
                    const { final, interim } = speechAccumulatorRef.current;
                    const combined = `${speechInputSeedRef.current}${final}${interim}`
                        .replace(/\s+/g, " ")
                        .trimStart();
                    setComposerValue(combined);
                    speechUpdateTimeoutRef.current = null;
                }, 100);
            };

            recognition.onerror = (event: any) => {
                const errorMsg = (() => {
                    switch (event?.error) {
                        case "not-allowed":
                        case "permission-denied":
                            return "Microphone permission denied. Please allow mic access.";
                        case "no-speech":
                            return "No speech detected. Speak clearly and try again.";
                        case "network":
                            return "Network error. Check your connection and try again.";
                        case "audio-capture":
                            return "No microphone found. Please check your audio input.";
                        default:
                            return "Speech recognition error. Please try again.";
                    }
                })();
                setSpeechError(errorMsg);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
                speechRecognitionRef.current = null;
                if (speechUpdateTimeoutRef.current) {
                    clearTimeout(speechUpdateTimeoutRef.current);
                    speechUpdateTimeoutRef.current = null;
                }
                setComposerValue(composerValueRef.current.trim());
            };

            speechRecognitionRef.current = recognition;
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Error starting recognition:", e);
                    setSpeechError("Failed to start speech recognition.");
                    setIsRecording(false);
                }
            }, 0);
        } catch (e) {
            console.error("Failed to create recognition:", e);
            setSpeechError("Speech recognition initialization failed.");
            setIsRecording(false);
        }
    };

    const stopSpeechRecognition = () => {
        if (!speechRecognitionRef.current) return;
        try {
            speechRecognitionRef.current.stop();
        } catch (e) {
            console.error("Error stopping recognition:", e);
        }
        setIsRecording(false);
        if (speechUpdateTimeoutRef.current) {
            clearTimeout(speechUpdateTimeoutRef.current);
            speechUpdateTimeoutRef.current = null;
        }
    };

    const toggleSpeechRecognition = () => {
        if (isRecording) {
            stopSpeechRecognition();
            return;
        }
        setTimeout(() => {
            startSpeechRecognition();
        }, 0);
    };

    const triggerAvatarClip = (state: MiaVisualState) => {
        if (state === "curious") {
            setAvatarVideoSrc("/curious.mp4");
            setAvatarOneShot(true);
            setAvatarPlaybackKey((k) => k + 1);
            return;
        }

        if (state === "confused") {
            setAvatarVideoSrc("/confused.mp4");
            setAvatarOneShot(true);
            setAvatarPlaybackKey((k) => k + 1);
            return;
        }

        setAvatarVideoSrc("/normal.mp4");
        setAvatarOneShot(false);
        setAvatarPlaybackKey((k) => k + 1);
    };

    useEffect(() => {
        if (!id) return;
        const fetchSession = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/sessions/${id}`);
                const data = await res.json();
                if (data.success) {
                    setSessionData(data.data);
                    if (data.data.status === 'completed') {
                        setIsSessionEnded(true);
                    }
                    if (data.data.messages && data.data.messages.length > 0) {
                        setMessages(data.data.messages.map((m: any) => ({
                            role: m.role,
                            content: m.clean_text || m.content,
                            drawingImage: m.drawing_image || null
                        })));
                    } else {
                        setMessages([{
                            role: "assistant",
                            content: `Hi! I'm ${data.data.persona === 'leo' ? 'Leo' : 'Mia'}. I'm ready to learn about this topic from you. Where should we start?`
                        }]);
                    }
                }
            } catch (err) {
                console.error("Error fetching session:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSession();
    }, [id]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const processChatTurn = async (userMsg: string, drawingImage?: string) => {
        if (!userMsg.trim() || isStreaming) return;

        setMiaVisualState("curious");
        triggerAvatarClip("curious");
        setMessages(prev => [...prev, { role: "user", content: userMsg, drawingImage: drawingImage || null }]);
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);
        setIsStreaming(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/sessions/${id}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, drawing_image: drawingImage || null })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";
            let sseBuffer = "";
            let terminalEventSeen = false;

            const finalizeAssistantMessage = (content: string) => {
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = content;
                    return newMsgs;
                });
            };

            const playGeminiAudio = async (audioBase64: string, audioMimeType: string) => {
                const audioSrc = `data:${audioMimeType};base64,${audioBase64}`;

                if (activeAudioRef.current) {
                    activeAudioRef.current.pause();
                    activeAudioRef.current = null;
                }

                const audio = new Audio(audioSrc);
                activeAudioRef.current = audio;

                await new Promise<void>((resolve) => {
                    let resolved = false;
                    const finish = () => {
                        if (resolved) return;
                        resolved = true;
                        resolve();
                    };

                    const timeoutId = setTimeout(finish, 800);
                    const onReady = () => {
                        clearTimeout(timeoutId);
                        finish();
                    };

                    audio.addEventListener("loadeddata", onReady, { once: true });
                    audio.addEventListener("canplay", onReady, { once: true });
                    audio.addEventListener("error", onReady, { once: true });
                });

                try {
                    await audio.play();
                    return true;
                } catch (error) {
                    console.warn("Gemini audio play failed:", error);
                    return false;
                }
            };

            const playPuterAudio = async (text: string) => {
                const puter = (window as any).puter;
                if (!puter?.ai?.txt2speech) {
                    setSpeechError("Puter voice is not ready yet.");
                    return false;
                }

                try {
                    const puterAudio = await puter.ai.txt2speech(text, {
                        language: "en-US",
                        engine: "generative"
                    });

                    if (!puterAudio || typeof puterAudio.play !== "function") {
                        return false;
                    }

                    await puterAudio.play();
                    return true;
                } catch (error) {
                    console.error("Puter audio failed:", error);
                    setSpeechError("Puter voice failed. Falling back to Gemini.");
                    return false;
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                sseBuffer += decoder.decode(value, { stream: true });
                const events = sseBuffer.split('\n\n');
                sseBuffer = events.pop() || "";

                for (const eventBlock of events) {
                    const dataLine = eventBlock
                        .split('\n')
                        .find((line) => line.startsWith('data: '));

                    if (!dataLine) continue;

                    try {
                        const data = JSON.parse(dataLine.slice(6));

                        if (data.error) {
                            terminalEventSeen = true;
                            finalizeAssistantMessage(accumulatedContent.trim() || "Sorry, I could not complete this reply.");
                            setSpeechError(data.error);
                            continue;
                        }

                        if (data.text) {
                            accumulatedContent += data.text;
                        }

                        if (!data.done) continue;
                        terminalEventSeen = true;

                        const displayContent = accumulatedContent.split('<metadata>')[0].trim();
                        if (data.session_complete) {
                            setIsSessionEnded(true);
                        }

                        const isTriggered = data.metadata?.misconception_triggered === true || data.metadata?.misconception_triggered === "true";
                        const isCaught = data.metadata?.misconception_caught === true || data.metadata?.misconception_caught === "true";

                        if (isTriggered) {
                            setMisconceptionAlert("triggered");
                        } else if (isCaught) {
                            setMisconceptionAlert("caught");
                        } else if (data.metadata?.quality === 0) {
                            setMisconceptionAlert("user_wrong");
                        }

                        const rawMiaState = data.metadata?.mia_state;
                        if (rawMiaState === "curious" || rawMiaState === "confused" || rawMiaState === "satisfied" || rawMiaState === "caught") {
                            setMiaVisualState(rawMiaState);
                            triggerAvatarClip(rawMiaState);
                        } else {
                            setMiaVisualState("neutral");
                            triggerAvatarClip("neutral");
                        }

                        let played = false;

                        if (ttsProvider === "puter") {
                            finalizeAssistantMessage(displayContent);
                            played = await playPuterAudio(displayContent);
                            if (!played && data.audio_base64 && data.audio_mime_type) {
                                played = await playGeminiAudio(data.audio_base64, data.audio_mime_type);
                            }
                        } else {
                            if (data.audio_base64 && data.audio_mime_type) {
                                played = await playGeminiAudio(data.audio_base64, data.audio_mime_type);
                            }
                            finalizeAssistantMessage(displayContent);
                        }

                        if (!played && ttsProvider === "gemini") {
                            setSpeechError("Gemini voice was unavailable for this message.");
                        }

                        setSessionData((prev: any) => {
                            if (!prev) return prev;
                            const newScores = { ...(prev.depthScores || {}) };
                            if (data.metadata?.concept_covered) {
                                const oldScore = newScores[data.metadata.concept_covered] || 0;
                                newScores[data.metadata.concept_covered] = Math.max(oldScore, data.metadata.depth_score || 0);
                            }
                            return { ...prev, depthScores: newScores };
                        });
                    } catch (e) {
                        console.error("Failed to parse SSE data:", e);
                    }
                }
            }

            if (!terminalEventSeen) {
                const displayContent = accumulatedContent.split('<metadata>')[0].trim();
                finalizeAssistantMessage(displayContent || "Connection dropped. Please send again.");
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMiaVisualState("confused");
            triggerAvatarClip("confused");
            setMessages((prev) => {
                const newMsgs = [...prev];
                if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === "assistant" && !newMsgs[newMsgs.length - 1].content) {
                    newMsgs[newMsgs.length - 1].content = "Sorry, something went wrong while contacting the server.";
                }
                return newMsgs;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    const sendMessage = async () => {
        const userMsg = composerValueRef.current.trim();
        if (!userMsg || isStreaming) return;

        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
            speechRecognitionRef.current = null;
            setIsRecording(false);
        }

        setComposerValue("");
        await processChatTurn(userMsg);
    };

    const sendDrawing = async () => {
        if (isStreaming) return;

        const userMsg = composerValueRef.current.trim();
        if (!userMsg) {
            setSpeechError("Type your message before sending the drawing.");
            return;
        }

        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
            speechRecognitionRef.current = null;
            setIsRecording(false);
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            setSpeechError("Canvas is not ready yet.");
            return;
        }

        const drawingImage = canvas.toDataURL("image/png");
        setComposerValue("");
        await processChatTurn(userMsg, drawingImage);
    };

    const handleEndSession = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/sessions/${id}/end`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/report/${id}`);
            }
        } catch (err) {
            console.error("Error ending session:", err);
        }
    };

    const simulateAnimation = () => {
        if (!sessionData || !sessionData.conceptTree) return;

        let currentScores = { ...(sessionData.depthScores || {}) };
        const concepts = sessionData.conceptTree.map((c: any) => c.id);

        concepts.forEach((conceptId: string) => {
            currentScores[conceptId] = 0;
        });

        setSessionData({ ...sessionData, depthScores: currentScores });

        const interval = setInterval(() => {
            const upgradable = concepts.filter((cid: string) => currentScores[cid] < 5);
            if (upgradable.length === 0) {
                clearInterval(interval);
                return;
            }

            const idToUpgrade = upgradable[Math.floor(Math.random() * upgradable.length)];
            currentScores[idToUpgrade] += 1;

            if (Math.random() > 0.5 && upgradable.length > 1) {
                const idToUpgrade2 = upgradable[Math.floor(Math.random() * upgradable.length)];
                currentScores[idToUpgrade2] = Math.min(5, currentScores[idToUpgrade2] + 1);
            }

            setSessionData({ ...sessionData, depthScores: { ...currentScores } });
        }, 1200);
    };

    /* ─── active tool helper ─── */
    const toolBtn = (tool: DrawTool, label: string) => {
        const isActive = drawTool === tool;
        const isEraser = tool === "eraser";
        const isText = tool === "text";
        return (
            <button
                type="button"
                onClick={() => setDrawTool(tool)}
                className={`px-3.5 py-[7px] rounded-xl text-[12px] font-semibold border transition-all duration-200 ${isActive
                    ? isEraser
                        ? "bg-amber-50 text-amber-700 border-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]"
                        : isText
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-[0_0_0_1px_rgba(88,73,232,0.15)]"
                            : "bg-teal-50 text-teal-700 border-teal-300 shadow-[0_0_0_1px_rgba(0,137,123,0.15)]"
                    : "bg-white/80 dark:bg-white/[0.04] text-[#5A5A78] dark:text-[#9898BB] border-[#E8E5DE] dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.08] hover:border-[#D0CCC4] dark:hover:border-white/20"
                    }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden pt-6 sm:pt-10"
            style={{
                fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
                background: isDark
                    ? "linear-gradient(145deg, #0B0B16 0%, #111125 50%, #0D0D18 100%)"
                    : "linear-gradient(145deg, #F8F6F1 0%, #F0EDE6 40%, #EBE8E0 100%)",
            }}
        >
            <Logo />
            {/* Ambient gradient orbs behind everything */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#00897B] opacity-[0.07] blur-[140px]" />
                <div className="absolute right-[-10%] top-[30%] h-[420px] w-[420px] rounded-full bg-[#5849E8] opacity-[0.06] blur-[130px]" />
                <div className="absolute bottom-[-5%] left-[40%] h-[350px] w-[350px] rounded-full bg-[#F59E0B] opacity-[0.04] blur-[120px]" />
            </div>

            {/* Background Pattern */}
            <DotPattern
                width={16}
                height={16}
                cx={1}
                cy={1}
                cr={1.5}
                className="absolute inset-0 z-0 opacity-30 text-[#C4C3CE] dark:opacity-10"
                glow={true}
            />

            {/* Session Content */}
            <div className="relative z-10 mx-auto flex h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)] w-full flex-col p-3 sm:p-6 lg:flex-row gap-4 sm:gap-5">

                {/* ═══════════════ Left Partition - Live Chat ═══════════════ */}
                <div
                    className={`${isCanvasCollapsed ? "lg:basis-[75%] lg:max-w-[75%]" : "lg:basis-[42%] lg:max-w-[42%]"} relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 flex flex-col min-h-0 transition-all duration-500 ease-out`}
                    style={{
                        background: isDark
                            ? "rgba(15, 15, 28, 0.80)"
                            : "rgba(255, 255, 255, 0.45)",
                        backdropFilter: "blur(40px) saturate(1.6)",
                        WebkitBackdropFilter: "blur(40px) saturate(1.6)",
                        border: isDark
                            ? "1px solid rgba(255,255,255,0.12)"
                            : "1px solid rgba(255,255,255,0.7)",
                        boxShadow: isDark
                            ? "0 8px 40px rgba(0,0,0,0.35), 0 0 30px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
                            : "0 8px 40px rgba(26,26,46,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                    }}
                >
                    {/* Aurora Orbs */}
                    <div className="absolute -left-28 -top-28 z-0 h-80 w-80 rounded-full bg-[#00897B] opacity-[0.12] blur-[100px] dark:opacity-[0.08]" />
                    <div className="absolute -right-28 -bottom-28 z-0 h-80 w-80 rounded-full bg-[#5849E8] opacity-[0.10] blur-[100px] dark:opacity-[0.06]" />
                    <div className="absolute left-1/2 top-1/3 z-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#F59E0B] opacity-[0.06] blur-[80px] dark:opacity-[0.03]" />

                    {/* Glass Noise Texture */}
                    <div
                        className="absolute inset-0 z-0 opacity-[0.18] pointer-events-none mix-blend-soft-light"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />

                    <div className="relative z-10 flex h-full w-full flex-col min-h-0">
                        {/* Session Header */}
                        <div className="flex items-center justify-between mb-5 sm:mb-6 px-1">
                            <div className="min-w-0 flex-1">
                                <h1 className="text-[18px] sm:text-[20px] font-bold text-[#1A1A2E] dark:text-[#EDEDFF] leading-tight flex items-center gap-2.5 tracking-tight">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00897B] to-[#00695C] shadow-md shadow-[#00897B]/20">
                                        <Sparkles className="text-white" size={16} />
                                    </span>
                                    <span className="truncate">{sessionData?.topic || "Loading Topic..."}</span>
                                </h1>
                                <p className="text-[12px] sm:text-[13px] text-[#7A7A98] dark:text-[#6868AA] mt-1 ml-[42px] font-medium">Teaching {personaName} everything you know</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCanvasCollapsed((prev) => !prev)}
                                    className="h-9 w-9 rounded-xl border border-[#E2DFD8] dark:border-white/10 bg-white/70 dark:bg-white/[0.05] text-[#5A5A78] dark:text-[#9898BB] hover:bg-white dark:hover:bg-white/10 hover:border-[#D0CCC4] dark:hover:border-white/20 transition-all duration-200 flex items-center justify-center shadow-sm"
                                    title={isCanvasCollapsed ? "Expand drawing panel" : "Collapse drawing panel"}
                                >
                                    {isCanvasCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                                </button>

                                {!isSessionEnded && (
                                    <button
                                        onClick={() => setShowEndModal(true)}
                                        className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-[#7A7A98] dark:text-[#9898BB] bg-white/60 dark:bg-white/[0.05] border border-red-400/20 dark:border-red-500/25 shadow-[0_0_10px_rgba(248,113,113,0.12)] dark:shadow-[0_0_14px_rgba(239,68,68,0.18)] hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-400/40 dark:hover:border-red-500/40 hover:text-red-500 transition-all duration-200"
                                    >
                                        {t("session.endSession")}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Misconception Alert */}
                        {misconceptionAlert && (
                            <div
                                className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300"
                                style={{
                                    background: misconceptionAlert === "triggered"
                                        ? (isDark ? "rgba(220, 38, 38, 0.15)" : "#FEF2F2")
                                        : misconceptionAlert === "user_wrong"
                                            ? (isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB")
                                            : (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5"),
                                    border: misconceptionAlert === "triggered"
                                        ? "1px solid rgba(239, 68, 68, 0.3)"
                                        : misconceptionAlert === "user_wrong"
                                            ? "1px solid rgba(245, 158, 11, 0.3)"
                                            : "1px solid rgba(16, 185, 129, 0.3)",
                                    backdropFilter: "blur(12px)",
                                }}
                            >
                                <div className="flex items-center justify-center h-8 w-8 rounded-full"
                                    style={{
                                        background: misconceptionAlert === "triggered"
                                            ? "#EF4444"
                                            : misconceptionAlert === "user_wrong"
                                                ? "#F59E0B"
                                                : "#10B981"
                                    }}
                                >
                                    {misconceptionAlert === "triggered" || misconceptionAlert === "user_wrong" ? (
                                        <AlertCircle size={16} className="text-white" />
                                    ) : (
                                        <Sparkles size={16} className="text-white" />
                                    )}
                                </div>
                                <span className={`text-[14px] font-semibold tracking-tight ${misconceptionAlert === "triggered" ? "text-red-600 dark:text-red-400" : misconceptionAlert === "user_wrong" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {misconceptionAlert === "triggered"
                                        ? `Misconception Detected! Can you correct ${personaName}?`
                                        : misconceptionAlert === "user_wrong"
                                            ? "Oops! Misconception Detected: That didn't seem quite right. Try explaining it differently."
                                            : "Misconception Caught! Great job!"}
                                </span>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto px-1 sm:px-2 space-y-5 sm:space-y-6 pb-6 w-full custom-scrollbar min-h-0"
                        >
                            {messages.map((msg, idx) => {
                                if (msg.role === "user") {
                                    return (
                                        <div key={idx} className="flex items-start justify-end gap-3 w-full">
                                            {/* Message */}
                                            <div
                                                className="rounded-[22px] rounded-br-[8px] px-5 py-3.5 text-[14.5px] text-white shadow-lg max-w-[75%] whitespace-pre-wrap leading-relaxed flex flex-col gap-2"
                                                style={{
                                                    background: "linear-gradient(135deg, #6C5CE7 0%, #5849E8 50%, #4A3DD0 100%)",
                                                    boxShadow: "0 4px 20px rgba(88,73,232,0.25)",
                                                }}
                                            >
                                                {msg.drawingImage && (
                                                    <div className="rounded-xl overflow-hidden border border-white/20 bg-[#F7F6F2] dark:bg-[#13131F] p-1">
                                                        <img src={msg.drawingImage} alt="User drawing" className="w-full h-auto rounded-lg" />
                                                    </div>
                                                )}
                                                <div>{msg.content}</div>
                                            </div>

                                            {/* 👤 USER ICON */}
                                            <div
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                                style={{
                                                    background: "linear-gradient(145deg, #EEF0FF 0%, #DDE1FF 50%, #C7CCFF 100%)",
                                                    boxShadow: "0 2px 12px rgba(88,73,232,0.2), inset 0 1px 2px rgba(255,255,255,0.6)",
                                                }}
                                            >
                                                <User size={16} className="text-[#5849E8]" />
                                            </div>

                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={idx} className="flex w-full items-start gap-3.5 animate-in slide-in-from-left-2 fade-in duration-300">
                                            {/* Avatar */}
                                            <div
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden"
                                                style={{
                                                    background: "linear-gradient(145deg, #E0F7F3 0%, #B2DFDB 50%, #80CBC4 100%)",
                                                    boxShadow: "0 2px 12px rgba(0,137,123,0.2), inset 0 1px 2px rgba(255,255,255,0.6)",
                                                }}
                                            >
                                                <Sparkles size={14} className="text-[#00695C]" />
                                            </div>

                                            <div className="flex flex-col items-start max-w-[80%]">
                                                <div
                                                    className="rounded-[22px] rounded-tl-[8px] px-5 py-3.5 text-[14.5px] text-[#1A1A2E] dark:text-[#E8E8FF] whitespace-pre-wrap leading-relaxed"
                                                    style={{
                                                        background: isDark
                                                            ? "rgba(30, 30, 53, 0.9)"
                                                            : "rgba(255, 255, 255, 0.85)",
                                                        backdropFilter: "blur(12px)",
                                                        boxShadow: isDark
                                                            ? "0 2px 12px rgba(0,0,0,0.2)"
                                                            : "0 2px 12px rgba(0,0,0,0.04)",
                                                        border: isDark
                                                            ? "1px solid rgba(255,255,255,0.06)"
                                                            : "1px solid rgba(255,255,255,0.9)",
                                                    }}
                                                >
                                                    {msg.content === "" ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="animate-spin text-[#00897B]" size={15} />
                                                            <span className="text-[13px] text-[#9898AA]">{t("session.thinking", { persona: "" }).replace("...", "").trim() || "Thinking"}...</span>
                                                        </div>
                                                    ) : (
                                                        msg.content
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </div>

                        {/* Input Area */}
                        {isSessionEnded ? (
                            <div className="mt-auto pt-4 pb-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div
                                    className="rounded-[1.75rem] p-6 sm:p-7 flex flex-col items-center text-center gap-4"
                                    style={{
                                        background: isDark
                                            ? "linear-gradient(135deg, rgba(0,137,123,0.12) 0%, rgba(0,105,92,0.08) 100%)"
                                            : "linear-gradient(135deg, #E8F8F4 0%, #D4F1EC 100%)",
                                        border: isDark
                                            ? "1px solid rgba(0,137,123,0.2)"
                                            : "1px solid rgba(0,137,123,0.25)",
                                    }}
                                >
                                    <div
                                        className="h-14 w-14 rounded-2xl flex items-center justify-center text-white"
                                        style={{
                                            background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                                            boxShadow: "0 6px 24px rgba(0,137,123,0.35)",
                                        }}
                                    >
                                        <ThumbsUp size={26} />
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-bold text-[#00695C] dark:text-[#4DB6AC]">Session Successfully Concluded!</h3>
                                        <p className="text-[14px] text-[#00695C]/70 dark:text-[#80CBC4]/70 mt-1.5 leading-relaxed">{personaName} has a much better understanding of {sessionData?.topic} now.</p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/report/${id}`)}
                                        className="w-full sm:w-auto px-10 py-3.5 rounded-2xl text-white font-bold shadow-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.97]"
                                        style={{
                                            background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                                            boxShadow: "0 6px 28px rgba(0,137,123,0.35)",
                                        }}
                                    >
                                        View Your Mastery Report →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-auto pt-4 relative flex items-end gap-3 w-full">

                                {/* The glass input capsule */}
                                <div
                                    className="flex-1 rounded-[1.5rem] px-5 sm:px-6 py-3.5 sm:py-4"
                                    style={{
                                        background: isDark
                                            ? "rgba(30, 30, 53, 0.85)"
                                            : "rgba(255, 255, 255, 0.82)",
                                        backdropFilter: "blur(20px)",
                                        WebkitBackdropFilter: "blur(20px)",
                                        border: isDark
                                            ? "1px solid rgba(255,255,255,0.08)"
                                            : "1.5px solid rgba(255,255,255,0.9)",
                                        boxShadow: isDark
                                            ? "0 4px 24px rgba(0,0,0,0.25)"
                                            : "0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                                    }}
                                >
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-[#8A8AA8] dark:text-[#6868AA] uppercase tracking-wider">{t("session.voice")}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSpeechError("");
                                                setTtsProvider("gemini");
                                            }}
                                            className={`rounded-full px-3 py-[5px] text-[11px] font-semibold border transition-all duration-200 ${ttsProvider === "gemini"
                                                ? "bg-teal-50 dark:bg-teal-500/10 text-[#00695C] dark:text-[#4DB6AC] border-teal-200 dark:border-teal-500/20 shadow-sm"
                                                : "bg-white/60 dark:bg-white/[0.04] text-[#8A8AA8] dark:text-[#7A7AAA] border-[#E8E5DE] dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.08]"}`}
                                        >
                                            Gemini
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isPuterReady) {
                                                    setSpeechError("Puter voice is still loading. Please wait a moment.");
                                                    return;
                                                }
                                                setSpeechError("");
                                                setTtsProvider("puter");
                                            }}
                                            className={`rounded-full px-3 py-[5px] text-[11px] font-semibold border transition-all duration-200 ${ttsProvider === "puter"
                                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-[#3D30C4] dark:text-[#A5A0FF] border-indigo-200 dark:border-indigo-500/20 shadow-sm"
                                                : "bg-white/60 dark:bg-white/[0.04] text-[#8A8AA8] dark:text-[#7A7AAA] border-[#E8E5DE] dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.08]"}`}
                                        >
                                            Puter {!isPuterReady ? "(loading)" : ""}
                                        </button>
                                    </div>
                                    {(isRecording || speechError) && (
                                        <div className="mb-2 text-[11px] leading-none">
                                            {isRecording ? (
                                                <span className="font-semibold text-[#00897B] flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full bg-[#00897B] animate-pulse" />
                                                    Recording... tap mic to stop
                                                </span>
                                            ) : (
                                                <span className="font-medium text-red-500 flex items-center gap-1.5">
                                                    <AlertCircle size={12} />
                                                    {speechError}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={composerInputRef}
                                        type="text"
                                        onChange={handleComposerChange}
                                        onPaste={handleComposerPaste}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') sendMessage()
                                        }}
                                        disabled={isStreaming}
                                        className="w-full border-none bg-transparent text-[15px] text-[#1A1A2E] dark:text-[#E8E8FF] placeholder-[#B0B0C8] dark:placeholder-[#4848AA] focus:ring-0 focus:outline-none disabled:opacity-40"
                                        placeholder={t("session.placeholder", { persona: sessionData?.persona === "leo" ? "Leo" : "Mia" })}
                                    />
                                </div>

                                {/* Circular Action Buttons */}
                                <div className="flex items-center gap-2.5 shrink-0 pb-1">
                                    <button
                                        onClick={toggleSpeechRecognition}
                                        disabled={!speechSupported || isStreaming}
                                        className={`flex h-12 w-12 items-center justify-center rounded-[1rem] border transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-40 ${isRecording
                                            ? "border-teal-300 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 text-[#00695C] dark:text-[#4DB6AC] shadow-teal-200/50 dark:shadow-teal-500/10"
                                            : "border-[#E8E5DE] dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[#7A7A98] dark:text-[#9898BB] hover:bg-white dark:hover:bg-white/[0.08] hover:border-[#D0CCC4] dark:hover:border-white/20"}`}
                                        title={isRecording ? "Stop recording" : "Start voice input"}
                                        style={{
                                            backdropFilter: "blur(12px)",
                                        }}
                                    >
                                        <Mic size={19} />
                                    </button>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!hasInput || isStreaming}
                                        className="flex h-12 w-12 items-center justify-center rounded-[1rem] text-white transition-all duration-200 hover:scale-[1.06] active:scale-[0.94] cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
                                        style={{
                                            background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                                            boxShadow: "0 4px 20px rgba(0,137,123,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                                        }}
                                    >
                                        <Send size={17} className="-ml-0.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════ Middle Partition - Drawing Canvas (PERFECT FIT) ═══════════════ */}
                {!isCanvasCollapsed && (
                    <div
                        className="lg:basis-[33%] lg:max-w-[33%] rounded-[2rem] p-4 sm:p-5 flex flex-col min-h-0 transition-all duration-500 ease-out animate-in slide-in-from-left-4 fade-in duration-300"
                        style={{
                            background: isDark
                                ? "rgba(15, 15, 28, 0.75)"
                                : "rgba(255, 255, 255, 0.55)",
                            backdropFilter: "blur(30px) saturate(1.4)",
                            WebkitBackdropFilter: "blur(30px) saturate(1.4)",
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.12)"
                                : "1px solid rgba(255,255,255,0.7)",
                            boxShadow: isDark
                                ? "0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
                                : "0 8px 32px rgba(26,26,46,0.05)",
                        }}
                    >
                        <div className="flex items-center justify-between mb-3.5 px-1">
                            <h2 className="text-[15px] font-bold text-[#1A1A2E] dark:text-[#EDEDFF] tracking-tight">Teach With Drawing</h2>
                            <span className="text-[11px] font-medium text-[#B0B0C8] dark:text-[#5050AA] uppercase tracking-wider">Canvas</span>
                        </div>

                        <div className="mb-3 flex items-center gap-1.5 flex-wrap">
                            {toolBtn("pen", "Pen")}
                            {toolBtn("eraser", "Eraser")}
                            {toolBtn("rectangle", "Rect")}
                            {toolBtn("circle", "Circle")}
                            {toolBtn("line", "Line")}
                            {toolBtn("triangle", "Tri")}
                            {toolBtn("text", "Text")}
                            <div className="ml-1 h-8 w-px bg-[#E8E5DE] dark:bg-white/10" />
                            <input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                className="h-8 w-9 rounded-lg border border-[#E8E5DE] dark:border-white/10 bg-white dark:bg-white/[0.04] p-0.5 cursor-pointer"
                                title="Brush color"
                            />
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#E8E5DE] dark:border-white/10 bg-white/80 dark:bg-white/[0.04]">
                                <span className="text-[11px] font-medium text-[#8A8AA8] dark:text-[#6868AA]">Size</span>
                                <input
                                    type="range"
                                    min={2}
                                    max={16}
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="w-16 accent-[#00897B]"
                                />
                            </div>
                            {drawTool === "text" && (
                                <input
                                    type="text"
                                    value={shapeText}
                                    onChange={(e) => setShapeText(e.target.value)}
                                    placeholder="Text to place"
                                    className="h-9 w-36 rounded-xl border border-[#E8E5DE] dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 text-[12px] text-[#1A1A2E] dark:text-[#E8E8FF] placeholder-[#B0B0C8] dark:placeholder-[#5050AA] focus:outline-none focus:ring-2 focus:ring-[#00897B]/25 transition"
                                />
                            )}
                        </div>

                        {/* Canvas Container - Fills available space */}
                        <div
                            ref={canvasContainerRef}
                            className="flex-1 rounded-2xl border-2 border-dashed border-[#D8D4CC] dark:border-white/10 bg-[#F7F6F2] dark:bg-[#13131F] relative overflow-hidden"
                            style={{
                                minHeight: "280px",
                                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.03)",
                            }}
                        >
                            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(circle, #D0CCC4 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full touch-none"
                                style={{ display: "block" }}
                                onPointerDown={startDrawing}
                                onPointerMove={drawLine}
                                onPointerUp={(e) => stopDrawing(e)}
                                onPointerLeave={stopDrawing}
                            />
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={clearCanvas}
                                className="px-4 py-2.5 rounded-xl border border-[#E8E5DE] dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-[12px] font-semibold text-[#7A7A98] dark:text-[#9898BB] hover:bg-white dark:hover:bg-white/[0.08] hover:border-[#D0CCC4] dark:hover:border-white/20 transition-all duration-200 shadow-sm"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={sendDrawing}
                                disabled={isStreaming}
                                className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40"
                                style={{
                                    background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)",
                                    boxShadow: "0 4px 16px rgba(0,137,123,0.3)",
                                }}
                            >
                                Send Drawing
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════ Right Partition ═══════════════ */}
                <div className="lg:basis-[25%] lg:max-w-[25%] flex flex-col gap-4 sm:gap-5">

                    {/* Avatar Video Area */}
                    <div
                        className="flex-[0.4] rounded-[2rem] p-0 flex flex-col items-center justify-center relative overflow-hidden"
                        style={{
                            background: "linear-gradient(145deg, #12122A 0%, #1A1A2E 50%, #151530 100%)",
                            border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.05)",
                            boxShadow: isDark
                                ? "0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
                                : "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                        }}
                    >
                        <video
                            key={`${avatarVideoSrc}-${avatarPlaybackKey}`}
                            autoPlay
                            loop={!avatarOneShot}
                            muted
                            playsInline
                            onEnded={() => {
                                if (!avatarOneShot) return;
                                setAvatarVideoSrc("/normal.mp4");
                                setAvatarOneShot(false);
                                setAvatarPlaybackKey((k) => k + 1);
                            }}
                            className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-95 pointer-events-none"
                            src={avatarVideoSrc}
                        />
                    </div>

                    {/* Concept Radar */}
                    <div
                        className="flex-[0.6] rounded-[2rem] p-4 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden"
                        style={{
                            background: isDark
                                ? "rgba(15, 15, 28, 0.75)"
                                : "rgba(255, 255, 255, 0.6)",
                            backdropFilter: "blur(30px) saturate(1.4)",
                            WebkitBackdropFilter: "blur(30px) saturate(1.4)",
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.12)"
                                : "1px solid rgba(255,255,255,0.7)",
                            boxShadow: isDark
                                ? "0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
                                : "0 8px 32px rgba(26,26,46,0.05)",
                        }}
                    >
                        {!isLoading && sessionData && sessionData.conceptTree ? (
                            <RadarChart
                                concepts={sessionData.conceptTree}
                                depthScores={sessionData.depthScores || {}}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full w-full text-[#B0B0C8] dark:text-[#6868AA]">
                                <Loader2 className="animate-spin text-[#00897B] mb-3" size={22} />
                                <p className="text-[13px] font-medium">Mapping Concepts...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dev Floating Button */}
            <button
                onClick={simulateAnimation}
                disabled={!sessionData || !sessionData.conceptTree}
                className="absolute bottom-6 right-6 z-50 rounded-2xl px-5 py-2.5 text-[11px] font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 uppercase tracking-wider"
                style={{
                    background: "linear-gradient(135deg, #6C5CE7 0%, #5849E8 100%)",
                    boxShadow: "0 4px 20px rgba(88,73,232,0.35)",
                }}
                title="Simulate AI Progression"
            >
                Simulate AI
            </button>

            {/* Confirmation Modal */}
            {showEndModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-md rounded-[2.25rem] p-8 sm:p-9 animate-in zoom-in-95 duration-300"
                        style={{
                            background: isDark
                                ? "rgba(20, 20, 38, 0.95)"
                                : "#FFFFFF",
                            boxShadow: isDark
                                ? "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)"
                                : "0 24px 80px rgba(26,26,46,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
                        }}
                    >
                        <div className="flex flex-col items-center text-center gap-5">
                            <div
                                className="h-16 w-16 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                                    boxShadow: "0 4px 16px rgba(245,158,11,0.2)",
                                }}
                            >
                                <AlertCircle size={30} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-[22px] font-bold text-[#1A1A2E] dark:text-[#EDEDFF] tracking-tight">End this session?</h2>
                                <p className="text-[15px] text-[#7A7A98] dark:text-[#9898BB] mt-2.5 leading-relaxed">
                                    You can end the session now to see your mastery report, or keep teaching {personaName} to cover more concepts.
                                </p>
                            </div>
                            <div className="flex flex-col w-full gap-2.5 mt-1">
                                <button
                                    onClick={handleEndSession}
                                    className="w-full py-4 rounded-2xl text-white font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                                    style={{
                                        background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                                        boxShadow: "0 6px 24px rgba(239,68,68,0.3)",
                                    }}
                                >
                                    {t("session.endSession")}
                                </button>
                                <button
                                    onClick={() => setShowEndModal(false)}
                                    className="w-full py-4 rounded-2xl font-bold text-[#7A7A98] dark:text-[#9898BB] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                                    style={{
                                        background: isDark
                                            ? "rgba(255,255,255,0.05)"
                                            : "#F8F6F1",
                                        border: isDark
                                            ? "1px solid rgba(255,255,255,0.08)"
                                            : "1px solid #E8E5DE",
                                    }}
                                >
                                    Continue Teaching
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}