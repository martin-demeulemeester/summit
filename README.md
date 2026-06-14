# Summit

PWA de suivi de routine quotidienne. **Stay Strong!**

Suis ta routine d'été : soins, dev, prépa MP2I et sport (4 blocs par jour avec
tractions, pompes et gainage). L'app compte ta série, gère tes jokers et te
propose d'augmenter tes cibles quand tu progresses. Installable sur ton
téléphone Android comme une vraie application.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** (UI mobile-first, thème sombre)
- **vite-plugin-pwa** (manifest, service worker, hors-ligne, installable)
- **Dexie** (IndexedDB) pour le stockage local
- **Recharts** pour les graphiques
- **Vitest** pour les tests unitaires

## Démarrage

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production (PWA)
npm run preview    # prévisualiser le build
npm test           # tests unitaires
```

Ouvre l'URL affichée (ex. http://localhost:5173) dans le navigateur. Sur ton
téléphone, ouvre la même adresse (même réseau Wi-Fi, via `npm run dev -- --host`)
puis « Ajouter à l'écran d'accueil » dans Chrome pour l'installer.

## Structure

```text
src/
  domain/      Logique métier (routine, streak/jokers, progression) + tests
  db/          Schéma Dexie et hooks de données
  lib/         Utilitaires (dates, auth, push, Supabase)
  components/  Composants UI réutilisables
  pages/       Écrans (Aujourd'hui, Sport, Progression, Historique, Réglages)
```

## Version

Source de vérité : `package.json` (SemVer), lue par `src/version.ts` et affichée
dans l'écran Réglages. Voir [CHANGELOG.md](./CHANGELOG.md).

## Cloud et notifications

Le code de **sauvegarde cloud** (Supabase) et de **notifications Web Push** est en
place. Pour les activer, suis [SETUP-CLOUD.md](./SETUP-CLOUD.md) : création du
projet Supabase, clés VAPID, déploiement de la fonction `send-reminders`, cron.
Sans configuration, l'app reste pleinement fonctionnelle en local.

Important : les fichiers versionnés ne contiennent pas les secrets locaux. Utilise
`.env.example` comme modèle pour créer ton `.env.local`.

## Feuille de route

- **V1 (fait)** : suivi de routine + PWA + sauvegarde cloud + notifications push.
- **V2** : coach IA caméra (comptage de répétitions et conseils de posture).
