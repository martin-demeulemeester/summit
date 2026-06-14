import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** État d'authentification réactif. */
export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { user, loading }
}

/** Connexion avec email + mot de passe. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Cloud non configuré')
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
}

/** Création de compte avec email + mot de passe. */
export async function signUpWithPassword(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  if (!supabase) throw new Error('Cloud non configuré')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
  return { needsConfirmation: !data.session }
}

/** Déconnexion. */
export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
