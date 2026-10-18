# Visio

Visioconférence WebRTC (6 personnes max), installable sur téléphone (PWA), sans lien avec le site de l'atelier.
Dossier autonome : aucune dépendance du reste du repo, pas d'étape de build.

## Déployer (Vercel, projet séparé)
1. Vercel → *Add New Project* → ce repo → **Root Directory : `visio`** → Deploy.
2. Ouvrir l'URL sur le téléphone :
   - Android (Chrome) : bouton « Installer l'application », ou menu ⋮ → *Ajouter à l'écran d'accueil*.
   - iPhone (Safari) : Partager → *Sur l'écran d'accueil*.

## Invitations par e-mail
- **Sans configuration** : le bouton « Inviter par e-mail » ouvre la messagerie du téléphone avec le lien prérempli.
- **Envoi par le serveur** (optionnel) : renseigner dans Vercel `RESEND_API_KEY`, `INVITE_FROM` (adresse d'un domaine **vérifié** chez Resend — avec `onboarding@resend.dev`, Resend n'envoie qu'au propriétaire du compte), `TURNSTILE_SECRET_KEY`, puis mettre la clé publique Turnstile (créée pour ce nouveau domaine) dans `<meta name="turnstile-sitekey">` de `index.html`.

## Limites
Maillage P2P (≤ 6), pas de relais TURN (échecs derrière certains réseaux), signalisation via le serveur public PeerJS, pas d'enregistrement ni de mot de passe de salle.
