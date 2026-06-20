# Notes /design-sync — Summit

Repo-specific gotchas pour les prochaines synchros.

- **Summit est une app, pas une lib de composants.** Le barrel `src/design-system.ts`
  (exports nommés) a été créé uniquement pour exposer les composants à la synchro. Ne
  pas le supprimer. L'entrée du convertisseur est `--entry ./src/design-system.ts`
  (mode synth, pas de dist/.d.ts publié).
- **CSS = snapshot Tailwind.** `cssEntry` pointe sur `.design-sync/ds-styles.css`,
  généré par `npx tailwindcss -i src/index.css -o .design-sync/ds-styles.css --minify`.
  Le régénérer quand `src/index.css` ou `tailwind.config.js` change (sinon styles obsolètes).
- **`summit-accent2` (vert lichen) absent du CSS compilé** : token défini dans
  `tailwind.config.js` mais aucune classe ne l'utilise dans l'app → purgé par Tailwind.
  Volontairement retiré de `conventions.md`. Idem pour tout token jamais utilisé.
- **Provider Router obligatoire** pour `BottomNav` et les écrans `*Screen` (react-router) :
  `cfg.provider = { component: "MemoryRouter" }` (MemoryRouter ré-exporté par le barrel).
- **`import.meta.env`** (Vite) : géré par le convertisseur (define synthétique), donc
  `supabase.ts` ne plante pas le bundle ; `isCloudConfigured` vaut `false` → `CloudAccount`
  rend « Cloud non configuré ». Pas de changement de code app nécessaire.
- **Playwright** : `playwright@1.60.0` épingle chromium `1223`, présent dans le cache local
  `ms-playwright`. Une autre version (ex. 1.61 → 1228) ne trouverait pas le navigateur.

## Known render warns
- `CoachCamera` ressort en **floor card** : il dépend de `getUserMedia` (pas de caméra en
  headless) → racine vide → bloc typographique. Attendu, non bloquant.
- Token manquant signalé par validate (`1 missing`, sous le seuil) : custom property
  référencée sans définition, non bloquant.

## Re-sync risks
- `ds-styles.css` est un snapshot : se désynchronise si la DA évolue sans régénération.
- Les écrans `*Screen` rendent leur **état vide** (Dexie vide + MemoryRouter) : si la
  logique de chargement change (ex. `useSettings` ne renvoie plus de défaut), leurs cartes
  pourraient virer au « Chargement… ».
- Seuls `ProgressBar` et `StreakHeader` ont des aperçus authorés/notés ; les 9 autres sont
  des floor cards (rendu réel du composant). Authorables incrémentalement plus tard.
