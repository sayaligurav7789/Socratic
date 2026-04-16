"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

export type LanguageCode = "en" | "es" | "fr" | "de" | "hi" | "zh" | "ja" | "ar" | "pt" | "ko"

export type Language = {
    code: LanguageCode
    label: string
    nativeLabel: string
    speechCode: string
    promptName: string
    flag: string
}

export const LANGUAGES: Language[] = [
    { code: "en", label: "English",    nativeLabel: "English",    speechCode: "en-US", promptName: "English",                    flag: "🇺🇸" },
    { code: "es", label: "Spanish",    nativeLabel: "Español",    speechCode: "es-ES", promptName: "Spanish",                    flag: "🇪🇸" },
    { code: "fr", label: "French",     nativeLabel: "Français",   speechCode: "fr-FR", promptName: "French",                     flag: "🇫🇷" },
    { code: "de", label: "German",     nativeLabel: "Deutsch",    speechCode: "de-DE", promptName: "German",                     flag: "🇩🇪" },
    { code: "hi", label: "Hindi",      nativeLabel: "हिन्दी",      speechCode: "hi-IN", promptName: "Hindi",                      flag: "🇮🇳" },
    { code: "zh", label: "Chinese",    nativeLabel: "中文",        speechCode: "zh-CN", promptName: "Chinese (Simplified)",        flag: "🇨🇳" },
    { code: "ja", label: "Japanese",   nativeLabel: "日本語",      speechCode: "ja-JP", promptName: "Japanese",                   flag: "🇯🇵" },
    { code: "ar", label: "Arabic",     nativeLabel: "العربية",    speechCode: "ar-SA", promptName: "Arabic",                     flag: "🇸🇦" },
    { code: "pt", label: "Portuguese", nativeLabel: "Português",  speechCode: "pt-BR", promptName: "Portuguese (Brazilian)",      flag: "🇧🇷" },
    { code: "ko", label: "Korean",     nativeLabel: "한국어",      speechCode: "ko-KR", promptName: "Korean",                     flag: "🇰🇷" },
]

export const INITIAL_GREETINGS: Record<LanguageCode, (name: string) => string> = {
    en: (n) => `Hi! I'm ${n}. I'm ready to learn about this topic from you. Where should we start?`,
    es: (n) => `¡Hola! Soy ${n}. Estoy listo/a para aprender sobre este tema contigo. ¿Por dónde empezamos?`,
    fr: (n) => `Salut ! Je suis ${n}. Je suis prêt(e) à apprendre sur ce sujet avec toi. Par où commençons-nous ?`,
    de: (n) => `Hallo! Ich bin ${n}. Ich bin bereit, von dir über dieses Thema zu lernen. Wo sollen wir anfangen?`,
    hi: (n) => `नमस्ते! मैं ${n} हूँ। मैं इस विषय के बारे में आपसे सीखने के लिए तैयार हूँ। हम कहाँ से शुरू करें?`,
    zh: (n) => `你好！我是${n}。我准备好向你学习这个话题了。我们从哪里开始？`,
    ja: (n) => `こんにちは！私は${n}です。このトピックについてあなたから学ぶ準備ができています。どこから始めましょうか？`,
    ar: (n) => `مرحباً! أنا ${n}. أنا مستعد/ة للتعلم منك حول هذا الموضوع. من أين نبدأ؟`,
    pt: (n) => `Olá! Eu sou ${n}. Estou pronto/a para aprender sobre esse assunto com você. Por onde começamos?`,
    ko: (n) => `안녕하세요! 저는 ${n}입니다. 이 주제에 대해 당신으로부터 배울 준비가 되어 있습니다. 어디서부터 시작할까요?`,
}

type LanguageContextType = {
    language: Language
    setLanguageByCode: (code: LanguageCode) => void
}

const LanguageContext = createContext<LanguageContextType>({
    language: LANGUAGES[0],
    setLanguageByCode: () => {},
})

const STORAGE_KEY = "socratic-language"

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(LANGUAGES[0])

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null
        if (stored) {
            const found = LANGUAGES.find((l) => l.code === stored)
            if (found) setLanguage(found)
        }
    }, [])

    const setLanguageByCode = (code: LanguageCode) => {
        const found = LANGUAGES.find((l) => l.code === code)
        if (!found) return
        setLanguage(found)
        localStorage.setItem(STORAGE_KEY, code)
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguageByCode }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    return useContext(LanguageContext)
}
