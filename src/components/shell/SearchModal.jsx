import { useState, useEffect, useMemo, useRef } from 'react'
import { Search } from 'lucide-react'
import { PROPERTIES, CONNECTIONS, INBOX } from '../../data/mockData'

function buildIndex() {
  const items = []
  PROPERTIES.forEach(p => items.push({ type: 'Property', label: p.name, sub: p.domain }))
  CONNECTIONS.forEach(c => items.push({ type: 'Connection', label: c.account_label, sub: c.platform_type }))
  INBOX.forEach(e => items.push({ type: 'Email', label: e.subject, sub: e.sender }))
  return items
}

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const index = useMemo(buildIndex, [])

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = query.trim()
    ? index.filter(i => (i.label + i.sub).toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in" onClick={onClose}>
      <div className="hud-card accent-glow w-full max-w-lg p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-2 py-2 border-b border-white/10 mb-2">
          <Search size={16} className="text-faint-c" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="flex-1 bg-transparent text-sm text-headline placeholder:text-faint-c focus:outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-faint-c">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {query.trim() === '' && <div className="text-xs text-faint-c px-2 py-6 text-center">Search properties, connections, inbox...</div>}
          {query.trim() !== '' && results.length === 0 && <div className="text-xs text-faint-c px-2 py-6 text-center">No results.</div>}
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5">
              <div className="min-w-0">
                <div className="text-sm text-headline truncate">{r.label}</div>
                <div className="text-[11px] text-faint-c truncate">{r.sub}</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-faint-c shrink-0">{r.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
