import User from '../models/User.js';
import Session from '../models/Session.js';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { call_llama_8b } from '../utils/groq.js';
import { call_flash } from '../utils/gemini.js';
import { call_nvidia_llama } from '../utils/nvidia.js';
import { languageName, languageDirective } from '../utils/languages.js';
import { computeAxisScores } from '../utils/scoring.js';

export const createSession = async (req, res) => {
    try {
        const {
            id,           // Frontend's UUID
            user_id,      // Clerk User ID
            topic,
            status,
            start_time,
            concept_tree,
            messages,
            depth_scores,
            blind_spots,
        } = req.body;

        if (!id || !user_id || !topic) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: id, user_id, or topic',
            });
        }

        // Find user by their Clerk ID
        const user = await User.findOne({ clerkId: user_id });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found in system',
            });
        }

        // Create the Session in MongoDB
        const newSession = await Session.create({
            sessionId: id,
            user: user._id,
            topic,
            status: status || 'initializing',
            startTime: start_time ? new Date(start_time) : new Date(),
            conceptTree: concept_tree || null,
            messages: messages || [],
            depthScores: depth_scores || {},
            blindSpots: blind_spots || [],
        });

        // Add this session to the user's history
        user.sessions.push(newSession._id);
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            data: newSession,
        });

    } catch (error) {
        console.error('Error creating session:', error);

        // Handle duplicate key error if frontend sends same UUID again
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Session with this ID already exists',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating session',
            error: error.message,
        });
    }
};

