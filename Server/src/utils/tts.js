import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

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

export async function synthesizeMiaSpeech(text) {
    if (!text || !text.trim()) {
        return null;
    }

    const spokenText = `Read aloud in a childish student-like, warm, welcoming tone: ${text}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: spokenText }] }],
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Leda"
                    }
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

            return {
                mimeType: "audio/wav",
                data: wavBuffer.toString("base64")
            };
        }
    }

    return null;
}
