import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const SESSION_KEY = 'summit.session'

export interface SummitProfile {
  id: string
  pseudo: string
}

export interface SummitSession {
  token: string
  profile: SummitProfile
}

function readStoredSession(): SummitSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SummitSession) : null
  } catch {
    return null
  }
}

function storeSession(session: SummitSession | null): void {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('summit-auth-change'))
}

function parseAuthPayload(payload: unknown): SummitSession {
  const data = payload as { token?: string; profile?: { id?: string; pseudo?: string } }
  if (!data.token || !data.profile?.id || !data.profile?.pseudo) {
    throw new Error('Réponse auth invalide')
  }
  return {
    token: data.token,
    profile: {
      id: data.profile.id,
      pseudo: data.profile.pseudo,
    },
  }
}

/** État d'authentification maison réactif. */
export function useAuth(): { session: SummitSession | null; user: SummitProfile | null; loading: boolean } {
  const [session, setSession] = useState<SummitSession | null>(() => readStoredSession())

  useEffect(() => {
    const refresh = () => setSession(readStoredSession())
    window.addEventListener('summit-auth-change', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('summit-auth-change', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return { session, user: session?.profile ?? null, loading: false }
}

/** Connexion avec pseudo + mot de passe. */
export async function signInWithPseudo(pseudo: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Cloud non configuré')
  const { data, error } = await supabase.rpc('summit_signin', {
    raw_pseudo: pseudo,
    raw_password: password,
  })
  if (error) throw error
  storeSession(parseAuthPayload(data))
}

/** Création de compte avec pseudo + mot de passe. */
export async function signUpWithPseudo(pseudo: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Cloud non configuré')
  const { data, error } = await supabase.rpc('summit_signup', {
    raw_pseudo: pseudo,
    raw_password: password,
  })
  if (error) throw error
  storeSession(parseAuthPayload(data))
}

export function getSessionToken(): string | null {
  return readStoredSession()?.token ?? null
}

/** Déconnexion. */
export async function signOut(): Promise<void> {
  const token = getSessionToken()
  if (supabase && token) {
    const { error } = await supabase.rpc('summit_signout', { session_token: token })
    if (error) console.warn('Déconnexion cloud échouée', error)
  }
  storeSession(null)
}
