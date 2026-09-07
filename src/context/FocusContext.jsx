import { createContext, useContext, useState, useCallback } from 'react'

// Generic focus-mode state: any card can register itself as "focused"
// by id. When a card is focused, all cards get either the focused
// treatment or the dimmed treatment — implemented once, used everywhere.
const FocusContext = createContext(null)

export function FocusProvider({ children }) {
  const [focusedId, setFocusedId] = useState(null)

  const focus = useCallback((id) => setFocusedId(id), [])
  const unfocus = useCallback(() => setFocusedId(null), [])

  return (
    <FocusContext.Provider value={{ focusedId, focus, unfocus }}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus() {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used within FocusProvider')
  return ctx
}