export const initSession = async (req, res) => {
    try {
        const { topic, user_id, source_url, persona, language } = req.body;
        const file = req.file;
        const langCode = (language || 'en').toLowerCase();
        const langName = languageName(langCode);
        const langDirective = languageDirective(langCode);

        if (!topic || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: topic or user_id',
            });
        }

        const trimToApproxTokens = (text, tokenLimit = 2000) => {
            const approxCharsPerToken = 4;
            const maxChars = tokenLimit * approxCharsPerToken;
            if (!text) return text;
            return text.length > maxChars ? text.substring(0, maxChars) : text;
        };

        const isValidYouTubeUrl = (value) => {
            try {
                const parsed = new URL(value);
                const host = parsed.hostname.toLowerCase();
                const allowedHosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"];
                if (!allowedHosts.includes(host)) return false;

                if (host.includes("youtu.be")) {
                    return parsed.pathname.length > 1;
                }

                const path = parsed.pathname.toLowerCase();
                if (path === "/watch") return Boolean(parsed.searchParams.get("v"));
                return path.startsWith("/shorts/") || path.startsWith("/embed/") || path.startsWith("/live/");
            } catch {
                return false;
            }
        };

        // 1. Handle source input -> source_text
        let source_text = null;
        if (file) {
            if (file.mimetype === 'application/pdf') {
                const data = await pdf(file.buffer);
                source_text = data.text;
            } else if (file.mimetype === 'text/plain') {
                source_text = file.buffer.toString('utf-8');
            } else {
                return res.status(400).json({ success: false, message: 'Invalid file type. Only PDF or TXT allowed.' });
            }
            source_text = trimToApproxTokens(source_text, 2000);
        } else if (source_url) {
            if (!isValidYouTubeUrl(source_url)) {
                return res.status(400).json({ success: false, message: 'Invalid YouTube URL.' });
            }

            const readerResponse = await fetch(`https://r.jina.ai/${source_url}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 SocraticApp/1.0"
                }
            });

            if (!readerResponse.ok) {
                return res.status(400).json({ success: false, message: 'Unable to fetch URL content.' });
            }

            const rawText = await readerResponse.text();
            if (!rawText || rawText.trim().length < 20) {
                return res.status(400).json({ success: false, message: 'No useful text found at this URL.' });
            }

            source_text = trimToApproxTokens(rawText, 2000);
        }

        // 2. Safety Check via Llama 3.1 8B
        const safetyPrompt = `Check if the following text or topic is abusive, malicious, involves crime, or is meaningless gibberish (random typed letters). Return ONLY "true" if it is bad/abusive/gibberish, and "false" if it is safe.
Topic: ${topic}
${source_text ? `Text: ${source_text}` : ''}`;

        const safetyResponse = await call_llama_8b([{ role: "user", content: safetyPrompt }]);
        const isAbusive = safetyResponse?.choices?.[0]?.message?.content?.trim().toLowerCase();

        // Strict guard
        if (isAbusive === 'true' || isAbusive?.includes('true')) {
            return res.status(400).json({
                success: false,
                message: 'invalid input',
            });
        }

        // 3. User & DB Prep
        let user = await User.findOne({ clerkId: user_id });

        // Lazy-create user if missing (helpful if Clerk Webhook was missed locally)
        if (!user) {
            const { email, firstName, lastName, imageUrl } = req.body;
            if (!email) {
                return res.status(404).json({ success: false, message: 'User not found in DB and fallback email missing.' });
            }
            user = await User.create({
                clerkId: user_id,
                email,
                firstName: firstName || '',
                lastName: lastName || '',
                imageUrl: imageUrl || '',
                sessions: []
            });
        }

        // 4. Gemini Concept Tree Generation
        // DEVELOPMENT TOGGLE: Set to true to bypass Gemini and save your 20 req/day quota
        const USE_MOCK_GEMINI = false;
        let parsed;

        if (USE_MOCK_GEMINI) {
            console.log("Using Mock Gemini Response to save quota...");
            parsed = {
                topic: "How React Hooks Work",
                concepts: [
                    {
                        id: "c1",
                        name: "Stateful Logic in Functional Components",
                        description: "Hooks fundamentally allow functional components to manage state and side effects, which were previously exclusive to class components."
                    },
                    {
                        id: "c2",
                        name: "`useState` Mechanism and State Preservation",
                        description: "React preserves the state managed by `useState` across component re-renders by associating it with a specific hook call through a consistent internal order."
                    },
                    {
                        id: "c3",
                        name: "`useEffect` for Side Effect Synchronization",
                        description: "`useEffect` allows components to perform side effects after rendering, synchronize with external systems, and provides an optional cleanup mechanism."
                    },
                    {
                        id: "c4",
                        name: "Rules of Hooks and Call Order",
                        description: "The strict rules of Hooks (called only at the top level and only from React functions) are crucial for React to consistently track and map internal state and effects to each hook call during renders."
                    },
                    {
                        id: "c5",
                        name: "React's Internal Hook Queue",
                        description: "Internally, React maintains a linked list or array of 'hook states' for each component, where each hook's state (e.g., `useState`'s value, `useEffect`'s dependencies) is stored and retrieved based on call order."
                    },
                    {
                        id: "c6",
                        name: "Custom Hooks for Logic Reusability",
                        description: "Custom Hooks are JavaScript functions that encapsulate and reuse stateful logic by calling other built-in Hooks, enabling sharing of non-visual behavior across components without sharing state directly."
                    }
                ],
                misconception: {
                    concept_id: "c3",
                    wrong_belief: "Mia believes that `useEffect` with an empty dependency array `[]` behaves exactly like `componentDidMount` and its callback always sees the latest props and state.",
                    correct_belief: "While `useEffect` with `[]` runs once after the initial render and its cleanup on unmount, the effect's callback 'closes over' the props and state from that initial render, meaning it won't reflect later changes unless those values are explicitly included in the dependency array."
                }
            };
        } else {
            const geminiSystemPrompt = `You are a curriculum designer. When given a topic, return a JSON object with exactly 5 to 8 sub-concepts a person must understand to demonstrate genuine mastery of that topic. Return ONLY valid JSON, no explanation, no markdown fences.\n${langDirective}`;

            const geminiUserPrompt = `Topic: ${topic}\n${source_text ? `Additional context from user's notes: ${source_text}` : ''}
    
Return this exact shape:
{
  "topic": "the topic name cleaned up",
  "concepts": [
    { "id": "c1", "name": "Concept Name", "description": "one sentence" }
  ],
  "misconception": {
    "concept_id": "c1",
    "wrong_belief": "what Mia will falsely claim",
    "correct_belief": "the truth"
  }
}`;
            const combinedPrompt = `${geminiSystemPrompt}\n\n${geminiUserPrompt}`;
            try {
                const treeResponseText = await call_nvidia_llama(combinedPrompt);
                const cleanedResponse = treeResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleanedResponse);
            } catch (e) {
                console.warn("Gemini unavailable or returned invalid JSON, using fallback concept tree:", e?.message || e);
                parsed = fallback(topic);
            }
        }

        // 6. DB Finalization
        const sessionId = crypto.randomUUID();
        const depth_scores = Object.fromEntries(parsed.concepts.map((c) => [c.id, 0]));

        const newSession = await Session.create({
            sessionId,
            user: user._id,
            topic: parsed.topic || topic,
            status: 'active',
            startTime: new Date(),
            conceptTree: parsed.concepts,
            misconception: parsed.misconception,
            depthScores: depth_scores,
            sourceText: source_text,
            messages: [],
            blindSpots: [],
            persona: persona === 'leo' ? 'leo' : 'mia',
            language: langCode,
            languageName: langName,
        });

        user.sessions.push(newSession._id);
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Session initialized successfully',
            data: newSession,
        });

    } catch (error) {
        console.error("Error in initSession:", error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

function fallback(topic) {
    return {
        topic: topic,
        concepts: [
            { id: "c1", name: "Core Definition", description: "Learn the core definition of the underlying concepts." },
            { id: "c2", name: "Key Components", description: "Understand the key components and how they fit together." },
            { id: "c3", name: "How It Works", description: "Master the mechanics of how it functions in reality." },
            { id: "c4", name: "Real-World Application", description: "Apply this knowledge to a practical real-world scenario." },
            { id: "c5", name: "Common Pitfalls", description: "Identify common mistakes and misconceptions." },
        ],
        misconception: null
    }
}

export const endSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Session.findOne({ sessionId: id });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        session.status = 'completed';
        session.endTime = new Date();
        await session.save();
        return res.status(200).json({ success: true, message: 'Session ended successfully', data: session });
    } catch (error) {
        console.error('Error ending session:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Session.findOne({ sessionId: id });
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        await User.updateOne({ _id: session.user }, { $pull: { sessions: session._id } });
        await Session.deleteOne({ _id: session._id });
        res.status(200).json({ success: true, message: 'Session deleted' });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};


export const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        // Try to find by public sessionId first, then fallback to MongoDB _id for legacy links
        let session = await Session.findOne({ sessionId: id });
        if (!session) {
            // If not found, attempt to find by the internal MongoDB ObjectId
            session = await Session.findById(id);
        }
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        res.status(200).json({ success: true, data: session });
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const generateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Session.findOne({ sessionId: id });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // 1. Calculate weighted score locally as fallback/base
        // Depth Contribution (60%) + Consistency/Coverage (40%)
        const scores = Array.from(session.depthScores.values());
        const avgDepth = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
        let baseScore = (avgDepth / 5) * 100;

        // Misconception penalty/bonus
        const misconceptionResult = session.blindSpots.find(b => b.type === 'caught') ? 'caught' : (session.blindSpots.find(b => b.type === 'missed') ? 'missed' : 'not_triggered');
        if (misconceptionResult === 'caught') baseScore += 10;
        if (misconceptionResult === 'missed') baseScore -= 5;
        const finalScore = Math.min(100, Math.max(0, Math.round(baseScore)));

        // 1b. Compute dual-axis scores (theoretical vs practical) from per-turn evidence.
        const axisScores = computeAxisScores(session);

        // 2. Format data for Gemini
        const conceptStatus = session.conceptTree.map(c => {
            const depth = session.depthScores.get(c.id) || 0;
            return `- ${c.name}: Depth ${depth}/5`;
        }).join('\n');

        const chatLog = session.messages.map(m => `[${m.role}] ${m.clean_text}`).join('\n');

        const reportLangDirective = languageDirective(session.language || 'en');
        const prompt = `You are generating a post-session mastery report for a teaching simulation app.
${reportLangDirective}
The user just finished teaching the topic: "${session.topic}" to an AI student named Mia.

SITUATION:
Concept Coverage:
${conceptStatus}

Misconception Result: ${misconceptionResult === 'caught' ? 'The user successfully caught and corrected Mia\'s confusion!' : (misconceptionResult === 'missed' ? 'The user missed a significant misconception Mia introduced.' : 'No major misconceptions were addressed.')}

Paste Behavior:
- Text pasted into chat input ${session.pasteCount || 0} times during this session.
- Treat frequent paste activity as a sign the user may be relying on copied text over spontaneous teaching.

Chat History:
${chatLog.slice(-4000)} // truncate to avoid token limits

GENERATE A JSON REPORT:
{
  "overall_score": ${finalScore},
  "opening_summary": "A warm, supportive 1-sentence summary of the session. Max 25 words.",
  "concept_notes": {
    "concept_id": {
      "what_was_covered": "One sentence on what the user explained well.",
      "what_was_missed": "One sentence on a specific gap, or null if fully mastered."
    }
  },
  "best_moment_note": "A note about the user's most effective explanation in the chat.",
    "standout_stat": "A surprising or encouraging stat (e.g., 'You connected X to Y seamlessly!')",
    "paste_behavior": {
        "paste_count": ${session.pasteCount || 0},
        "paste_flagged": ${session.pasteCount > 0 ? 'true' : 'false'},
        "note": "A short line about how paste behavior may have affected authenticity, or null if no pasting happened."
    }
}

RESPONSE RULES:
- Return ONLY valid JSON.
- Be specific to the chat history provided.
- Do not use generic praise.
- Ensure the JSON keys for concept_notes match the IDs: ${session.conceptTree.map(c => c.id).join(', ')}.
`;

        let responseText;
        try {
            responseText = await call_nvidia_llama(prompt);
        } catch (aiErr) {
            console.error('NVIDIA report generation failed:', aiErr);
            throw new Error('AI report generation failed: ' + aiErr.message);
        }
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        let reportData;
        try {
            reportData = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('Report JSON parse failed. Raw response:', cleaned.slice(0, 500));
            throw new Error('Failed to parse AI report response as JSON');
        }

        // Attach dual-axis scoring (computed deterministically from per-turn evidence)
        reportData.theoretical_score = axisScores.overallTheoretical;
        reportData.practical_score = axisScores.overallPractical;
        reportData.gap = axisScores.gap;
        reportData.gap_label = axisScores.gapLabel;
        reportData.axis_scores = axisScores.perConcept;

        reportData.paste_behavior = {
            paste_count: typeof reportData?.paste_behavior?.paste_count === 'number'
                ? reportData.paste_behavior.paste_count
                : (session.pasteCount || 0),
            paste_flagged: typeof reportData?.paste_behavior?.paste_flagged === 'boolean'
                ? reportData.paste_behavior.paste_flagged
                : ((session.pasteCount || 0) > 0),
            note: reportData?.paste_behavior?.note ?? ((session.pasteCount || 0) > 0
                ? 'Some explanations were pasted into the input. Try explaining more in your own words for a stronger mastery signal.'
                : null)
        };

        // 3. Generate source-authenticated study resources for concept gaps
        const TRUSTED_DOMAINS = ['khanacademy.org', 'britannica.com', '.edu'];
        const isTrustedSource = (url) => {
            try {
                const { hostname } = new URL(url);
                return TRUSTED_DOMAINS.some(d => hostname.endsWith(d));
            } catch {
                return false;
            }
        };

        const conceptGaps = session.conceptTree
            .map(c => {
                const notes = reportData.concept_notes?.[c.id];
                return notes?.what_was_missed
                    ? { id: c.id, name: c.name, gap: notes.what_was_missed }
                    : null;
            })
            .filter(Boolean);

        if (conceptGaps.length > 0) {
            try {
                const resourcePrompt = `You are an academic resource curator for a learning app.
${reportLangDirective}

A student just finished a teaching session on: "${session.topic}"

The following knowledge gaps were identified in their understanding:
${conceptGaps.map((g, i) => `${i + 1}. Concept: "${g.name}" — Gap: "${g.gap}"`).join('\n')}

For each gap, generate a structured study resource entry with:
- concept_id: the concept identifier (use these exact values: ${conceptGaps.map(g => g.id).join(', ')})
- concept: the concept name
- gap_summary: one concise sentence describing exactly what they need to study
- resources: array of exactly 2 objects, each with:
  - title: a descriptive title of the resource (e.g. "Khan Academy: Light Reactions in Photosynthesis")
  - url: a real, working URL ONLY from khanacademy.org, britannica.com, or a .edu university domain
  - source_name: short name like "Khan Academy", "Britannica", or the university name
  - type: one of "article", "video", or "lesson"

Return ONLY valid JSON in this exact format (a JSON object with a "items" key):
{
  "items": [
    {
      "concept_id": "c1",
      "concept": "...",
      "gap_summary": "...",
      "resources": [
        { "title": "...", "url": "https://...", "source_name": "...", "type": "lesson" },
        { "title": "...", "url": "https://...", "source_name": "...", "type": "article" }
      ]
    }
  ]
}`;

                const resourceResponse = await call_llama_8b([
                    { role: 'user', content: resourcePrompt }
                ], { response_format: { type: 'json_object' } });
                let resourceCleaned = resourceResponse.choices[0]?.message?.content || '[]';
                resourceCleaned = resourceCleaned.replace(/```json/g, '').replace(/```/g, '').trim();
                let parsedResource = JSON.parse(resourceCleaned);
                const rawResources = Array.isArray(parsedResource)
                    ? parsedResource
                    : (parsedResource.items || parsedResource.resources || parsedResource.study_resources || Object.values(parsedResource)[0] || []);

                reportData.studyResources = rawResources
                    .filter(item => item && item.concept && item.gap_summary)
                    .map(item => ({
                        ...item,
                        resources: Array.isArray(item.resources)
                            ? item.resources.filter(r => r?.url && isTrustedSource(r.url))
                            : [],
                    }));
            } catch (resourceError) {
                console.error('Error generating study resources:', resourceError);
                reportData.studyResources = [];
            }
        } else {
            reportData.studyResources = [];
        }

        // 4. Update Session
        session.report = reportData;
        session.overallScore = reportData.overall_score || finalScore;
        session.status = 'completed';
        if (!session.endTime) session.endTime = new Date();
        
        // Calculate duration in minutes
        if (session.startTime && session.endTime) {
            const diff = Math.abs(session.endTime - session.startTime);
            session.durationMinutes = Math.floor(diff / (1000 * 60));
        }

        await session.save();

        res.status(200).json({ success: true, data: session.report });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ success: false, message: 'Failed to generate report', error: error.message });
    }
};

export const recordPasteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findOneAndUpdate(
            { sessionId: id },
            { $inc: { pasteCount: 1 } },
            { returnDocument: 'after' }
        );

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        return res.status(200).json({
            success: true,
            data: {
                pasteCount: session.pasteCount,
                pasteFlagged: session.pasteCount > 0,
            }
        });
    } catch (error) {
        console.error('Error recording paste event:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const remediateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Session.findOne({ sessionId: id });
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (session.report?.remediationLesson) {
            return res.status(200).json({ success: true, data: session.report.remediationLesson });
        }

        const blindSpotsRaw = session.blindSpots || [];
        const conceptNotesRaw = session.report?.concept_notes || {};

        const prompt = `Act as a world-class mentor. Based on these specific misconceptions and missed concepts, write a concise, interactive lesson that clears the confusion. Use the Socratic method—explain the core logic, then give a real-world analogy. Format your response beautifully in Markdown.

Misconceptions (Blind Spots):
${JSON.stringify(blindSpotsRaw, null, 2)}

Missed Concepts:
${JSON.stringify(conceptNotesRaw, null, 2)}`;

        let remediationLesson;
        try {
            remediationLesson = await call_nvidia_llama(prompt);
        } catch (aiErr) {
            console.error('NVIDIA remediation generation failed:', aiErr);
            throw new Error('AI remediation generation failed: ' + aiErr.message);
        }

        if (!session.report) session.report = {};
        session.report.remediationLesson = remediationLesson;

        // Save since we just updated the report object
        // To ensure Mongoose detects mixed type modifications:
        session.markModified('report');
        await session.save();

        return res.status(200).json({ success: true, data: remediationLesson });
    } catch (error) {
        console.error('Error generating remediation:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};