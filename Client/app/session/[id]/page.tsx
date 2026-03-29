"use client"

import { DotPattern } from "@/components/ui/dot-pattern"
import { useParams } from "next/navigation"
import { Copy, ThumbsUp, Volume2, Paperclip, Sparkles, Mic, Send, Loader2, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import RadarChart from "@/components/RadarChart"
import { BACKEND_URL } from "@/lib/config"

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
    const params = useParams()
    const { id } = params

    const [sessionData, setSessionData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    const [messages, setMessages] = useState<any[]>([])
    const [hasInput, setHasInput] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [speechSupported, setSpeechSupported] = useState(true)
    const [speechError, setSpeechError] = useState("")
    const [ttsProvider, setTtsProvider] = useState<"gemini" | "puter">("gemini")
    const [isPuterReady, setIsPuterReady] = useState(false)
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"
    const [miaVisualState, setMiaVisualState] = useState<MiaVisualState>("neutral")
    const [avatarVideoSrc, setAvatarVideoSrc] = useState("/normal.mp4")
    const [avatarOneShot, setAvatarOneShot] = useState(false)
    const [avatarPlaybackKey, setAvatarPlaybackKey] = useState(0)
    const [isSessionEnded, setIsSessionEnded] = useState(false)
    const [showEndModal, setShowEndModal] = useState(false)
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
            await fetch(`${BACKEND_URL}/api/sessions/${id}/paste`, {
                method: 'POST'
            });
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

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        const container = canvasContainerRef.current;
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(200, Math.floor(container.clientWidth));
        const height = Math.max(220, Math.floor(container.clientHeight));

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = "#F7F6F2";
        ctx.fillRect(0, 0, width, height);
        canvasCtxRef.current = ctx;
    };

    const getPointerPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
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

        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.lineWidth = brushSize;

        if (tool === "rectangle") {
            ctx.strokeRect(start.x, start.y, width, height);
            return;
        }

        if (tool === "line") {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            return;
        }

        if (tool === "circle") {
            const centerX = start.x + width / 2;
            const centerY = start.y + height / 2;
            const radiusX = Math.abs(width / 2);
            const radiusY = Math.abs(height / 2);

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, Math.max(radiusX, 1), Math.max(radiusY, 1), 0, 0, Math.PI * 2);
            ctx.stroke();
            return;
        }

        if (tool === "triangle") {
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
    };

    const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
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
        ctx.strokeStyle = drawTool === "pen" ? brushColor : "#F7F6F2";
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    };

    const drawLine = (event: React.PointerEvent<HTMLCanvasElement>) => {
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

        ctx.strokeStyle = drawTool === "pen" ? brushColor : "#F7F6F2";
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
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = "#F7F6F2";
        ctx.fillRect(0, 0, rect.width, rect.height);
    };

    useEffect(() => {
        setupCanvas();
        const onResize = () => setupCanvas();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Re-initialise the canvas whenever the drawing panel is opened,
    // because the <canvas> element is conditionally rendered and doesn't
    // exist in the DOM while the panel is collapsed.
    useEffect(() => {
        if (!isCanvasCollapsed) {
            // Give React one frame to mount the canvas element before setup
            requestAnimationFrame(() => {
                setupCanvas();
            });
        }
    }, [isCanvasCollapsed]);

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
                    if (data.data.messages) {
                        setMessages(data.data.messages.map((m: any) => ({
                            role: m.role,
                            content: m.clean_text || m.content
                        })));
                    } else {
                        setMessages([{
                            role: "assistant",
                            content: "Hi! I'm Mia. I'm ready to learn about this topic from you. Where should we start?"
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

    // Developer function to artificially animate the depth scores
    // so judges/users can see the smooth polygon and glowing dot transitions
    const simulateAnimation = () => {
        if (!sessionData || !sessionData.conceptTree) return;

        let currentScores = { ...(sessionData.depthScores || {}) };
        const concepts = sessionData.conceptTree.map((c: any) => c.id);

        // Ensure starting at 0
        concepts.forEach((conceptId: string) => {
            currentScores[conceptId] = 0;
        });

        setSessionData({ ...sessionData, depthScores: currentScores });

        const interval = setInterval(() => {
            // Pick a random concept that isn't mastered yet
            const upgradable = concepts.filter((cid: string) => currentScores[cid] < 5);
            if (upgradable.length === 0) {
                clearInterval(interval);
                return;
            }

            // Upgrade one
            const idToUpgrade = upgradable[Math.floor(Math.random() * upgradable.length)];
            currentScores[idToUpgrade] += 1;

            // Periodically upgrade a second one for more dynamic visual movement
            if (Math.random() > 0.5 && upgradable.length > 1) {
                const idToUpgrade2 = upgradable[Math.floor(Math.random() * upgradable.length)];
                currentScores[idToUpgrade2] = Math.min(5, currentScores[idToUpgrade2] + 1);
            }

            // Push State -> Triggers D3 UseEffect Transition
            setSessionData({ ...sessionData, depthScores: { ...currentScores } });
        }, 1200); // Trigger a transition every 1.2s
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#F5F3EE] dark:bg-[#0D0D18] pt-10" style={{ fontFamily: "var(--font-ui, 'DM Sans', sans-serif)" }}>
            {/* Background Pattern */}
            <DotPattern
                width={16}
                height={16}
                cx={1}
                cy={1}
                cr={1.5}
                className="absolute inset-0 z-0 opacity-50 text-[#C4C3CE]"
                glow={true}
            />

            {/* Session Content */}
            <div className="relative z-10 mx-auto flex h-[calc(100vh-80px)] w-full flex-col p-6 lg:flex-row gap-6">

                {/* Left Partition - Live Chat */}
                <div className={`${isCanvasCollapsed ? "lg:basis-[75%] lg:max-w-[75%]" : "lg:basis-[42%] lg:max-w-[42%]"} relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-[#0F0F1C]/85 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(26,26,46,0.04)] border border-white/60 dark:border-white/[0.07] p-6 flex flex-col min-h-0 transition-all duration-300`}>

                    {/* Aurora Orbs (Colorful Gradient) */}
                    <div className="absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-[#00897B] opacity-20 blur-[100px]" />
                    <div className="absolute -right-32 -bottom-32 z-0 h-96 w-96 rounded-full bg-[#5849E8] opacity-20 blur-[100px]" />
                    <div className="absolute left-1/2 top-1/2 z-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F59E0B] opacity-10 blur-[80px]" />

                    {/* Glass Noise Texture */}
                    <div
                        className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none mix-blend-soft-light"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />

                    <div className="relative z-10 flex h-full w-full flex-col min-h-0 pt-2">
                        {/* Session Header */}
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div>
                                <h1 className="text-[20px] font-semibold text-[#1A1A2E] dark:text-[#E8E8FF] leading-tight flex items-center gap-2">
                                    <Sparkles className="text-[#00897B]" size={20} />
                                    {sessionData?.topic || "Loading Topic..."}
                                </h1>
                                <p className="text-[13px] text-[#4A4A68] dark:text-[#8080AA] mt-0.5">Teaching Mia everything you know</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCanvasCollapsed((prev) => !prev)}
                                    className="h-9 w-9 rounded-lg border border-[#E2DFD8] dark:border-white/10 bg-white/70 dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] hover:bg-[#F7F6F2] dark:hover:bg-white/10 transition flex items-center justify-center"
                                    title={isCanvasCollapsed ? "Expand drawing panel" : "Collapse drawing panel"}
                                >
                                    {isCanvasCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                                </button>

                                {!isSessionEnded && (
                                    <button
                                        onClick={() => setShowEndModal(true)}
                                        className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#4A4A68] dark:text-[#9898BB] bg-white/50 dark:bg-white/[0.06] border border-[#E2DFD8] dark:border-white/10 hover:bg-[#EF4444]/10 hover:border-[#EF4444]/30 hover:text-[#EF4444] transition-all"
                                    >
                                        End Session
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto px-2 space-y-6 pb-6 w-full custom-scrollbar min-h-0"
                        >

                            {messages.map((msg, idx) => {
                                if (msg.role === "user") {
                                    return (
                                        <div key={idx} className="flex flex-col items-end w-full">
                                            <div className="rounded-[24px] rounded-br-[8px] bg-[#5849E8] px-5 py-3 text-[15px] text-white shadow-sm max-w-[80%] whitespace-pre-wrap">
                                                {msg.content}
                                                {msg.drawingImage && (
                                                    <img
                                                        src={msg.drawingImage}
                                                        alt="Drawing sent"
                                                        className="mt-3 rounded-xl border border-white/20 max-h-36 w-full object-contain bg-white/10"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={idx} className="flex w-full items-start gap-4">
                                            {/* Shiny Orb Avatar (Curious State) */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00897B] bg-[#E8F8F4] overflow-hidden shadow-[inset_0_2px_10px_rgba(0,137,123,0.2)]">
                                                <div className="h-full w-full bg-linear-to-br from-[#E8F8F4] via-white to-[#B2DFDB] opacity-80" />
                                            </div>

                                            <div className="flex flex-col items-start max-w-[80%]">
                                                <div className="rounded-[24px] rounded-tl-[8px] bg-white dark:bg-[#1E1E35] px-5 py-3.5 text-[15px] text-[#1A1A2E] dark:text-[#E8E8FF] shadow-sm whitespace-pre-wrap">
                                                    {msg.content === "" ? (
                                                        <Loader2 className="animate-spin text-[#00897B]" size={16} />
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
                                <div className="rounded-3xl bg-[#E8F8F4] border border-[#00897B]/30 p-6 flex flex-col items-center text-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-[#00897B] flex items-center justify-center text-white shadow-lg">
                                        <ThumbsUp size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-bold text-[#00695C]">Session Successfully Concluded!</h3>
                                        <p className="text-[14px] text-[#00695C]/80 mt-1">Mia has a much better understanding of {sessionData?.topic} now.</p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/report/${id}`)}
                                        className="w-full sm:w-auto px-10 py-3.5 rounded-2xl text-white font-bold shadow-xl transition hover:scale-105 active:scale-95"
                                        style={{ background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)" }}
                                    >
                                        View Your Mastery Report →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-auto pt-4 relative flex items-center gap-3 w-full">

                                {/* The glass input capsule */}
                                <div className="flex-1 rounded-full bg-white/80 dark:bg-[#1E1E35]/90 backdrop-blur-md border border-white dark:border-white/10 px-6 py-3.5 shadow-sm">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="text-[11px] text-[#4A4A68] dark:text-[#8080AA]">Voice:</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSpeechError("");
                                                setTtsProvider("gemini");
                                            }}
                                            className={`rounded-full px-3 py-1 text-[11px] font-medium border transition ${ttsProvider === "gemini"
                                                ? "bg-[#E8F8F4] text-[#00695C] border-[#00897B]/40"
                                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
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
                                            className={`rounded-full px-3 py-1 text-[11px] font-medium border transition ${ttsProvider === "puter"
                                                ? "bg-[#EEF0FF] text-[#3D30C4] border-[#5849E8]/40"
                                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                                        >
                                            Puter {!isPuterReady ? "(loading)" : ""}
                                        </button>
                                    </div>
                                    {(isRecording || speechError) && (
                                        <div className="mb-1 text-[11px] leading-none">
                                            {isRecording ? (
                                                <span className="font-medium text-[#00897B]">Recording... tap mic again to stop.</span>
                                            ) : (
                                                <span className="font-medium text-[#EF4444]">{speechError}</span>
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
                                        className="w-full border-none bg-transparent text-[15px] text-[#1A1A2E] dark:text-[#E8E8FF] placeholder-[#9898AA] dark:placeholder-[#5050AA] focus:ring-0 focus:outline-none disabled:opacity-50"
                                        placeholder="Ask me anything..."
                                    />
                                </div>

                                {/* Circular Action Buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={toggleSpeechRecognition}
                                        disabled={!speechSupported || isStreaming}
                                        className={`flex h-[50px] w-[50px] items-center justify-center rounded-full border backdrop-blur-md transition-colors shadow-sm cursor-pointer disabled:opacity-50 ${isRecording
                                            ? "border-[#00897B] bg-[#E8F8F4] text-[#00695C]"
                                            : "border-[#E2DFD8] dark:border-white/10 bg-white/80 dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] hover:bg-white dark:hover:bg-white/10"}`}
                                        title={isRecording ? "Stop recording" : "Start voice input"}
                                    >
                                        <Mic size={20} />
                                    </button>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!hasInput || isStreaming}
                                        className="flex h-[50px] w-[50px] items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-[1.05] active:scale-[0.95] cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                                        style={{ background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)" }}
                                    >
                                        <Send size={18} className="-ml-0.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Middle Partition - Drawing Canvas Placeholder */}
                {!isCanvasCollapsed && (
                <div className="lg:basis-[33%] lg:max-w-[33%] rounded-3xl bg-white/65 dark:bg-[#0F0F1C]/80 backdrop-blur-md shadow-sm border border-[#E2DFD8] dark:border-white/[0.08] p-4 flex flex-col min-h-0 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-[15px] font-semibold text-[#1A1A2E] dark:text-[#E8E8FF]">Teach With Drawing</h2>
                        <span className="text-[11px] text-[#9898AA] dark:text-[#5050AA]">Canvas</span>
                    </div>

                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setDrawTool("pen")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition ${drawTool === "pen"
                                ? "bg-[#E8F8F4] text-[#00695C] border-[#00897B]/40"
                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                        >
                            Pen
                        </button>
                        <button
                            type="button"
                            onClick={() => setDrawTool("eraser")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition ${drawTool === "eraser"
                                ? "bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]/50"
                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                        >
                            Eraser
                        </button>
                        <button
                            type="button"
                            onClick={() => setDrawTool("rectangle")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition ${drawTool === "rectangle"
                                ? "bg-[#E8F8F4] text-[#00695C] border-[#00897B]/40"
                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                        >
                            Rectangle
                        </button>
                        <button
                            type="button"
                            onClick={() => setDrawTool("circle")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition ${drawTool === "circle"
                                ? "bg-[#E8F8F4] text-[#00695C] border-[#00897B]/40"
                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                        >
                            Circle
                        </button>
                        <button
                            type="button"
                            onClick={() => setDrawTool("line")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition ${drawTool === "line"
                                ? "bg-[#E8F8F4] text-[#00695C] border-[#00897B]/40"
                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                        >
                            Line
                        </button>
                        <button
                            type="button"
                            onClick={() => setDrawTool("triangle")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition ${drawTool === "triangle"
                                ? "bg-[#E8F8F4] text-[#00695C] border-[#00897B]/40"
                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                        >
                            Triangle
                        </button>
                        <button
                            type="button"
                            onClick={() => setDrawTool("text")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition ${drawTool === "text"
                                ? "bg-[#EEF0FF] text-[#3D30C4] border-[#5849E8]/40"
                                : "bg-white dark:bg-white/[0.05] text-[#4A4A68] dark:text-[#9898BB] border-[#E2DFD8] dark:border-white/10"}`}
                        >
                            Text
                        </button>
                        <input
                            type="color"
                            value={brushColor}
                            onChange={(e) => setBrushColor(e.target.value)}
                            className="h-8 w-9 rounded border border-[#E2DFD8] bg-white p-0"
                            title="Brush color"
                        />
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-[#E2DFD8] dark:border-white/10 bg-white dark:bg-white/[0.05]">
                            <span className="text-[11px] text-[#4A4A68] dark:text-[#8080AA]">Size</span>
                            <input
                                type="range"
                                min={2}
                                max={16}
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-20"
                            />
                        </div>
                        {drawTool === "text" && (
                            <input
                                type="text"
                                value={shapeText}
                                onChange={(e) => setShapeText(e.target.value)}
                                placeholder="Text to place"
                                className="h-9 w-40 rounded-lg border border-[#E2DFD8] bg-white px-3 text-[12px] text-[#1A1A2E] placeholder-[#9898AA] focus:outline-none focus:ring-2 focus:ring-[#00897B]/30"
                            />
                        )}
                    </div>

                    <div ref={canvasContainerRef} className="flex-1 rounded-2xl border border-dashed border-[#C8C5BC] dark:border-white/15 bg-[#F7F6F2] dark:bg-[#13131F] relative overflow-hidden min-h-[260px] lg:min-h-0">
                        <div className="absolute inset-0 pointer-events-none opacity-25" style={{ backgroundImage: "radial-gradient(circle, #D8D4CC 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full touch-none"
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
                            className="px-3 py-2 rounded-xl border border-[#E2DFD8] dark:border-white/10 bg-white dark:bg-white/[0.05] text-[12px] font-medium text-[#4A4A68] dark:text-[#9898BB] hover:bg-[#F7F6F2] dark:hover:bg-white/10 transition"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={sendDrawing}
                            disabled={isStreaming}
                            className="px-3 py-2 rounded-xl text-[12px] font-medium text-white"
                            style={{ background: "linear-gradient(135deg, #00897B 0%, #00695C 100%)" }}
                        >
                            Send Drawing
                        </button>
                    </div>
                </div>
                )}

                {/* Right Partition */}
                <div className="lg:basis-[25%] lg:max-w-[25%] flex flex-col gap-4">

                    {/* Right Top Section - Avatar Video Area */}
                    <div className="flex-[0.4] rounded-3xl bg-[#1A1A2E] shadow-lg border border-[#E2DFD8]/20 p-0 flex flex-col items-center justify-center relative overflow-hidden">

                        {/* 
                          PRO-TIP: To make the black background of your avatar completely transparent:
                          Apply the 'mix-blend-screen' CSS class to the video element.
                          Because the lights are cyan, they look best against this deep dark container (#1A1A2E) 
                          rather than the super bright page background!
                        */}
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

                    {/* Right Bottom Section - Concept Radar */}
                    <div className="flex-[0.6] rounded-3xl bg-white/70 backdrop-blur-md shadow-sm border border-[#E2DFD8] p-4 flex flex-col items-center justify-center relative overflow-hidden">
                        {!isLoading && sessionData && sessionData.conceptTree ? (
                            <RadarChart
                                concepts={sessionData.conceptTree}
                                depthScores={sessionData.depthScores || {}}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full w-full text-[#9898AA]">
                                <Loader2 className="animate-spin text-[#00897B] mb-2" size={24} />
                                <p className="text-sm">Mapping Concepts...</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Dev Floating Button */}
            <button
                onClick={simulateAnimation}
                disabled={!sessionData || !sessionData.conceptTree}
                className="absolute bottom-6 right-6 z-50 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: "#5849E8" }}
                title="Simulate AI Progression"
            >
                Simulate AI
            </button>

            {/* Confirmation Modal */}
            {showEndModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl border border-[#E2DFD8] animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-16 w-16 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#F59E0B]">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h2 className="text-[22px] font-bold text-[#1A1A2E]">End this session?</h2>
                                <p className="text-[15px] text-[#4A4A68] mt-2">
                                    You can end the session now to see your mastery report, or keep teaching Mia to cover more concepts.
                                </p>
                            </div>
                            <div className="flex flex-col w-full gap-3 mt-2">
                                <button
                                    onClick={handleEndSession}
                                    className="w-full py-4 rounded-2xl bg-[#EF4444] text-white font-bold shadow-lg hover:bg-red-600 transition active:scale-[0.98]"
                                >
                                    Yes, End Session
                                </button>
                                <button
                                    onClick={() => setShowEndModal(false)}
                                    className="w-full py-4 rounded-2xl bg-white border border-[#E2DFD8] text-[#4A4A68] font-bold hover:bg-[#F7F6F2] transition active:scale-[0.98]"
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
