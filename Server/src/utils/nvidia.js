export async function call_nvidia_llama(prompt) {
    const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "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";
    const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
            model: "meta/llama-3.1-70b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            top_p: 0.7,
            max_tokens: 1024,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}