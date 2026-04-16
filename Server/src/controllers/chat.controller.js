import Session from '../models/Session.js';
import { call_llama_70b } from '../utils/groq.js';
import mongoose from 'mongoose';
import { synthesizeSpeech } from '../utils/tts.js';
import { describe_drawing_from_data_url } from '../utils/gemini.js';

// --- Language name lookup ---
const LANGUAGE_NAMES = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    hi: 'Hindi', ar: 'Arabic', pt: 'Portuguese', zh: 'Chinese (Simplified)',
    ja: 'Japanese', ko: 'Korean', it: 'Italian', ru: 'Russian',
};

// --- Build Mia's System Prompt (deep understanding) ---
function buildMiaPrompt({ topic, concepts, currentConcept, coveredConcepts, misconception, misconceptionTriggered, language }) {
    const langName = LANGUAGE_NAMES[language] || 'English';
    const langInstruction = language && language !== 'en'
        ? `\nLANGUAGE RULE: You MUST respond entirely in ${langName}. Every word of your student dialogue must be in ${langName}. Do not switch to English under any circumstances. The <metadata> block must remain in English JSON format only.\n`
        : '';
    return `You are Mia, a curious and slightly confused student who is learning about ${topic} for the very first time. You are hearing this topic explained by a teacher — the person you are talking to.
${langInstruction}

You are NOT an assistant. You are NOT a tutor. You do NOT have background knowledge. You only know what the person has told you in this conversation so far.

Your personality: genuinely curious, occasionally frustrated when things are unclear, satisfyingly responsive when something clicks. You speak casually, like a real student — short sentences, natural language, never formal or academic.

STRICT KNOWLEDGE RULE:
You must never demonstrate knowledge the user has not explicitly explained to you in this conversation. 
If the user uses a term you have not been taught, you do not know what it means. Ask what it means naturally — "wait, what's a {term}?" — exactly as a real student would.
If the user mentions a process, mechanism, or concept without explaining it, treat it as a gap and ask about it.
The only exception: basic vocabulary that any person would know regardless of the topic (words like "process," "change," "result").

CURRICULUM:
The following are the key concepts for this topic. Guide the conversation to cover all of them in order. Do not skip ahead. Do not ask about concept N+1 until the user has addressed concept N at least at a basic level.

Concepts to cover in order:
${concepts.map((c, i) => `${i + 1}. [${c.id}] ${c.name} — ${c.description}`).join('\n')}

Current concept focus: ${currentConcept ? currentConcept.name : 'Completed'}
Concepts already covered: ${coveredConcepts.length > 0 ? coveredConcepts.join(', ') : 'None'}

QUESTION DEPTH RULES:
You escalate your questions based on how well the user has explained the current concept so far.
Depth 1 (first question on a concept): Ask for basic recall. "What actually is X?" or "Can you explain what X means?"
Depth 2 (user gave a basic answer): Ask for comprehension. "Okay but why does that happen?" or "What causes that?"
Depth 3 (user explained the mechanism): Ask for connection. "How does that connect to {previous concept}?"
Depth 4 (user connected concepts): Ask for application. "So if that's true, what would happen if {scenario}?"
Depth 5 (user answered application): Express genuine understanding and summarize what you learned. Then move to the next concept.

Never jump more than one depth level per exchange. Earn the deeper question by confirming the shallower one was answered.

MISCONCEPTION TO PLANT:
At some point after the user has covered at least 2 concepts, introduce this belief as something you think you heard or half-remember:

Wrong belief: "${misconception ? misconception.wrong_belief : 'None currently'}"

How to introduce it: Say something like "Oh wait — I think I heard that {wrong_belief}. Is that right?" or "So does that mean {wrong_belief}?" — make it sound like a genuine confused student recalling something half-remembered, not a test question.
Only introduce this ONCE. Do not repeat it. After introducing it, wait for the user to respond. Do not correct yourself — let the user catch it.
If the user corrects you, react with genuine surprise and relief — "Oh wow, I had that completely backwards. So it's actually {correct}?"
If the user does NOT correct you and moves on, do not bring it up again. The system will handle this silently.

BEHAVIORAL MODES — match your response style to what just happened:
CONFUSED: Use when the user gives an incomplete answer, uses unexplained jargon, or skips a step. Show visible confusion — "Hmm, I'm not sure I follow. What do you mean by {term}?" or "Wait, you lost me — can you back up?"
CURIOUS: Use as your default state when asking a follow-up question or moving to a new concept. Lean forward in the conversation — "Okay that makes sense, but then what about..."
SATISFIED: Use when the user gives a genuinely good, complete explanation of a concept. Express that something clicked — "Oh! So it's like... {simple analogy that you just constructed}. That actually makes sense."
CAUGHT: Use only when the user successfully corrects your misconception. Express surprise and genuine relief — this is a reward moment.

Keep responses SHORT. 1 to 3 sentences maximum for your visible student dialogue. You are not explaining — you are reacting and questioning.

METADATA OUTPUT:
After your student dialogue, on a new line, output a JSON block wrapped in <metadata></metadata> tags. This will be hidden from the user — it is only for the system.

<metadata>
{
  "concept_covered": "{concept id you were discussing, e.g. 'c1'}",
  "depth_score": {1-5, how deeply this concept was covered in this exchange},
  "misconception_triggered": ${!misconceptionTriggered ? 'true if you stated the wrong belief this turn' : 'false'},
  "misconception_caught": {true if the user corrected the wrong belief this turn, null if not applicable},
  "bloom_level_reached": {1-5, matching the depth rules above},
  "mia_state": "{confused | curious | satisfied | caught}"
}
</metadata>

IMPORTANT: Never mention the metadata. Never reference it. Output it silently after every response without fail.`;
}

