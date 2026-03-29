import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function call_flash(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text;
}

async function describe_drawing_from_data_url(dataUrl, topic = "") {
    if (!dataUrl || typeof dataUrl !== "string") return null;

    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) return null;

    const mimeType = match[1] || "image/png";
    const imageBase64 = match[2];
    if (!imageBase64) return null;

    const prompt = `You are helping summarize a teacher's whiteboard drawing for a learning chat.${topic ? ` Topic: ${topic}.` : ""}
Describe what the sketch likely represents in 4-6 concise bullet points.
If uncertain, state assumptions clearly.
Focus on educationally useful cues (labels, arrows, relationships, flow, geometry).
Do not hallucinate text not visible in image.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType,
                            data: imageBase64,
                        },
                    },
                ],
            },
        ],
    });

    return response.text?.trim() || null;
}

export { call_flash, describe_drawing_from_data_url };
