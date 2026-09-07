import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import { useFocus } from '../../context/FocusContext'

/**
 * Generic HUD card shell. Any panel drops its content in as children and
 * gets: glass background, corner brackets, drag handle, and focus-mode
 * behavior (click to expand full-width, dim/scale everything else) for free.
 *
 * id: unique card id (used for focus + drag + layout persistence)
 * span: optional grid column span classes for the default (non-focused) layout
 */
export default function HudCard({ id, title, icon: Icon, accentClass = '', span = '', children, className = '' }) {
  const { focusedId, focus, unfocus } = useFocus()
  const isFocused = focusedId === id
  const isDimmed = focusedId !== null && !isFocused

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: focusedId !== null })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'hud-card group relative animate-in',
        isFocused ? 'col-span-full row-span-2 scale-100 opacity-100 z-20' : span,
        isDimmed ? 'opacity-25 scale-[0.97]' : '',
        isDragging ? 'z-30 shadow-2xl' : '',
        accentClass,
        className,
      ].join(' ')}
    >
      <div className="hud-corner tl" />
      <div className="hud-corner br" />

      <div
        className="flex items-center justify-between px-4 pt-3 pb-2 cursor-pointer select-none"
        onClick={() => !isFocused && focus(id)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={16} style={{ color: 'var(--accent)' }} className="shrink-0" />}
          <h3 className="text-headline font-semibold text-sm truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isFocused ? (
            <button
              onClick={(e) => { e.stopPropagation(); unfocus() }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Close focus view"
            >
              <X size={16} className="text-body-c" />
            </button>
          ) : (
            <button
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/10 cursor-grab active:cursor-grabbing text-faint-c opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Drag to rearrange"
              title="Drag to rearrange"
            >
              <GripVertical size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4" onClick={(e) => { if (!isFocused) e.stopPropagation() }}>
        {children}
      </div>
    </div>
  )
}
