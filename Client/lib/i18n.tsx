"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

export type LanguageCode =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "hi"
  | "zh"
  | "ja"
  | "ko"
  | "ar"
  | "ru"

export const LANGUAGES: { code: LanguageCode; label: string; native: string; promptName: string }[] = [
  { code: "en", label: "English", native: "English", promptName: "English" },
  { code: "es", label: "Spanish", native: "Español", promptName: "Spanish" },
  { code: "fr", label: "French", native: "Français", promptName: "French" },
  { code: "de", label: "German", native: "Deutsch", promptName: "German" },
  { code: "it", label: "Italian", native: "Italiano", promptName: "Italian" },
  { code: "pt", label: "Portuguese", native: "Português", promptName: "Portuguese" },
  { code: "hi", label: "Hindi", native: "हिन्दी", promptName: "Hindi" },
  { code: "zh", label: "Chinese", native: "中文", promptName: "Simplified Chinese" },
  { code: "ja", label: "Japanese", native: "日本語", promptName: "Japanese" },
  { code: "ko", label: "Korean", native: "한국어", promptName: "Korean" },
  { code: "ar", label: "Arabic", native: "العربية", promptName: "Arabic" },
  { code: "ru", label: "Russian", native: "Русский", promptName: "Russian" },
]

export const promptNameFor = (code: string | undefined | null): string => {
  const found = LANGUAGES.find((l) => l.code === code)
  return found ? found.promptName : "English"
}

type Dict = Record<string, string>