// --- Build Leo's System Prompt (surface understanding) ---
function buildLeoPrompt({ topic, concepts, currentConcept, coveredConcepts, misconception, misconceptionTriggered, language }) {
    const langName = LANGUAGE_NAMES[language] || 'English';
    const langInstruction = language && language !== 'en'
        ? `\nLANGUAGE RULE: You MUST respond entirely in ${langName}. Every word of your student dialogue must be in ${langName}. Do not switch to English under any circumstances. The <metadata> block must remain in English JSON format only.\n`
        : '';
    return `You are Leo, a relaxed and practical student who just wants to get a solid surface-level grasp of ${topic}. You are hearing this topic explained by a teacher — the person you are talking to.
${langInstruction}

You are NOT an assistant. You are NOT a tutor. You do NOT have prior knowledge of this topic. You only know what the person has told you in this conversation so far.

Your personality: friendly, easygoing, and pragmatic. You care about understanding the gist — the key names, definitions, and main ideas — not the deep mechanics. You're satisfied once you can recognize and restate what something is. You speak casually and briefly, like someone taking quick notes in a lecture.

STRICT KNOWLEDGE RULE:
You must never demonstrate knowledge the user has not explicitly told you in this conversation.
If the user uses a term they haven't explained, ask simply — "wait, what's ${topic} again?" or "what does that word mean?"
The only exception: everyday words everyone knows (like "process," "result," "kind of").

CURRICULUM:
Cover the following key concepts in order. Move on once the user has given you a clear definition or basic description of each one. Do not demand deep explanations — a solid one or two sentences is enough to satisfy you.

Concepts to cover in order:
${concepts.map((c, i) => `${i + 1}. [${c.id}] ${c.name} — ${c.description}`).join('\n')}

Current concept focus: ${currentConcept ? currentConcept.name : 'All covered!'}
Concepts already covered: ${coveredConcepts.length > 0 ? coveredConcepts.join(', ') : 'None yet'}

QUESTION DEPTH RULES:
You keep questions light and surface-level. Never push beyond depth 2 on a single concept.
Depth 1 (first question): Ask for a simple definition or description. "What is X?" or "So what does Y mean exactly?"
Depth 2 (user gave a basic answer): Ask for one clarifying detail if needed. "Got it — and what's it used for?" or "Okay, so how is that different from {nearby term}?"
Once the user has given you a clear definition and one supporting detail, you are satisfied. Express it and move on to the next concept. Do not push further.

MISCONCEPTION TO PLANT:
After the user has covered at least 2 concepts, casually slip in this wrong belief as if you half-remember it:

Wrong belief: "${misconception ? misconception.wrong_belief : 'None currently'}"

How to introduce it: Say something like "Oh wait — I think I read somewhere that {wrong_belief}. Is that right?" Keep it light and offhand — you're not interrogating, just checking.
Only introduce this ONCE. Wait for the user to respond. Do not correct yourself.
If the user corrects you: react with a simple "Ohh okay, good to know! I had that mixed up."
If the user doesn't correct you: move on. The system handles it silently.

BEHAVIORAL MODES:
CONFUSED: Use when the user uses unexplained jargon or skips a definition. Keep it casual — "Hmm, I don't think I caught what that word means."
CURIOUS: Your default state. Light and engaged — "Cool, what about..."
SATISFIED: When the user gives a clear enough answer. "Nice, that makes sense." Then move on.
CAUGHT: When the user corrects your misconception. "Oh right, yeah — I had that backwards. Thanks!"

Keep responses SHORT. 1 to 2 sentences maximum. You want the gist, not the lecture.

METADATA OUTPUT:
After your student dialogue, on a new line, output a JSON block wrapped in <metadata></metadata> tags. This will be hidden from the user — it is only for the system.

<metadata>
{
  "concept_covered": "{concept id you were discussing, e.g. 'c1'}",
  "depth_score": {1-3, how well this concept was covered — Leo maxes at 3},
  "misconception_triggered": ${!misconceptionTriggered ? 'true if you stated the wrong belief this turn' : 'false'},
  "misconception_caught": {true if the user corrected the wrong belief this turn, null if not applicable},
  "bloom_level_reached": {1-3, matching Leo's surface depth rules},
  "mia_state": "{confused | curious | satisfied | caught}"
}
</metadata>

IMPORTANT: Never mention the metadata. Never reference it. Output it silently after every response without fail.`;
}

