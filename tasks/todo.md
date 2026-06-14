# Summit - Suivi des tâches

Projet : PWA de suivi de routine quotidienne (React + TS + Vite + Tailwind + Dexie).
Version courante : 0.7.1

## Fait (V1 - coeur local)

- [x] Phase 0 - Initialisation : Vite + React + TS, Tailwind, vite-plugin-pwa, Dexie, Recharts
- [x] Phase 1 - Domaine + stockage local : routine, types, logique streak/joker, progression, schéma Dexie
- [x] Phase 1 - Tests unitaires (Vitest) : streak/joker + progression
- [x] Phase 2 - UI : Aujourd'hui, Séance sport (minuteurs), Progression (graphique), Historique (calendrier), Réglages
- [x] Phase 3 - PWA : manifest, service worker, icônes SVG, offline

## Fait (V1 - cloud & notifications)

- [x] Phase 4 - Cloud Supabase : client, auth maison pseudo + mot de passe, tables + RLS/RPC, synchro local <-> cloud (last-write-wins)
- [x] Phase 5 - Notifications push : SW injectManifest (push/click), abonnement client, Edge Function `send-reminders` + cron
- [x] Guide d'installation `SETUP-CLOUD.md`, schéma SQL, fonction Edge

## Fait (cloud en production)

- [x] Projet Supabase créé, tables + RLS appliquées
- [x] Auth cloud + synchro cloud validées
- [x] Fonction Edge `send-reminders` déployée (CLI) + secrets VAPID/CRON configurés
- [x] Push validé de bout en bout sur desktop (Brave) : notification reçue

## Reste à faire

- [x] Refonte DA inspirée d'Aura (GrowthWire)
  - Passer Summit sur une base claire pastel avec accent violet
  - Refaire navigation, cartes, boutons et indicateurs
  - Garder la logique métier inchangée
  - Vérifier TypeScript (`tsc --noEmit`) ; build Vite à relancer hors sandbox
- [x] Direction artistique finale « Rituel topographique »
  - Palette papier minéral, encre profonde, orange signal, vert lichen
  - Fond à grille topographique et composants print premium
  - Refonte accueil, navigation, streak, progression et sport
- [x] Correctifs visuels post-DA
  - Ajouter une transition horizontale entre les pages via la navigation basse
  - Éclaircir les boutons et le conteneur de navigation basse
  - Stabiliser le fond desktop pour éviter la répétition visible au scroll
- [x] Remplacer le lien magique par une connexion pseudo + mot de passe
  - Ajouter inscription et connexion par pseudo + mot de passe dans `src/lib/auth.ts`
  - Adapter la section Compte dans les Réglages
  - Mettre à jour version, changelog et documentation
  - Vérifier avec TypeScript (`tsc --noEmit`) ; build/tests Vite à relancer hors sandbox si nécessaire
- [x] Remplacer Supabase Auth par une auth maison
  - Ajouter `supabase/migrations/0003_custom_auth.sql`
  - Stocker profils, sessions et hashes côté Postgres
  - Faire passer sync/push par RPC Summit
- [ ] Activer le cron automatique : exécuter `supabase/migrations/0002_cron.sql` dans le SQL Editor
- [ ] Déployer la PWA en HTTPS (Netlify/Vercel/Cloudflare) pour le push téléphone, app fermée
- [ ] Installer la PWA sur Android + activer le push dessus
- [ ] Révoquer le Personal Access Token Supabase (sécurité) une fois les déploiements finis
- [ ] Remplacer les icônes SVG par des PNG 192/512 générés (meilleure compat install Android)
- [ ] (Optionnel) Lazy-load de la page Progression pour réduire le bundle (~Recharts)

## V2 (préparé, non implémenté)

- [ ] Coach IA caméra : comptage de reps + posture (MediaPipe / TF.js MoveNet)
- [ ] Analyse vidéo + conseils via API Claude

## Notes

- Source de vérité version : `package.json` -> lue par `src/version.ts` -> affichée dans Réglages.
- Données 100 % locales (IndexedDB) tant que le cloud n'est pas branché ; l'app est pleinement utilisable.