const en: Dict = {
  // Header
  "header.signIn": "Sign in",
  "header.signUp": "Sign up",
  "header.language": "Language",

  // Auth toast
  "auth.required": "Please sign in or create an account to continue.",

  // Landing
  "landing.badge": "AI-powered learning verification",
  "landing.headline.1": "Teach it.",
  "landing.headline.2": "Prove it.",
  "landing.headline.3": "Own it.",
  "landing.subhead": "Socratic tests your understanding by making you teach Mia, an AI student who asks the questions you forgot to ask yourself.",
  "landing.cta.start": "Start teaching",
  "landing.cta.sessions": "View my sessions",
  "landing.trust.1": "No quizzes",
  "landing.trust.2": "No flashcards",
  "landing.trust.3": "Real understanding",
  "landing.preview.title": "Teaching session · Photosynthesis",
  "landing.preview.live": "Live",
  "landing.how.eyebrow": "How it works",
  "landing.how.title": "Three steps to real mastery",
  "landing.step1.label": "Enter your topic",
  "landing.step1.sub": "Any subject — from photosynthesis to React hooks to the French Revolution.",
  "landing.step2.label": "Teach Mia live",
  "landing.step2.sub": "Mia asks questions. You explain. Gaps and blind spots surface naturally through conversation.",
  "landing.step3.label": "Get your report",
  "landing.step3.sub": "Score, blind spots, best moment — everything you need to know in one animated report.",
  "landing.features.eyebrow": "Features",
  "landing.features.title": "Built to expose what you don't know",
  "landing.feat.teach.title": "Teach Mia",
  "landing.feat.teach.desc": "Explain your topic to Mia, an AI student who asks questions like a real learner — not a tutor.",
  "landing.feat.radar.title": "Live knowledge radar",
  "landing.feat.radar.desc": "A radar chart updates in real time as you cover each concept, exposing gaps as they happen.",
  "landing.feat.misc.title": "Misconception detection",
  "landing.feat.misc.desc": "Mia quietly plants a wrong belief. If you don't catch it, the report flags it as a blind spot.",
  "landing.feat.voice.title": "Voice mode",
  "landing.feat.voice.desc": "Speak your explanations out loud. Mia responds in her own voice — a full spoken conversation.",
  "landing.feat.source.title": "Add source material",
  "landing.feat.source.desc": "Paste a URL or upload a PDF. Mia adapts her knowledge to exactly what you're trying to learn.",
  "landing.feat.report.title": "Mastery report",
  "landing.feat.report.desc": "Every session ends with a full animated report — a score, concept notes, and your best moment.",
  "landing.quote.text": "If you can't explain it simply, you don't understand it well enough.",
  "landing.quote.author": "— Richard Feynman",
  "landing.cta.title": "Ready to find out what you actually know?",
  "landing.cta.sub": "Pick a topic. Start teaching. Mia will find the gaps you didn't know you had.",
  "landing.cta.poweredBy": "Powered by Gemini & Groq",
  "landing.footer.tag": "Teach it. Prove it. Own it.",

  // Choose
  "choose.eyebrow": "Choose your student",
  "choose.title": "Who do you want to teach today?",
  "choose.sub": "Two AI students. Two ways to test your understanding.",
  "choose.mia.depth": "Deep understanding",
  "choose.mia.desc": "Mia pushes you to explain the why behind everything. She asks follow-up questions, makes connections between concepts, and won't move on until she truly understands.",
  "choose.mia.tag1": "Mechanisms",
  "choose.mia.tag2": "Connections",
  "choose.mia.tag3": "Application",
  "choose.leo.depth": "Surface understanding",
  "choose.leo.desc": "Leo just wants the gist. He asks for clear definitions and the main ideas, then moves on — perfect for quick recall practice.",
  "choose.leo.tag1": "Definitions",
  "choose.leo.tag2": "Main ideas",
  "choose.leo.tag3": "Recall",
  "choose.select": "Teach",

  // Onboard
  "onboard.title": "Enter your topic",
  "onboard.placeholder": "What do you want to teach today? Try 'Photosynthesis' or 'How React hooks work'",
  "onboard.requireTopic": "Please enter a topic first.",
  "onboard.error": "Something went wrong — want to try again?",
  "onboard.attach.add": "Add source material",
  "onboard.attach.optional": "(optional)",
  "onboard.attach.pdf": "PDF",
  "onboard.attach.txt": "TXT",
  "onboard.attach.url": "URL",
  "onboard.urlModal.title": "Paste a YouTube URL",
  "onboard.urlModal.placeholder": "https://www.youtube.com/watch?v=...",
  "onboard.urlModal.invalid": "Please enter a valid YouTube URL.",
  "onboard.urlModal.cancel": "Cancel",
  "onboard.urlModal.use": "Use this link",
  "onboard.start": "Start Teaching",
  "onboard.loading.1": "Understanding your topic...",
  "onboard.loading.2": "Building {persona}'s knowledge...",
  "onboard.loading.3": "Preparing your session...",

  // Sessions list
  "sessions.title": "Your sessions",
  "sessions.sub": "Review past teaching sessions and mastery reports.",
  "sessions.new": "New session",
  "sessions.empty.title": "No teaching sessions yet",
  "sessions.empty.sub": "Start your first session to put your knowledge to the test and uncover your blind spots.",
  "sessions.empty.cta": "Start your first session",
  "sessions.status.active": "Active",
  "sessions.status.completed": "Completed",
  "sessions.status.initializing": "Initializing",
  "sessions.inProgress": "In progress",
  "sessions.resume": "Resume session",
  "sessions.viewReport": "View report",
  "sessions.action.resume": "Resume",
  "sessions.action.viewReport": "View report",
  "sessions.action.delete": "Delete",
  "sessions.confirmDelete": "Delete this session? This cannot be undone.",
  "sessions.streak.current": "Current streak",
  "sessions.streak.longest": "Longest streak",
  "sessions.streak.total": "Total active days",
  "sessions.score.strong": "Strong",
  "sessions.score.good": "Good",
  "sessions.score.developing": "Developing",
  "sessions.score.early": "Early stage",

  // Session (chat)
  "session.send": "Send",
  "session.placeholder": "Explain it to {persona}...",
  "session.endSession": "End session",
  "session.endingSession": "Ending session...",
  "session.confirmEnd": "End this session and generate the report?",
  "session.draw": "Draw",
  "session.voice": "Voice",
  "session.voiceOn": "Voice on",
  "session.voiceOff": "Voice off",
  "session.thinking": "{persona} is thinking...",
  "session.loadError": "Couldn't load this session.",

  // Report
  "report.loading": "Generating your report...",
  "report.score": "Mastery score",
  "report.opening": "Opening summary",
  "report.concepts": "Concept notes",
  "report.bestMoment": "Best moment",
  "report.standout": "Standout stat",
  "report.paste": "Paste behavior",
  "report.blindSpots": "Blind spots",
  "report.studyResources": "Study resources",
  "report.noBlindSpots": "No blind spots flagged.",
  "report.backToSessions": "Back to sessions",
  "report.share": "Share report",
  "report.notFound": "Report not found.",
  "report.gap": "Gap",
  "report.covered": "What you covered",
  "report.missed": "What was missed",
  "report.blindSpotDetected": "Blind spot detected",
  "report.pasteEvents": "Paste events",
  "report.flagged": "Flagged",
  "report.clean": "Clean",
  "report.bestMomentTitle": "The moment it all clicked.",
  "report.download": "Download report",
}

