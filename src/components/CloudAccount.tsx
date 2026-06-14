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
        <p className="text-sm font-semibold text-summit-ink">☁️ Cloud non configuré.</p>
        <p className="mt-1 text-xs text-summit-muted">
          Renseigne <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> dans
          <code> .env.local</code> pour activer la sauvegarde et les rappels planifiés.
        </p>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box>
        <p className="text-sm text-summit-muted">Chargement du compte...</p>
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
        <div className="mb-3 grid grid-cols-2 rounded-xl bg-summit-bg p-1 text-xs font-bold">
          <ModeButton active={mode === 'signin'} onClick={() => setMode('signin')}>
            Connexion
          </ModeButton>
          <ModeButton active={mode === 'signup'} onClick={() => setMode('signup')}>
            Créer un compte
          </ModeButton>
        </div>
        <form onSubmit={handleSignIn} className="space-y-2">
          <label className="block text-sm font-semibold text-summit-ink">
            {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.fr"
            className="w-full rounded-xl border border-summit-line bg-white px-3 py-2 text-sm text-summit-ink outline-none focus:border-summit-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-xl border border-summit-line bg-white px-3 py-2 text-sm text-summit-ink outline-none focus:border-summit-accent"
          />
          <button type="submit" disabled={busy} className="w-full aura-button-primary py-2.5 text-sm">
            {busy ? 'Patiente...' : mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>
        {msg && <p className="mt-2 text-xs font-medium text-summit-muted">{msg}</p>}
      </Box>
    )
  }

  return (
    <Box>
      <p className="text-sm font-semibold text-summit-ink">Connecté : {user.email}</p>
      <div className="mt-3 space-y-2">
        <button onClick={handleSync} disabled={busy} className="w-full aura-button-secondary py-2.5 text-sm">
          Synchroniser maintenant
        </button>
        {isPushConfigured ? (
          <button
            onClick={handleTogglePush}
            disabled={busy}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 ${
              pushOn ? 'border border-summit-line bg-white text-summit-ink' : 'bg-summit-accent text-white'
            }`}
          >
            {pushOn ? 'Désactiver les notifications push' : 'Activer les notifications push 🔔'}
          </button>
        ) : (
          <p className="text-xs text-summit-muted">
            Renseigne <code>VITE_VAPID_PUBLIC_KEY</code> pour activer les rappels planifiés.
          </p>
        )}
        <button
          onClick={() => signOut()}
          className="w-full rounded-xl border border-summit-line py-2.5 text-sm font-semibold text-summit-muted"
        >
          Se déconnecter
        </button>
      </div>
      {msg && <p className="mt-2 text-xs font-medium text-summit-muted">{msg}</p>}
    </Box>
  )
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => {
        onClick()
      }}
      className={`rounded-lg py-2 ${active ? 'bg-summit-accent text-white' : 'text-summit-muted'}`}
    >
      {children}
    </button>
  )
}

function Box({ children }: { children: ReactNode }) {
  return <div className="aura-card p-4">{children}</div>
}
