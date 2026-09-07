import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext(null)

/**
 * Resolves the current user's workspace (creating one on first login if
 * they don't have one yet — this is what makes onboarding a new client
 * "add a row", not "write code"). Everything that needs to know which
 * workspace's data/keys to use reads workspaceId from here.
 */
export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [workspaceId, setWorkspaceId] = useState(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured || !user) { setLoading(false); return }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const { data: membership, error: memberErr } = await supabase
        .from('cc_workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (memberErr) {
        console.error('Failed to look up workspace membership:', memberErr)
        if (!cancelled) { setError(memberErr.message); setLoading(false) }
        return
      }

      if (membership) {
        if (!cancelled) { setWorkspaceId(membership.workspace_id); setLoading(false) }
        return
      }

      // first login: create a personal workspace for them via RPC (raw
      // table inserts can't satisfy RLS here — see cc_bootstrap_workspace).
      const slug = `ws-${user.id.slice(0, 8)}`
      const { data: newWorkspaceId, error: bootstrapErr } = await supabase
        .rpc('cc_bootstrap_workspace', { p_name: user.email?.split('@')[0] || 'My Workspace', p_slug: slug })

      if (bootstrapErr || !newWorkspaceId) {
        console.error('Failed to bootstrap workspace:', bootstrapErr)
        if (!cancelled) { setError(bootstrapErr?.message || 'Could not create a workspace.'); setLoading(false) }
        return
      }

      if (!cancelled) { setWorkspaceId(newWorkspaceId); setLoading(false) }
    })()

    return () => { cancelled = true }
  }, [user])

  return (
    <WorkspaceContext.Provider value={{ workspaceId, loading, error }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
