import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth, signInWithPassword, signOut, signUpWithPassword } from '../lib/auth'
import { isCloudConfigured, isPushConfigured } from '../lib/supabase'
import { fullSync } from '../lib/sync'
import { disablePush, enablePush, isPushEnabled } from '../lib/push'

type AuthMode = 'signin' | 'signup'

export default function CloudAccount() {
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pushOn, setPushOn] = useState(false)

  useEffect(() => {
    isPushEnabled().then(setPushOn).catch(() => setPushOn(false))
  }, [user])

  if (!isCloudConfigured) {
    return (
      <Box>
        <p className="text-sm text-slate-300">☁️ Cloud non configuré.</p>
        <p className="mt-1 text-xs text-slate-500">
          Renseigne <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> dans
          <code> .env.local</code> (voir <code>SETUP-CLOUD.md</code>) pour activer la sauvegarde
          et les rappels planifiés.
        </p>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box>
        <p className="text-sm text-slate-400">Chargement du compte…</p>
      </Box>
    )
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setMsg('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password)
        setMsg('Connexion réussie ✅')
      } else {
        const { needsConfirmation } = await signUpWithPassword(email, password)
        setMsg(
          needsConfirmation
            ? 'Compte créé. Vérifie ton e-mail pour confirmer ton adresse, puis reconnecte-toi.'
            : 'Compte créé et connecté ✅',
        )
      }
    } catch (err) {
      setMsg(`Erreur : ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    if (!user) return
    setBusy(true)
    setMsg(null)
    try {
      await fullSync(user.id)
      setMsg('Synchronisation effectuée ✅')
    } catch (err) {
      setMsg(`Erreur de synchro : ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleTogglePush() {
    if (!user) return
    setBusy(true)
    setMsg(null)
    try {
      if (pushOn) {
        await disablePush(user.id)
        setPushOn(false)
        setMsg('Notifications push désactivées.')
      } else {
        await enablePush(user.id)
        setPushOn(true)
        setMsg('Notifications push activées 🔔')
      }
    } catch (err) {
      setMsg(`Erreur : ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return (
      <Box>
        <div className="mb-3 grid grid-cols-2 rounded-lg bg-summit-bg p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setMsg(null)
            }}
            className={`rounded-md py-2 ${
              mode === 'signin' ? 'bg-summit-accent text-summit-bg' : 'text-slate-400'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setMsg(null)
            }}
            className={`rounded-md py-2 ${
              mode === 'signup' ? 'bg-summit-accent text-summit-bg' : 'text-slate-400'
            }`}
          >
            Créer un compte
          </button>
        </div>
        <form onSubmit={handleSignIn} className="space-y-2">
          <label className="block text-sm text-slate-300">
            {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.fr"
            className="w-full rounded-lg bg-summit-bg px-3 py-2 text-sm text-white outline-none ring-1 ring-summit-surface2 focus:ring-summit-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-lg bg-summit-bg px-3 py-2 text-sm text-white outline-none ring-1 ring-summit-surface2 focus:ring-summit-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-summit-accent py-2.5 text-sm font-semibold text-summit-bg disabled:opacity-50"
          >
            {busy ? 'Patiente…' : mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>
        {msg && <p className="mt-2 text-xs text-slate-400">{msg}</p>}
      </Box>
    )
  }

  return (
    <Box>
      <p className="text-sm text-white">Connecté : {user.email}</p>
      <div className="mt-3 space-y-2">
        <button
          onClick={handleSync}
          disabled={busy}
          className="w-full rounded-lg bg-summit-surface2 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Synchroniser maintenant
        </button>
        {isPushConfigured ? (
          <button
            onClick={handleTogglePush}
            disabled={busy}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 ${
              pushOn ? 'bg-summit-surface2 text-white' : 'bg-summit-accent text-summit-bg'
            }`}
          >
            {pushOn ? 'Désactiver les notifications push' : 'Activer les notifications push 🔔'}
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            Renseigne <code>VITE_VAPID_PUBLIC_KEY</code> pour activer les rappels planifiés.
          </p>
        )}
        <button
          onClick={() => signOut()}
          className="w-full rounded-lg border border-summit-surface2 py-2.5 text-sm font-semibold text-slate-300"
        >
          Se déconnecter
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-slate-400">{msg}</p>}
    </Box>
  )
}

function Box({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-summit-surface2/60 bg-summit-surface p-4">{children}</div>
}
