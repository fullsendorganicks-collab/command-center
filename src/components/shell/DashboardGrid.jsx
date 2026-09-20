import { useState, useEffect, useCallback, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { Link2, AlertTriangle } from 'lucide-react'
import { useFocus } from '../../context/FocusContext'
import ErrorBoundary from './ErrorBoundary'

const STORAGE_KEY = 'cc_card_order'

/**
 * Generic draggable/rearrangeable grid. Renders children in a persisted
 * order; drag handle lives inside each HudCard. Order persists to
 * localStorage per user today, ready to swap for a Supabase
 * `cc_layout_prefs.card_positions` sync later.
 *
 * onDropUrl (optional): called with { url, title } when a browser tab or
 * link is dragged in from outside the window (Chrome sends a tab drag as
 * text/uri-list + text/x-moz-url/text/plain, not a dnd-kit drag — this is
 * a separate native HTML5 drag-and-drop listener on the whole grid).
 */
const HTML5_DND_TYPES = ['text/uri-list', 'text/plain', 'text/x-moz-url']

export default function DashboardGrid({ cards, onDropUrl }) {
  const { focusedId } = useFocus()
  const defaultOrder = cards.map(c => c.id)
  const [order, setOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        // keep only ids that still exist, append any new ones
        const valid = saved.filter(id => defaultOrder.includes(id))
        const missing = defaultOrder.filter(id => !valid.includes(id))
        return [...valid, ...missing]
      }
    } catch { /* ignore */ }
    return defaultOrder
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)) } catch { /* ignore */ }
  }, [order])

  // `order` is only seeded once at mount (from localStorage or the
  // initial cards list) — cards.map(c => c.id) above is NOT reactive to
  // `cards` changing later. Remote-browser cards are added dynamically
  // after a tab is dropped (a new id appears in `cards` well after
  // mount), so without this, a newly-dropped tab's id never enters
  // `order` and orderedCards' `.filter(Boolean)` below silently drops it
  // — the row gets created, the drop "succeeds," and nothing ever
  // renders. This keeps `order` in sync: existing positions are kept,
  // any new id is appended, any id that's gone is removed.
  useEffect(() => {
    setOrder(prev => {
      const currentIds = cards.map(c => c.id)
      const kept = prev.filter(id => currentIds.includes(id))
      const added = currentIds.filter(id => !kept.includes(id))
      if (added.length === 0 && kept.length === prev.length) return prev
      return [...kept, ...added]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.map(c => c.id).join(',')])

  // PointerSensor covers mouse; TouchSensor is needed separately on
  // mobile because otherwise the browser's native scroll gesture wins
  // the touch before dnd-kit's pointer listener ever fires. A short
  // press-and-hold delay (with small tolerance for finger jitter) lets
  // a quick tap-and-scroll still work normally.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  )

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrder(prev => {
      const oldIndex = prev.indexOf(active.id)
      const newIndex = prev.indexOf(over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const cardMap = Object.fromEntries(cards.map(c => [c.id, c]))
  const orderedCards = order.map(id => cardMap[id]).filter(Boolean)

  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)

  // A tab/link dragged in from outside the browser window carries no
  // dnd-kit drag id — it's a native HTML5 drag, so it's handled with
  // plain dragenter/dragover/drop listeners on the grid container, kept
  // entirely separate from dnd-kit's own pointer-based reordering above.
  function extractDroppedUrl(dataTransfer) {
    const uriList = dataTransfer.getData('text/uri-list')
    const text = dataTransfer.getData('text/plain')
    const raw = (uriList || text || '').split('\n').find(l => l && !l.startsWith('#'))
    if (!raw) return null
    try {
      const url = new URL(raw.trim())
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
      return { url: url.href, title: dataTransfer.getData('text/x-moz-url')?.split('\n')[1] || url.hostname }
    } catch {
      return null
    }
  }

  // Bound on `window`, not a child div — a fixed, full-viewport overlay
  // rendered to show drag feedback sits on top of everything while a drag
  // is in progress, and browsers are inconsistent about whether a
  // `pointer-events: none` element still receives native HTML5
  // dragover/drop events (unlike click, which reliably passes through).
  // Binding on window sidesteps that entirely: every drag/drop event over
  // the page bubbles to window regardless of what's rendered on top, so
  // there is no element that can ever end up shadowing the drop target.
  useEffect(() => {
    if (!onDropUrl) return

    function onWindowDragEnter(e) {
      if (!Array.from(e.dataTransfer.types).some(t => HTML5_DND_TYPES.includes(t))) return
      dragCounter.current += 1
      setDragOver(true)
    }
    function onWindowDragOver(e) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
    function onWindowDragLeave() {
      dragCounter.current -= 1
      if (dragCounter.current <= 0) { dragCounter.current = 0; setDragOver(false) }
    }
    function onWindowDrop(e) {
      e.preventDefault()
      dragCounter.current = 0
      setDragOver(false)
      const dropped = extractDroppedUrl(e.dataTransfer)
      if (dropped) onDropUrl(dropped)
    }

    window.addEventListener('dragenter', onWindowDragEnter)
    window.addEventListener('dragover', onWindowDragOver)
    window.addEventListener('dragleave', onWindowDragLeave)
    window.addEventListener('drop', onWindowDrop)
    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter)
      window.removeEventListener('dragover', onWindowDragOver)
      window.removeEventListener('dragleave', onWindowDragLeave)
      window.removeEventListener('drop', onWindowDrop)
    }
  }, [onDropUrl])

  return (
    <div className="relative">
      {dragOver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent-bright)', color: 'black' }}
          >
            <Link2 size={16} /> Drop to open as a live browser tab
          </div>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className={`grid gap-4 md:gap-5 ${focusedId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-min'}`}>
            {orderedCards.map(card => (
              <div key={card.id} className={focusedId && focusedId !== card.id ? 'hidden md:block' : ''}>
                <ErrorBoundary fallback={(error) => (
                  <div className="hud-card p-4 text-xs" style={{ color: 'var(--red)' }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5"><AlertTriangle size={13} /> This card crashed</div>
                      {card.onRemove && (
                        <button
                          onClick={card.onRemove}
                          className="text-[11px] px-2 py-1 rounded hover:bg-white/10 text-faint-c shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {error?.message || String(error)}
                  </div>
                )}>
                  {card.render()}
                </ErrorBoundary>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
