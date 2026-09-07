import { useState, useEffect, useCallback } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { useFocus } from '../../context/FocusContext'

const STORAGE_KEY = 'cc_card_order'

/**
 * Generic draggable/rearrangeable grid. Renders children in a persisted
 * order; drag handle lives inside each HudCard. Order persists to
 * localStorage per user today, ready to swap for a Supabase
 * `cc_layout_prefs.card_positions` sync later.
 */
export default function DashboardGrid({ cards }) {
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className={`grid gap-4 md:gap-5 ${focusedId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-min'}`}>
          {orderedCards.map(card => (
            <div key={card.id} className={focusedId && focusedId !== card.id ? 'hidden md:block' : ''}>
              {card.render()}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
