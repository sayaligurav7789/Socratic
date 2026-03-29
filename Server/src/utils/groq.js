import Groq from "groq-sdk";

// Initialize the Groq client.
// It automatically uses the GROQ_API_KEY environment variable.
const groq = new Groq();

/**
 * Calls the Meta Llama 3.1 8B model (llama-3.1-8b-instant).
 * Fast and cheap. Good for quick evaluations (like checking if a misconception was caught).
 */
export async function call_llama_8b(messages, options = {}) {
    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: messages,
        ...options
    });
    
    return response;
}

/**
 * Calls the Meta Llama 3.3 70B model (llama-3.3-70b-versatile).
 * Powerful and intelligent. Good for the main Mia teaching conversation.
 * Has support for streaming.
 */
export async function call_llama_70b(messages, options = {}) {
    const response = await groq.chat.completions.create({
        // model: "llama-3.3-70b-versatile",
        model: "openai/gpt-oss-120b",
        messages: messages,
        ...options
    });
    
    return response;
}
