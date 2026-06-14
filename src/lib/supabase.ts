import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Le cloud est-il configuré (variables d'environnement présentes) ? */
export const isCloudConfigured = Boolean(url && anonKey)

/** Client Supabase, ou null si le cloud n'est pas configuré. */
export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

/** Clé publique VAPID pour les notifications Web Push. */
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/** Les notifications push sont-elles configurées (cloud + clé VAPID) ? */
export const isPushConfigured = isCloudConfigured && Boolean(VAPID_PUBLIC_KEY)
