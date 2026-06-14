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

/** Transforme un pseudo en identifiant e-mail interne pour Supabase. */
function pseudoToInternalEmail(pseudo: string): string {
  const normalized = pseudo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (normalized.length < 2) {
    throw new Error('Le pseudo doit contenir au moins 2 caractères.')
  }

  return `${normalized}@summit.local`
}

/** Connexion avec pseudo + mot de passe. */
export async function signInWithPseudo(pseudo: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Cloud non configuré')
  const { error } = await supabase.auth.signInWithPassword({
    email: pseudoToInternalEmail(pseudo),
    password,
  })
  if (error) throw error
}

/** Création de compte avec pseudo + mot de passe. */
export async function signUpWithPseudo(pseudo: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Cloud non configuré')
  const cleanPseudo = pseudo.trim()
  const { error } = await supabase.auth.signUp({
    email: pseudoToInternalEmail(cleanPseudo),
    password,
    options: {
      data: { pseudo: cleanPseudo },
    },
  })
  if (error) throw error
}

/** Déconnexion. */
export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