// Translations are intentionally compact — they cover all visible strings.
const es: Dict = {
  "header.signIn": "Iniciar sesión",
  "header.signUp": "Registrarse",
  "header.language": "Idioma",
  "auth.required": "Inicia sesión o crea una cuenta para continuar.",
  "landing.badge": "Verificación de aprendizaje con IA",
  "landing.headline.1": "Enséñalo.",
  "landing.headline.2": "Demuéstralo.",
  "landing.headline.3": "Domínalo.",
  "landing.subhead": "Socratic pone a prueba tu comprensión haciéndote enseñar a Mia, una estudiante de IA que hace las preguntas que olvidaste hacerte.",
  "landing.cta.start": "Comenzar a enseñar",
  "landing.cta.sessions": "Ver mis sesiones",
  "landing.trust.1": "Sin cuestionarios",
  "landing.trust.2": "Sin tarjetas",
  "landing.trust.3": "Comprensión real",
  "landing.preview.title": "Sesión de enseñanza · Fotosíntesis",
  "landing.preview.live": "En vivo",
  "landing.how.eyebrow": "Cómo funciona",
  "landing.how.title": "Tres pasos hacia el dominio real",
  "landing.step1.label": "Escribe tu tema",
  "landing.step1.sub": "Cualquier materia — desde la fotosíntesis hasta los hooks de React.",
  "landing.step2.label": "Enseña a Mia en vivo",
  "landing.step2.sub": "Mia pregunta. Tú explicas. Las lagunas surgen naturalmente.",
  "landing.step3.label": "Recibe tu informe",
  "landing.step3.sub": "Puntuación, puntos ciegos, mejor momento — todo en un informe animado.",
  "landing.features.eyebrow": "Características",
  "landing.features.title": "Diseñado para revelar lo que no sabes",
  "landing.feat.teach.title": "Enseña a Mia",
  "landing.feat.teach.desc": "Explica tu tema a Mia, una estudiante de IA que pregunta como un alumno real.",
  "landing.feat.radar.title": "Radar de conocimiento en vivo",
  "landing.feat.radar.desc": "Un gráfico de radar se actualiza en tiempo real revelando lagunas al instante.",
  "landing.feat.misc.title": "Detección de ideas erróneas",
  "landing.feat.misc.desc": "Mia introduce silenciosamente una creencia incorrecta. Si no la atrapas, queda marcada.",
  "landing.feat.voice.title": "Modo de voz",
  "landing.feat.voice.desc": "Habla tus explicaciones en voz alta. Mia responde con su propia voz.",
  "landing.feat.source.title": "Añadir material fuente",
  "landing.feat.source.desc": "Pega una URL o sube un PDF. Mia adapta su conocimiento a tu material.",
  "landing.feat.report.title": "Informe de dominio",
  "landing.feat.report.desc": "Cada sesión termina con un informe animado completo.",
  "landing.quote.text": "Si no puedes explicarlo simplemente, no lo entiendes lo suficientemente bien.",
  "landing.quote.author": "— Richard Feynman",
  "landing.cta.title": "¿Listo para descubrir lo que realmente sabes?",
  "landing.cta.sub": "Elige un tema. Comienza a enseñar. Mia encontrará las lagunas.",
  "landing.cta.poweredBy": "Impulsado por Gemini y Groq",
  "landing.footer.tag": "Enséñalo. Demuéstralo. Domínalo.",
  "choose.eyebrow": "Elige tu estudiante",
  "choose.title": "¿A quién quieres enseñar hoy?",
  "choose.sub": "Dos estudiantes de IA. Dos formas de poner a prueba tu comprensión.",
  "choose.mia.depth": "Comprensión profunda",
  "choose.mia.desc": "Mia te empuja a explicar el porqué de todo. Hace preguntas de seguimiento y conecta conceptos.",
  "choose.mia.tag1": "Mecanismos",
  "choose.mia.tag2": "Conexiones",
  "choose.mia.tag3": "Aplicación",
  "choose.leo.depth": "Comprensión superficial",
  "choose.leo.desc": "Leo quiere lo esencial. Pide definiciones claras e ideas principales — perfecto para repasar.",
  "choose.leo.tag1": "Definiciones",
  "choose.leo.tag2": "Ideas principales",
  "choose.leo.tag3": "Recordar",
  "choose.select": "Enseñar",
  "onboard.title": "Escribe tu tema",
  "onboard.placeholder": "¿Qué quieres enseñar hoy? Prueba 'Fotosíntesis' o 'Hooks de React'",
  "onboard.requireTopic": "Por favor escribe un tema primero.",
  "onboard.error": "Algo salió mal — ¿quieres intentarlo de nuevo?",
  "onboard.attach.add": "Añadir material fuente",
  "onboard.attach.optional": "(opcional)",
  "onboard.attach.pdf": "PDF",
  "onboard.attach.txt": "TXT",
  "onboard.attach.url": "URL",
  "onboard.urlModal.title": "Pega una URL de YouTube",
  "onboard.urlModal.placeholder": "https://www.youtube.com/watch?v=...",
  "onboard.urlModal.invalid": "Por favor introduce una URL válida de YouTube.",
  "onboard.urlModal.cancel": "Cancelar",
  "onboard.urlModal.use": "Usar este enlace",
  "onboard.start": "Comenzar a enseñar",
  "onboard.loading.1": "Entendiendo tu tema...",
  "onboard.loading.2": "Construyendo el conocimiento de {persona}...",
  "onboard.loading.3": "Preparando tu sesión...",
  "sessions.title": "Tus sesiones",
  "sessions.sub": "Cada tema que has enseñado — continúa donde lo dejaste o revisita un informe.",
  "sessions.empty.title": "Aún no hay sesiones",
  "sessions.empty.sub": "Inicia tu primera sesión de enseñanza y aparecerá aquí.",
  "sessions.empty.cta": "Comenzar a enseñar",
  "sessions.status.active": "Activa",
  "sessions.status.completed": "Completada",
  "sessions.status.initializing": "Inicializando",
  "sessions.action.resume": "Reanudar",
  "sessions.action.viewReport": "Ver informe",
  "sessions.action.delete": "Eliminar",
  "sessions.confirmDelete": "¿Eliminar esta sesión? No se puede deshacer.",
  "session.send": "Enviar",
  "session.placeholder": "Explícale a {persona}...",
  "session.endSession": "Terminar sesión",
  "session.endingSession": "Terminando sesión...",
  "session.confirmEnd": "¿Terminar esta sesión y generar el informe?",
  "session.draw": "Dibujar",
  "session.voice": "Voz",
  "session.voiceOn": "Voz activada",
  "session.voiceOff": "Voz desactivada",
  "session.thinking": "{persona} está pensando...",
  "session.loadError": "No se pudo cargar esta sesión.",
  "report.loading": "Generando tu informe...",
  "report.score": "Puntuación de dominio",
  "report.opening": "Resumen de apertura",
  "report.concepts": "Notas de conceptos",
  "report.bestMoment": "Mejor momento",
  "report.standout": "Estadística destacada",
  "report.paste": "Comportamiento de pegado",
  "report.blindSpots": "Puntos ciegos",
  "report.studyResources": "Recursos de estudio",
  "report.noBlindSpots": "Sin puntos ciegos detectados.",
  "report.backToSessions": "Volver a sesiones",
  "report.share": "Compartir informe",
  "report.notFound": "Informe no encontrado.",
  "report.gap": "Laguna",
  "report.covered": "Lo que cubriste",
  "report.missed": "Lo que se omitió",
}

