// Thin wrapper around the Web Speech API (SpeechRecognition + SpeechSynthesis).
// Gracefully reports lack of browser support instead of throwing — this
// works natively well in Chrome/Edge (the expected environment on Windows).

export function getSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.continuous = false
  rec.interimResults = false
  rec.lang = 'en-US'
  return rec
}

export const speechRecognitionSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
export const speechSynthesisSupported = 'speechSynthesis' in window

export function speak(text, { onEnd } = {}) {
  if (!speechSynthesisSupported || !text) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 1.02
  utter.pitch = 1
  if (onEnd) utter.onend = onEnd
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  if (speechSynthesisSupported) window.speechSynthesis.cancel()
}
