# Tests manuels - Summit

## Vérifié automatiquement (cette session)

- [x] `npm run build` : compilation TypeScript + build Vite + génération PWA OK
- [x] `npm test` : 8 tests verts (logique streak/joker + progression)
- [x] Rendu des 5 écrans sans erreur runtime (Aujourd'hui, Sport, Progression, Historique, Réglages)
- [x] Cocher une tâche met à jour le compteur du jour (1/9)
- [x] Déroulé d'un bloc de sport : Tractions -> Repos -> Pompes (enchaînement des étapes)
- [x] Version affichée dans Réglages

## À tester manuellement sur ton téléphone Android

- [ ] Lancer `npm run dev -- --host`, ouvrir l'URL réseau sur le tel (même Wi-Fi)
- [ ] Chrome -> menu -> « Ajouter à l'écran d'accueil » : l'app s'installe et s'ouvre en plein écran
- [ ] Mode hors-ligne : couper le réseau, rouvrir l'app -> elle se charge (service worker)
- [ ] Faire une vraie séance complète : les 3 minuteurs (repos 1 min, gainage 1 min 30) défilent bien
- [ ] Réglages -> « Autoriser les notifications » : la notification de test s'affiche
- [ ] Cocher toute la routine sur plusieurs jours -> vérifier le streak et le calendrier de l'Historique

## À tester après configuration cloud (voir SETUP-CLOUD.md)

- [ ] Réglages -> Compte : création de compte puis connexion email + mot de passe
- [ ] Synchroniser maintenant -> données visibles depuis un autre navigateur/appareil
- [ ] Activer les notifications push, puis recevoir un rappel planifié **app fermée**
- [ ] Vérifier que seules les tâches non faites déclenchent un rappel
- [ ] `supabase functions logs send-reminders` ne montre pas d'erreur

## Points à améliorer / limites connues

- Icônes en SVG (et non PNG 192/512). Suffisant pour l'installation sur Chrome
  Android récent, mais des PNG dédiés amélioreraient la compatibilité.
- Notifications planifiées (app fermée) : nécessitent la configuration Supabase +
  VAPID (SETUP-CLOUD.md). Sans cela, l'app peut notifier seulement quand elle est ouverte.
- Bundle JS ~660 Ko (Recharts). On pourra charger la page Progression en lazy si besoin.
- La fonction `send-reminders` et le cron n'ont pas pu être testés de bout en bout ici
  (nécessitent un projet Supabase). Le code client (auth, synchro, abonnement push) et
  le build sont vérifiés ; la dégradation gracieuse sans cloud est testée.
