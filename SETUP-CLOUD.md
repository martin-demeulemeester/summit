# Activer le cloud et les notifications push (Summit)

L'app fonctionne 100 % en local sans rien configurer. Ce guide ajoute la
**sauvegarde cloud** (multi-appareils) et les **rappels push** même app fermée.
Tout est gratuit dans les quotas Supabase pour un usage perso.

## 1. Créer le projet Supabase

1. Crée un compte sur https://supabase.com puis un nouveau projet.
2. Dans **Project Settings -> API**, note :
   - `Project URL` -> `VITE_SUPABASE_URL`
   - clé `anon public` -> `VITE_SUPABASE_ANON_KEY`
   - clé `service_role` (secrète) -> servira au cron / à la fonction.

## 2. Créer les tables

Dans **SQL Editor**, exécute le contenu de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
(tables `daily_logs`, `settings`, `push_subscriptions` + Row Level Security).

Puis exécute [`supabase/migrations/0003_custom_auth.sql`](supabase/migrations/0003_custom_auth.sql)
pour activer l'auth maison pseudo + mot de passe (profils, sessions, hash côté
Postgres et fonctions RPC Summit).

## 3. Configurer l'app (front)

Copie `.env.example` en `.env.local` et renseigne :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_VAPID_PUBLIC_KEY=        # rempli à l'étape 5
```

Relance `npm run dev`. Dans **Réglages -> Compte & sauvegarde cloud**, crée ton
compte avec pseudo + mot de passe, puis connecte-toi. La synchro se fait
automatiquement après connexion.

> Auth : Summit utilise une auth maison via RPC. Supabase Auth n'est plus affiché
> à l'utilisateur et aucun e-mail de confirmation n'est envoyé.

## 4. Générer les clés VAPID (push)

```bash
npx web-push generate-vapid-keys
```

- `Public Key`  -> `VITE_VAPID_PUBLIC_KEY` dans `.env.local` (relance `npm run dev`).
- `Private Key` -> secret de la fonction Edge (étape 5).

## 5. Déployer la fonction d'envoi des rappels (dashboard)

1. Dashboard -> **Edge Functions** -> *Create a new function* (via l'éditeur web).
2. Nom : `send-reminders`. Colle tout le contenu de
   [`supabase/functions/send-reminders/index.ts`](supabase/functions/send-reminders/index.ts).
3. **Désactive « Verify JWT »** pour cette fonction (la sécurité est assurée par le
   secret partagé `CRON_SECRET`). Déploie.
4. Renseigne les **secrets** (Edge Functions -> *Secrets*, ou Project Settings ->
   Edge Functions) :
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (ex. `mailto:toi@mail.fr`)
   - `CRON_SECRET` (chaîne aléatoire, identique à celle du cron)

(`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement.)

## 6. Planifier le cron

Dans **SQL Editor**, exécute
[`supabase/migrations/0002_cron.sql`](supabase/migrations/0002_cron.sql) (l'URL du
projet et le `CRON_SECRET` y sont renseignés). La fonction tournera toutes les
15 minutes et enverra les rappels dont l'heure est arrivée (selon tes réglages) pour
les tâches non encore faites + la relance sport de fin de journée.

## 7. Activer le push sur le téléphone

Sur ton Android, installe la PWA (Chrome -> « Ajouter à l'écran d'accueil »), ouvre
**Réglages -> Compte & sauvegarde cloud -> Activer les notifications push** et autorise.

## Dépannage

- **Pas de notif planifiée** : vérifie les logs de la fonction (`supabase functions logs
  send-reminders`) et que le cron est actif (`select * from cron.job;`).
- **iPhone** : le Web Push n'est possible que sur une PWA installée (iOS 16.4+).
- **Heure décalée** : l'app enregistre ton décalage horaire à l'abonnement ; réactive
  le push si tu changes de fuseau.
