import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

// Voice assignments per persona.
// To change Leo's voice, update voiceName below.
// Available Gemini voices: Aoede, Charon, Fenrir, Kore, Leda, Orus, Puck, Zephyr
const PERSONA_VOICES = {
    mia: {
        voiceName: "Leda",
        prompt: "Read aloud in a childish student-like, warm, welcoming tone: "
    },
    leo: {
        voiceName: "Puck",
        prompt: "Read aloud in a relaxed, casual, laid-back tone like a chill student just getting the gist: "
    }
};

function pcm16leToWavBuffer(pcmBuffer, { sampleRate = 24000, channels = 1, bitDepth = 16 } = {}) {
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize = pcmBuffer.length;
    const wavBuffer = Buffer.alloc(44 + dataSize);

    wavBuffer.write("RIFF", 0);
    wavBuffer.writeUInt32LE(36 + dataSize, 4);
    wavBuffer.write("WAVE", 8);

    wavBuffer.write("fmt ", 12);
    wavBuffer.writeUInt32LE(16, 16);
    wavBuffer.writeUInt16LE(1, 20);
    wavBuffer.writeUInt16LE(channels, 22);
    wavBuffer.writeUInt32LE(sampleRate, 24);
    wavBuffer.writeUInt32LE(byteRate, 28);
    wavBuffer.writeUInt16LE(blockAlign, 32);
    wavBuffer.writeUInt16LE(bitDepth, 34);

    wavBuffer.write("data", 36);
    wavBuffer.writeUInt32LE(dataSize, 40);
    pcmBuffer.copy(wavBuffer, 44);

    return wavBuffer;
}

export async function synthesizeSpeech(text, persona = "mia") {
    if (!text || !text.trim()) return null;

    const { voiceName, prompt } = PERSONA_VOICES[persona] || PERSONA_VOICES.mia;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `${prompt}${text}` }] }],
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName }
                }
            }
        }
    });

    const candidates = response.candidates || [];
    for (const candidate of candidates) {
        const parts = candidate?.content?.parts || [];
        for (const part of parts) {
            const audioData = part?.inlineData?.data;
            if (!audioData) continue;

            const pcmBuffer = Buffer.from(audioData, "base64");
            const wavBuffer = pcm16leToWavBuffer(pcmBuffer, {
                sampleRate: 24000,
                channels: 1,
                bitDepth: 16
            });

            return { mimeType: "audio/wav", data: wavBuffer.toString("base64") };
        }
    }

    return null;
}

// Backward-compatible alias
export const synthesizeMiaSpeech = (text) => synthesizeSpeech(text, "mia");