const fr: Dict = {
  "header.signIn": "Se connecter",
  "header.signUp": "S'inscrire",
  "header.language": "Langue",
  "auth.required": "Connectez-vous ou créez un compte pour continuer.",
  "landing.badge": "Vérification d'apprentissage par IA",
  "landing.headline.1": "Enseignez-le.",
  "landing.headline.2": "Prouvez-le.",
  "landing.headline.3": "Maîtrisez-le.",
  "landing.subhead": "Socratic teste votre compréhension en vous faisant enseigner à Mia, une étudiante IA qui pose les questions que vous avez oublié de vous poser.",
  "landing.cta.start": "Commencer à enseigner",
  "landing.cta.sessions": "Voir mes sessions",
  "landing.trust.1": "Pas de quiz",
  "landing.trust.2": "Pas de fiches",
  "landing.trust.3": "Vraie compréhension",
  "landing.preview.title": "Session d'enseignement · Photosynthèse",
  "landing.preview.live": "En direct",
  "landing.how.eyebrow": "Comment ça marche",
  "landing.how.title": "Trois étapes vers la vraie maîtrise",
  "landing.step1.label": "Saisissez votre sujet",
  "landing.step1.sub": "N'importe quel sujet — de la photosynthèse aux hooks React.",
  "landing.step2.label": "Enseignez à Mia en direct",
  "landing.step2.sub": "Mia pose des questions. Vous expliquez. Les lacunes apparaissent naturellement.",
  "landing.step3.label": "Recevez votre rapport",
  "landing.step3.sub": "Score, angles morts, meilleur moment — tout dans un rapport animé.",
  "landing.features.eyebrow": "Fonctionnalités",
  "landing.features.title": "Conçu pour révéler ce que vous ignorez",
  "landing.feat.teach.title": "Enseignez à Mia",
  "landing.feat.teach.desc": "Expliquez votre sujet à Mia, une étudiante IA qui questionne comme un vrai apprenant.",
  "landing.feat.radar.title": "Radar de connaissances en direct",
  "landing.feat.radar.desc": "Un graphique radar se met à jour en temps réel et révèle les lacunes.",
  "landing.feat.misc.title": "Détection d'idées fausses",
  "landing.feat.misc.desc": "Mia plante une fausse croyance. Si vous ne la repérez pas, elle est signalée.",
  "landing.feat.voice.title": "Mode vocal",
  "landing.feat.voice.desc": "Expliquez à voix haute. Mia répond avec sa propre voix.",
  "landing.feat.source.title": "Ajouter du matériel source",
  "landing.feat.source.desc": "Collez une URL ou téléchargez un PDF. Mia s'adapte à votre matériel.",
  "landing.feat.report.title": "Rapport de maîtrise",
  "landing.feat.report.desc": "Chaque session se termine par un rapport animé complet.",
  "landing.quote.text": "Si vous ne pouvez pas l'expliquer simplement, vous ne le comprenez pas assez bien.",
  "landing.quote.author": "— Richard Feynman",
  "landing.cta.title": "Prêt à découvrir ce que vous savez vraiment ?",
  "landing.cta.sub": "Choisissez un sujet. Commencez à enseigner. Mia trouvera les lacunes.",
  "landing.cta.poweredBy": "Propulsé par Gemini et Groq",
  "landing.footer.tag": "Enseignez-le. Prouvez-le. Maîtrisez-le.",
  "choose.eyebrow": "Choisissez votre étudiant",
  "choose.title": "À qui voulez-vous enseigner aujourd'hui ?",
  "choose.sub": "Deux étudiants IA. Deux façons de tester votre compréhension.",
  "choose.mia.depth": "Compréhension profonde",
  "choose.mia.desc": "Mia vous pousse à expliquer le pourquoi de tout. Elle relie les concepts en profondeur.",
  "choose.mia.tag1": "Mécanismes",
  "choose.mia.tag2": "Connexions",
  "choose.mia.tag3": "Application",
  "choose.leo.depth": "Compréhension de surface",
  "choose.leo.desc": "Leo veut juste l'essentiel. Définitions claires et idées principales.",
  "choose.leo.tag1": "Définitions",
  "choose.leo.tag2": "Idées principales",
  "choose.leo.tag3": "Rappel",
  "choose.select": "Enseigner",
  "onboard.title": "Saisissez votre sujet",
  "onboard.placeholder": "Que voulez-vous enseigner aujourd'hui ? Essayez 'Photosynthèse'",
  "onboard.requireTopic": "Veuillez d'abord saisir un sujet.",
  "onboard.error": "Quelque chose a mal tourné — voulez-vous réessayer ?",
  "onboard.attach.add": "Ajouter du matériel source",
  "onboard.attach.optional": "(facultatif)",
  "onboard.attach.pdf": "PDF",
  "onboard.attach.txt": "TXT",
  "onboard.attach.url": "URL",
  "onboard.urlModal.title": "Collez une URL YouTube",
  "onboard.urlModal.placeholder": "https://www.youtube.com/watch?v=...",
  "onboard.urlModal.invalid": "Veuillez saisir une URL YouTube valide.",
  "onboard.urlModal.cancel": "Annuler",
  "onboard.urlModal.use": "Utiliser ce lien",
  "onboard.start": "Commencer à enseigner",
  "onboard.loading.1": "Compréhension de votre sujet...",
  "onboard.loading.2": "Construction des connaissances de {persona}...",
  "onboard.loading.3": "Préparation de votre session...",
  "sessions.title": "Vos sessions",
  "sessions.sub": "Chaque sujet enseigné — reprenez ou revoyez un rapport.",
  "sessions.empty.title": "Pas encore de sessions",
  "sessions.empty.sub": "Commencez votre première session et elle apparaîtra ici.",
  "sessions.empty.cta": "Commencer à enseigner",
  "sessions.status.active": "Active",
  "sessions.status.completed": "Terminée",
  "sessions.status.initializing": "Initialisation",
  "sessions.action.resume": "Reprendre",
  "sessions.action.viewReport": "Voir le rapport",
  "sessions.action.delete": "Supprimer",
  "sessions.confirmDelete": "Supprimer cette session ? Cette action est irréversible.",
  "session.send": "Envoyer",
  "session.placeholder": "Expliquez à {persona}...",
  "session.endSession": "Terminer la session",
  "session.endingSession": "Fin de session...",
  "session.confirmEnd": "Terminer cette session et générer le rapport ?",
  "session.draw": "Dessiner",
  "session.voice": "Voix",
  "session.voiceOn": "Voix activée",
  "session.voiceOff": "Voix désactivée",
  "session.thinking": "{persona} réfléchit...",
  "session.loadError": "Impossible de charger cette session.",
  "report.loading": "Génération de votre rapport...",
  "report.score": "Score de maîtrise",
  "report.opening": "Résumé d'ouverture",
  "report.concepts": "Notes de concepts",
  "report.bestMoment": "Meilleur moment",
  "report.standout": "Statistique remarquable",
  "report.paste": "Comportement de collage",
  "report.blindSpots": "Angles morts",
  "report.studyResources": "Ressources d'étude",
  "report.noBlindSpots": "Aucun angle mort signalé.",
  "report.backToSessions": "Retour aux sessions",
  "report.share": "Partager le rapport",
  "report.notFound": "Rapport introuvable.",
  "report.gap": "Lacune",
  "report.covered": "Ce que vous avez couvert",
  "report.missed": "Ce qui a été manqué",
}

