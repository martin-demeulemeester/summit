# Summit - Suivi des tâches

Projet : PWA de suivi de routine quotidienne (React + TS + Vite + Tailwind + Dexie).
Version courante : 0.2.0

## Fait (V1 - cœur local)

- [x] Phase 0 - Initialisation : Vite + React + TS, Tailwind, vite-plugin-pwa, Dexie, Recharts
- [x] Phase 1 - Domaine + stockage local : routine, types, logique streak/joker, progression, schéma Dexie
- [x] Phase 1 - Tests unitaires (Vitest) : streak/joker + progression
- [x] Phase 2 - UI : Aujourd'hui, Séance sport (minuteurs), Progression (graphique), Historique (calendrier), Réglages
- [x] Phase 3 - PWA : manifest, service worker, icônes SVG, offline

## Fait (V1 - cloud & notifications)

- [x] Phase 4 - Cloud Supabase : client, auth lien magique, tables + RLS, synchro local <-> cloud (last-write-wins)
- [x] Phase 5 - Notifications push : SW injectManifest (push/click), abonnement client, Edge Function `send-reminders` + cron
- [x] Guide d'installation `SETUP-CLOUD.md`, schéma SQL, fonction Edge

## Fait (cloud en production)

- [x] Projet Supabase créé, tables + RLS appliquées
- [x] Auth lien magique + synchro cloud validées
- [x] Fonction Edge `send-reminders` déployée (CLI) + secrets VAPID/CRON configurés
- [x] Push validé de bout en bout sur desktop (Brave) : notification reçue ✅

## Reste à faire

- [ ] Activer le cron automatique : exécuter `supabase/migrations/0002_cron.sql` dans le SQL Editor
- [ ] Déployer la PWA en HTTPS (Netlify/Vercel/Cloudflare) pour le push **téléphone, app fermée**
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
