import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from 'lucide-react'
import { getSpeechRecognition, speechRecognitionSupported, speechSynthesisSupported, speak, stopSpeaking } from '../../lib/voice'

/**
 * Reusable chat message list + composer, with voice input/output.
 * Used by both the full Claude tab and the floating mini bubble.
 */
export default function ClaudeChatView({ messages, send, sending, error, compact = false }) {
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [muted, setMuted] = useState(false)
  const recRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  // speak the latest assistant reply aloud unless muted
  const lastRoleRef = useRef(null)
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.role === 'assistant' && lastRoleRef.current !== last) {
      lastRoleRef.current = last
      if (!muted) speak(last.content)
    }
  }, [messages, muted])

  function handleMic() {
    if (!speechRecognitionSupported) return
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    const rec = getSpeechRecognition()
    if (!rec) return
    recRef.current = rec
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => (prev ? prev + ' ' : '') + transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
    setListening(true)
  }

  function handleMute() {
    setMuted(m => {
      if (!m) stopSpeaking()
      return !m
    })
  }

  async function handleSend() {
    if (!input.trim() || sending) return
    const text = input
    setInput('')
    await send(text)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollRef} className={`flex-1 overflow-y-auto space-y-3 pr-1 ${compact ? 'max-h-72' : ''}`}>
        {messages.length === 0 && (
          <div className="text-xs text-faint-c text-center py-8">
            Ask Claude anything to get started. If you haven't added an API key yet, add one in Settings first.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={m.role === 'user'
                ? { background: 'color-mix(in srgb, var(--accent) 22%, transparent)', color: 'var(--text-headline)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-body)' }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3.5 py-2.5 bg-white/5 text-faint-c text-sm flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" /> Thinking…
            </div>
          </div>
        )}
        {error && <div className="text-xs text-center" style={{ color: 'var(--red)' }}>{error}</div>}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
        {speechRecognitionSupported ? (
          <button
            onClick={handleMic}
            className="p-2.5 rounded-lg shrink-0 transition-colors"
            style={listening ? { background: 'var(--red)', color: 'black' } : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-body)' }}
            title={listening ? 'Stop listening' : 'Voice input'}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        ) : (
          <button disabled className="p-2.5 rounded-lg shrink-0 bg-white/5 text-faint-c" title="Voice input not supported in this browser">
            <Mic size={16} />
          </button>
        )}

        {speechSynthesisSupported && (
          <button
            onClick={handleMute}
            className="p-2.5 rounded-lg shrink-0 bg-white/6 text-body-c hover:bg-white/10 transition-colors"
            title={muted ? 'Unmute responses' : 'Mute spoken responses'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Message Claude..."
          className="flex-1 min-w-0 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-headline placeholder:text-faint-c focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="p-2.5 rounded-lg shrink-0 text-black disabled:opacity-40 transition-colors"
          style={{ background: 'var(--accent-bright)' }}
        >
          <Send size={16} />
        </button>
      </div>
      {!speechRecognitionSupported && (
        <div className="text-[10px] text-faint-c mt-1.5 text-center">
          Voice input needs Chrome or Edge on this device — typing still works everywhere.
        </div>
      )}
    </div>
  )
}