// For other languages, we provide a minimal core (header + key CTAs).
// Strings missing in a non-English dictionary fall back to English.
const de: Dict = {
  "header.signIn": "Anmelden", "header.signUp": "Registrieren", "header.language": "Sprache",
  "landing.cta.start": "Mit dem Unterrichten beginnen", "landing.cta.sessions": "Meine Sitzungen",
  "onboard.start": "Unterricht starten", "onboard.title": "Thema eingeben",
  "session.send": "Senden", "session.endSession": "Sitzung beenden",
  "report.score": "Beherrschungsergebnis", "report.backToSessions": "Zurück zu Sitzungen",
  "choose.select": "Unterrichten",
}
const it: Dict = {
  "header.signIn": "Accedi", "header.signUp": "Registrati", "header.language": "Lingua",
  "landing.cta.start": "Inizia a insegnare", "landing.cta.sessions": "Le mie sessioni",
  "onboard.start": "Inizia a insegnare", "onboard.title": "Inserisci il tuo argomento",
  "session.send": "Invia", "session.endSession": "Termina sessione",
  "report.score": "Punteggio di padronanza", "report.backToSessions": "Torna alle sessioni",
  "choose.select": "Insegna",
}
const pt: Dict = {
  "header.signIn": "Entrar", "header.signUp": "Cadastrar", "header.language": "Idioma",
  "landing.cta.start": "Começar a ensinar", "landing.cta.sessions": "Minhas sessões",
  "onboard.start": "Começar a ensinar", "onboard.title": "Digite seu tópico",
  "session.send": "Enviar", "session.endSession": "Encerrar sessão",
  "report.score": "Pontuação de domínio", "report.backToSessions": "Voltar às sessões",
  "choose.select": "Ensinar",
}
const hi: Dict = {
  "header.signIn": "साइन इन", "header.signUp": "साइन अप", "header.language": "भाषा",
  "landing.cta.start": "पढ़ाना शुरू करें", "landing.cta.sessions": "मेरे सत्र",
  "onboard.start": "पढ़ाना शुरू करें", "onboard.title": "अपना विषय दर्ज करें",
  "session.send": "भेजें", "session.endSession": "सत्र समाप्त करें",
  "report.score": "महारत स्कोर", "report.backToSessions": "सत्रों पर वापस जाएं",
  "choose.select": "पढ़ाएं",
}
const zh: Dict = {
  "header.signIn": "登录", "header.signUp": "注册", "header.language": "语言",
  "landing.cta.start": "开始教学", "landing.cta.sessions": "我的会话",
  "onboard.start": "开始教学", "onboard.title": "输入主题",
  "session.send": "发送", "session.endSession": "结束会话",
  "report.score": "掌握分数", "report.backToSessions": "返回会话",
  "choose.select": "教学",
}
const ja: Dict = {
  "header.signIn": "ログイン", "header.signUp": "新規登録", "header.language": "言語",
  "landing.cta.start": "教え始める", "landing.cta.sessions": "セッション一覧",
  "onboard.start": "教え始める", "onboard.title": "トピックを入力",
  "session.send": "送信", "session.endSession": "セッション終了",
  "report.score": "習熟度スコア", "report.backToSessions": "セッションに戻る",
  "choose.select": "教える",
}
const ko: Dict = {
  "header.signIn": "로그인", "header.signUp": "가입하기", "header.language": "언어",
  "landing.cta.start": "가르치기 시작", "landing.cta.sessions": "내 세션",
  "onboard.start": "가르치기 시작", "onboard.title": "주제를 입력하세요",
  "session.send": "보내기", "session.endSession": "세션 종료",
  "report.score": "숙달 점수", "report.backToSessions": "세션으로 돌아가기",
  "choose.select": "가르치기",
}
const ar: Dict = {
  "header.signIn": "تسجيل الدخول", "header.signUp": "إنشاء حساب", "header.language": "اللغة",
  "landing.cta.start": "ابدأ التدريس", "landing.cta.sessions": "جلساتي",
  "onboard.start": "ابدأ التدريس", "onboard.title": "أدخل موضوعك",
  "session.send": "إرسال", "session.endSession": "إنهاء الجلسة",
  "report.score": "درجة الإتقان", "report.backToSessions": "العودة إلى الجلسات",
  "choose.select": "علّم",
}
const ru: Dict = {
  "header.signIn": "Войти", "header.signUp": "Регистрация", "header.language": "Язык",
  "landing.cta.start": "Начать обучение", "landing.cta.sessions": "Мои сессии",
  "onboard.start": "Начать обучение", "onboard.title": "Введите свою тему",
  "session.send": "Отправить", "session.endSession": "Завершить сессию",
  "report.score": "Оценка мастерства", "report.backToSessions": "К сессиям",
  "choose.select": "Учить",
}

const dictionaries: Record<LanguageCode, Dict> = {
  en, es, fr, de, it, pt, hi, zh, ja, ko, ar, ru,
}

interface LanguageCtx {
  language: LanguageCode
  setLanguage: (code: LanguageCode) => void
  t: (key: string, vars?: Record<string, string>) => string
  isRTL: boolean
}

const Ctx = createContext<LanguageCtx | null>(null)

const STORAGE_KEY = "socratic.language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null
      if (saved && dictionaries[saved]) {
        setLanguageState(saved)
      }
    } catch {}
  }, [])

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = code
      document.documentElement.dir = code === "ar" ? "rtl" : "ltr"
    }
  }, [])

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    }
  }, [language])

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const dict = dictionaries[language] || en
      let str = dict[key] ?? en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v)
        }
      }
      return str
    },
    [language]
  )

  const isRTL = language === "ar"

  return <Ctx.Provider value={{ language, setLanguage, t, isRTL }}>{children}</Ctx.Provider>
}

export function useLanguage(): LanguageCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Safe fallback so hooks don't crash before provider mounts
    return {
      language: "en",
      setLanguage: () => {},
      t: (key) => en[key] ?? key,
      isRTL: false,
    }
  }
  return ctx
}