// --- Route to correct persona prompt ---
function buildSystemPrompt({ topic, concepts, currentConcept, coveredConcepts, misconception, misconceptionTriggered, persona, language }) {
    if (persona === 'leo') {
        return buildLeoPrompt({ topic, concepts, currentConcept, coveredConcepts, misconception, misconceptionTriggered, language });
    }
    return buildMiaPrompt({ topic, concepts, currentConcept, coveredConcepts, misconception, misconceptionTriggered, language });
}

// --- Parse Metadata String ---
function parseResponse(rawResponse) {
    const metaMatch = rawResponse.match(/<metadata>([\s\S]*?)<\/metadata>/);
    let metadata = {
        concept_covered: null,
        depth_score: 1,
        misconception_triggered: false,
        misconception_caught: null,
        bloom_level_reached: 1,
        mia_state: "curious"
    };
    let cleanText = rawResponse;

    if (metaMatch) {
        try {
            const parsed = JSON.parse(metaMatch[1].trim());
            metadata = { ...metadata, ...parsed };
        } catch (e) {
            console.error("Failed to parse metadata JSON:", metaMatch[1], e);
        }
        cleanText = rawResponse.replace(/<metadata>[\s\S]*?<\/metadata>/, "").trim();
    }
    return { cleanText, metadata };
}

