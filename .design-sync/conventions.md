# Summit — design system « rituel topographique »

Summit est une PWA de routine. Sa direction artistique : papier minéral clair,
encre profonde, **orange signal** comme accent, vert lichen secondaire, fond à
grille topographique, cartes à bordure nette et ombre portée dure (esprit print /
néo-brutaliste). Tout est en français.

## Styling : utilitaires Tailwind `summit.*` + classes composant `aura-*`

Système **utility-first** (Tailwind) avec une palette `summit.*` et quelques classes
composant. On stylise via `className` (pas de props de style).

**Palette `summit.*`** — utilisée en préfixes `bg-`, `text-`, `border-` :
- Fonds : `bg-summit-bg`, `bg-summit-surface`, `bg-summit-surface2`, `bg-summit-paper`, `bg-summit-cream`, `bg-summit-night` (sombre)
- Texte : `text-summit-ink` (principal), `text-summit-muted` (secondaire), `text-summit-cream` (sur fond sombre)
- Accent : `text-summit-accent` / `bg-summit-accent` (orange `#ff5a1f`)
- Sémantique : `summit-success`, `summit-warn`, `summit-danger`
- Bordures : `border-2 border-summit-line` (trait encre — signature de la DA)

**Classes composant** (dans la feuille de styles, à réutiliser telles quelles) :
- `aura-card` — carte principale (bordure 2px + ombre portée nette)
- `aura-card-soft` — carte secondaire, plus douce
- `aura-button-primary` — bouton orange plein
- `aura-button-secondary` — bouton sur surface claire
- `summit-label` — sur-titre : petit, majuscule, `tracking` large
- `summit-marker` — pastille majuscule sur fond sombre

**Typographie** : `font-black` (gras) omniprésent ; `font-display` pour les grands
chiffres et titres, `font-mono` pour les minuteurs ; labels en majuscules + `tracking-wide`.

## Setup / provider

`BottomNav` et les écrans `*Screen` utilisent **react-router** (`NavLink`, `useNavigate`,
`Link`) : ils doivent être rendus dans un `Router` (`<BrowserRouter>` côté app, ou
`<MemoryRouter>` en isolation), sinon ils lèvent « useNavigate() may be used only in the
context of a Router ». Les présentationnels (`ProgressBar`, `StreakHeader`) ne requièrent
aucun provider.

## Où est la vérité

Lis `styles.css` (et son `@import "_ds_bundle.css"`) pour la palette, les classes
`aura-*` et le fond topographique avant de styliser. Chaque composant a son
`components/<group>/<Name>/<Name>.d.ts` (contrat d'API) et son `.prompt.md` (usage).

## Exemple idiomatique

```tsx
import { StreakHeader, ProgressBar } from 'summit'

function BilanDuJour() {
  return (
    <div className="aura-card space-y-3 p-4">
      <p className="summit-label text-summit-accent">Aujourd'hui</p>
      <StreakHeader currentStreak={12} jokers={2} />
      <ProgressBar value={5} max={9} />
      <button className="aura-button-primary w-full">Démarrer un bloc</button>
    </div>
  )
}
```
