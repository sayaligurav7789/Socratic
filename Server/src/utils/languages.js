// Map of supported language codes -> human-readable names used in LLM prompts.
const LANGUAGES = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    hi: 'Hindi',
    zh: 'Simplified Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    ru: 'Russian',
};

export function languageName(code) {
    if (!code) return 'English';
    return LANGUAGES[String(code).toLowerCase()] || 'English';
}

// Returns the directive line used to prepend or inject into LLM prompts.
export function languageDirective(code) {
    const name = languageName(code);
    if (name === 'English') return '';
    return `IMPORTANT LANGUAGE REQUIREMENT: All natural-language output you produce must be written in ${name}. Concept names, descriptions, dialogue, summaries, notes, and any other prose must be in ${name}. Keep JSON keys, identifiers (like "c1", "c2"), URLs, and code snippets in their original form. Numbers and proper nouns may be transliterated where appropriate.`;
}

export const SUPPORTED_LANGUAGE_CODES = Object.keys(LANGUAGES);