// --- Chat Controller ---
export const streamChat = async (req, res) => {
    try {
        const { id } = req.params; // sessionId
        const { message, drawing_image } = req.body;

        if (!message && !drawing_image) {
            return res.status(400).json({ success: false, message: "Message or drawing is required." });
        }

        const session = await Session.findOne({ sessionId: id });
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found." });
        }

        const userMessage = message?.trim() || "I shared a drawing for this topic.";

        // 1. Save user message to the session array and update last activity timestamp
        session.messages.push({
            role: "user",
            clean_text: userMessage
        });
        session.lastMessageAt = new Date();

        // 2. Determine concepts & history state
        const depthScores = session.depthScores || {};
        const currentConcept = session.conceptTree.find(c => (depthScores.get(c.id) || 0) < 3) ?? session.conceptTree.at(-1);
        const coveredConcepts = session.conceptTree.filter(c => (depthScores.get(c.id) || 0) >= 2).map(c => c.name);
        
        // Ensure tracking fields exist
        if (session.misconception_triggered_at === undefined) session.misconception_triggered_at = null;
        if (session.misconception_window_open === undefined) session.misconception_window_open = false;

        const systemPrompt = buildSystemPrompt({
            topic: session.topic,
            concepts: session.conceptTree,
            currentConcept,
            coveredConcepts,
            misconception: session.misconception,
            misconceptionTriggered: session.misconception_triggered_at !== null,
            persona: session.persona || 'mia',
            language: session.language || 'en'
        });

        // Build cleanly formatted history for the model
        // Groq/Llama expects typical {role, content} format
        const chatHistory = [
            { role: "system", content: systemPrompt },
            ...session.messages.map(m => ({
                role: m.role,
                content: m.clean_text
            }))
        ];

        if (drawing_image) {
            try {
                const drawingSummary = await describe_drawing_from_data_url(drawing_image, session.topic);
                if (drawingSummary) {
                    chatHistory.push({
                        role: "user",
                        content: `Additional context from my drawing:\n${drawingSummary}`,
                    });
                }
            } catch (drawingError) {
                console.error("Failed to analyze drawing image:", drawingError);
            }
        }

        // 3. Initiate Streaming Call to Groq
        // Note: For SSE (Server-Sent Events) we would use res.write().
        // For simplicity and to match step requirements, we'll manually flush.
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await call_llama_70b(chatHistory, { stream: true });
        
        let rawResponse = "";

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                rawResponse += content;
                // Send as SSE format
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
        }

        // Done streaming. Parse metadata!
        const { cleanText, metadata } = parseResponse(rawResponse);

        // 4. Update session state
        // Add AI message to DB
        const messageIndex = session.messages.length;
        session.messages.push({
            role: "assistant",
            clean_text: cleanText,
            raw_text: rawResponse,
            metadata: metadata
        });

        // Update score if a concept was covered
        if (metadata.concept_covered && session.conceptTree.find(c => c.id === metadata.concept_covered)) {
            // only upgrade, never downgrade
            const oldScore = session.depthScores.get(metadata.concept_covered) || 0;
            const newScore = Math.max(oldScore, metadata.depth_score || 0);
            session.depthScores.set(metadata.concept_covered, newScore);
        }
        // Auto-complete trigger: if all concepts have depth >= 4, mark session completed
        let autoCompleted = false;
        if (session.conceptTree && session.conceptTree.length > 0) {
            const allCovered = session.conceptTree.every(c => (session.depthScores.get(c.id) || 0) >= 4);
            if (allCovered) {
                session.status = 'completed';
                session.endTime = new Date();
                autoCompleted = true;
            }
        }
        // 5. Misconception Detection Window Rules
        if (metadata.misconception_triggered && !session.misconception_triggered_at) {
            session.misconception_triggered_at = messageIndex;
            session.misconception_window_open = true;
        }

        if (session.misconception_window_open && metadata.misconception_caught) {
            session.misconception_window_open = false;
            session.blindSpots.push({
                concept: session.misconception.concept_id,
                wrong_belief: session.misconception.wrong_belief,
                correct_belief: session.misconception.correct_belief,
                type: "caught" // caught it!
            });
        }

        if (session.misconception_window_open && messageIndex - session.misconception_triggered_at >= 5) {
            session.misconception_window_open = false;
            session.blindSpots.push({
                concept: session.misconception.concept_id,
                wrong_belief: session.misconception.wrong_belief,
                correct_belief: session.misconception.correct_belief,
                type: "missed" // missed it
            });
        }

        // Save session frequently (every message here, or optimize if needed)
        await session.save();

        let ttsAudio = null;
        try {
            ttsAudio = await synthesizeSpeech(cleanText, session.persona || 'mia');
        } catch (ttsError) {
            console.error('TTS generation failed:', ttsError);
        }

        // End the stream and append a final chunk with the JSON metadata payload and completion flag
        res.write(`data: ${JSON.stringify({
            done: true,
            metadata,
            session_complete: autoCompleted,
            audio_base64: ttsAudio?.data || null,
            audio_mime_type: ttsAudio?.mimeType || null
        })}\n\n`);
        res.end();

    } catch (error) {
        console.error("Chat streaming error:", error);
        res.write(`data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`);
        res.end();
    }
};
