# Changelog

Toutes les modifications notables de Summit sont documentées dans ce fichier.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/) et le projet
respecte [SemVer](https://semver.org/lang/fr/).

## [0.6.0] - 2026-06-14

### Ajouté

- Authentification maison pseudo + mot de passe : profils `summit_profiles`,
  sessions `summit_sessions`, hash de mot de passe côté Postgres et fonctions RPC
  pour inscription, connexion, déconnexion, synchro et push.

### Modifié

- La synchro cloud et les abonnements push passent désormais par les RPC Summit,
  sans utiliser Supabase Auth côté utilisateur.

## [0.5.1] - 2026-06-14

### Corrigé

- Correction de l'identifiant interne généré depuis le pseudo : utilisation d'un
  domaine e-mail réservé valide (`summit.example.com`) accepté par Supabase.

## [0.5.0] - 2026-06-14

### Modifié

- Remplacement de l'authentification visible par email + mot de passe par un
  formulaire pseudo + mot de passe.
- Le pseudo est converti en identifiant interne Supabase invisible pour éviter
  les e-mails de confirmation dans l'expérience utilisateur.

## [0.4.0] - 2026-06-14

### Modifié

- Refonte de la direction artistique : thème clair pastel, accent violet, cartes
  blanches arrondies et navigation flottante inspirée de la sobriété d'Aura.
- Harmonisation visuelle des écrans Aujourd'hui, Sport, Progression, Historique
  et Réglages.

## [0.3.0] - 2026-06-14

### Modifié

- Remplacement de la connexion par lien magique par une authentification
  email + mot de passe.
- Ajout d'un mode « Créer un compte » dans la section Compte & sauvegarde cloud.

## [0.2.0] - 2026-06-14

### Ajouté

- Sauvegarde cloud via Supabase : authentification e-mail, synchronisation
  automatique des logs et réglages (résolution de conflits « dernière écriture
  gagnante »).
- Notifications Web Push : service worker (stratégie injectManifest) avec gestion
  des push et du clic, abonnement depuis les Réglages.
- Fonction Edge `send-reminders` (Deno) + planification pg_cron pour envoyer les
  rappels dus (tâches non faites + relance sport de fin de journée), avec gestion
  du fuseau horaire par appareil.
- Schéma SQL + Row Level Security (`supabase/migrations/`) et guide d'installation
  `SETUP-CLOUD.md`.
- Section « Compte & sauvegarde cloud » dans les Réglages.

### Notes

- Toutes les fonctionnalités cloud/push se dégradent gracieusement : sans variables
  d'environnement Supabase, l'app reste pleinement fonctionnelle en local.

## [0.1.0] - 2026-06-14

### Ajouté

- Suivi de routine quotidienne : soins visage matin/soir, soin des pieds, 1 h de
  dev, 1 h de prépa MP2I.
- Sport : 4 blocs par jour (tractions, pompes, gainage) avec séance guidée et
  minuteurs de repos et de gainage.
- Logique de série (streak) et système de jokers (1 joker gagné par semaine
  parfaite, consommé pour couvrir une journée ratée).
- Progression : suggestion automatique d'augmentation des cibles après 7 jours
  de sport complets au même palier.
- Page Historique : calendrier des 5 dernières semaines + statistiques.
- Page Progression : graphique des 14 derniers jours.
- Réglages : heures de rappel, cibles, autorisation des notifications, reset.
- PWA installable (manifest, service worker, mode hors-ligne).
- Stockage local (IndexedDB via Dexie).
- Tests unitaires de la logique streak/joker et progression (Vitest).
