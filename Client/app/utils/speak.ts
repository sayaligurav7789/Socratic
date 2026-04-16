export function speak(text: string, lang: string = "en-US") {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = lang;

    window.speechSynthesis.cancel(); // stop previous speech
    window.speechSynthesis.speak(speech);

    return speech;
}