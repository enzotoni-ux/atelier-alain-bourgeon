# Recon map: Linktree (web)

Scope: public profile page, link editor, basic analytics, pricing/plans. Hors périmètre : Earn (boutique, cours), planification sociale, auto-réponses Instagram, Agency/Enterprise.
For: test de l'outil replica-recon (pas de produit à vendre).
Date: 2026-10-25

## Limites de ce recon (à lire d'abord)

Sources publiques uniquement, lues via 3 pages (accueil, tarifs, un profil public). **L'éditeur et les statistiques sont derrière une connexion : je ne les ai pas vus.** Tout ce qui les concerne est déduit des pages marketing et de la grille de tarifs, donc `confidence: medium` ou `guess`. Pour le détail réel (champs, états vides, erreurs), il faut le compte de l'utilisateur, piloté par lui. Aucune capture n'a été enregistrée dans `replica/screens/`.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | pricing page | https://linktr.ee/s/pricing | 4 offres + Agency/Enterprise, fonctions par palier : lue |
| 2 | marketing site | https://linktr.ee/ | boucle centrale, QR code, analytics, partage : lue |
| 3 | profil public | https://linktr.ee/selenagomez | structure réelle d'une page publique : lue |
| 4 | help center | https://linktr.ee/help/en | **non lue** (à faire pour l'éditeur) |
| 5 | app store / Google Play | liens sur la page tarifs | **non lus** (captures de l'éditeur mobile) |
| 6 | compte de l'utilisateur | n/a | **non disponible** |

## Core loop

Un créateur compose une seule page de liens, la place dans la bio de ses réseaux (ou un QR code), et mesure ce sur quoi les visiteurs cliquent.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Accueil marketing | `/` | convertir en inscription | hero, CTA « Get started for free », galerie de profils, FAQ | filled |
| S02 | Tarifs | `/s/pricing` | choisir une offre | cartes d'offres, bascule annuel/mensuel, tableau de fonctions, FAQ | filled |
| S03 | Profil public | `/<nom>` | afficher les liens | avatar, badge vérifié, titre, pile de liens avec vignette, carrousel de grille, sections nommées, icônes sociales, pied « Get your own Linktree », cookies, signalement, « À propos de ce compte » | filled (vérifié) ; **non vu** : vide, mobile, profil sensible/masqué, 404 |
| S04 | Inscription / connexion | `/register` | créer le compte, choisir l'offre | formulaire, choix `tier` et `frequency` en paramètres d'URL | non vu |
| S05 | Éditeur de liens | admin, derrière connexion | ajouter, ordonner, éditer les liens | **non vu** : liste réordonnable, aperçu du téléphone (déduit) | non vu |
| S06 | Apparence | admin, derrière connexion | thèmes, polices, couleurs, fonds | **non vu** : thèmes, fond vidéo (Pro), retrait du logo (Pro) | non vu |
| S07 | Statistiques | admin, derrière connexion | clics, vues, sources | **non vu** : basique (Starter), cumul sur toute la durée + export (Premium) | non vu |
| S08 | Partage / QR code | admin, derrière connexion | URL et QR code | **non vu** | non vu |
| S09 | Collecte e-mail/SMS | admin, derrière connexion | formulaire de contact intégré | **non vu** | non vu |

Total : 9 écrans, dont 3 seulement vus (S01–S03).

## Flows

```
F01 Visiteur ouvre un profil et suit un lien
    S03 profil -> clic sur un lien -> site externe
    happy path clicks: 1
    edge: lien mort, profil inexistant, carrousel (précédent/suivant), vignette absente

F02 Créateur s'inscrit et crée sa page   [déduit, non vu]
    S01 accueil -> S04 inscription -> S05 éditeur
    happy path clicks: ~3 avant l'éditeur (non vérifié)
    edge: nom de profil déjà pris, offre payante avec essai 7 jours

F03 Créateur ajoute et ordonne des liens  [déduit]
    S05 -> ajouter un lien -> réordonner -> S03 (aperçu)

F04 Créateur personnalise l'apparence     [déduit]
    S06 -> thème / police / fond -> aperçu ; certaines options verrouillées par offre

F05 Créateur consulte ses statistiques    [déduit]
    S07 : clics par lien, par période ; paliers de rétention selon l'offre

F06 Visiteur laisse son e-mail/téléphone  [déduit]
    S03 -> formulaire -> liste de contacts du créateur
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Lien en pile | avec vignette, texte seul, « featured » | default, hover (non vu) | S03 |
| Carrousel de grille | produits, vignettes | précédent/suivant | S03 |
| En-tête de section | titre libre | n/a | S03 |
| Avatar + badge vérifié | vérifié (or) | n/a | S03 |
| Icônes sociales | Facebook, Instagram, TikTok, Spotify, YouTube, Apple Music, X | default | S03 |
| Carte d'offre | Free, Starter, Pro, Premium (« Recommended »), Enterprise | essai gratuit 7 jours | S02 |
| Bascule annuel/mensuel | n/a | n/a | S02 |
| Bandeau d'inscription | « Claim your Linktree », champ `linktr.ee/` | n/a | S03 |
| Bouton principal | CTA | default, hover (non vu) | tous |
| Panneau « À propos du compte » | date d'inscription, comptes liés | n/a | S03 |

## Inferred data model

```
User         id, email, plan_tier, plan_frequency, created_at
             evidence: S02 (tier, frequency), S03 "Joined"
             confidence: medium

Profile      id, user_id, handle (unique), display_name, bio_title, avatar_url,
             verified, theme_id, branding_removed
             evidence: S03, S02 (retrait du logo = Pro)
             confidence: high (champs publics), medium (reste)

Section      id, profile_id, title, position
             evidence: S03 (« In The Dark », « WATCH », « COLLABORATIONS »)
             confidence: high

Link         id, profile_id, section_id?, title, url, description?, thumbnail_url?,
             layout (stack | grid_carousel), position, is_featured
             evidence: S03 (vignettes, descriptions, deux mises en page), S02 (« featured links »)
             confidence: high

SocialIcon   id, profile_id, network, url, position
             evidence: S03 (rangée d'icônes)
             confidence: high

ClickEvent   id, link_id, at, referrer?, country?, device?
             evidence: S01/S02 (« track visitors », « all-time analytics »)
             confidence: guess (champs exacts non vus)

Subscriber   id, profile_id, email?, phone?, created_at
             evidence: S02 « Email and phone sign-ups »
             confidence: medium
```

Relationships: User 1-n Profile (n>1 seulement en Agency), Profile 1-n Section, Profile 1-n Link, Section 1-n Link, Profile 1-n SocialIcon, Link 1-n ClickEvent, Profile 1-n Subscriber.

## Feature matrix

See `features.csv`. Must: 8, should: 7, could: 4, skip: 7.

## Out of scope (cannot or should not be cloned)

- Le domaine `linktr.ee` et sa confiance auprès d'Instagram/TikTok : c'est l'actif principal, il ne se reproduit pas.
- Le programme de vérification des comptes notables, le catalogue d'exemples (célébrités, marques) et les images/logos des profils publics.
- Earn : boutique, cours (partenariat Kajabi), liens sponsorisés, marketplace d'affiliation, remboursements/commissions : accords et régulation par pays.
- Planification sociale avec publication automatique et auto-réponses Instagram : dépendent d'API et d'accords avec Meta/TikTok.
- Générateurs de légendes et d'idées IA, outils SEO annexes (générateurs de hashtags, de noms, etc.).
- Agency/Enterprise (équipes, plusieurs profils, contrats).
- Applications iOS et Android natives.

## Size

Screens 9 (3 vus), flows 6 (1 vu), entities 7 (4 solides). Hard parts : statistiques de clics fiables sans fausser les chiffres (anti-bot, dédoublonnage), rendu de la page publique rapide et indexable, vérification de propriété des comptes, collecte de contacts conforme RGPD. Size: **S** pour la page publique + éditeur + clics basiques (un week-end) ; **M** si on ajoute thèmes avancés, e-mails et analytics détaillés. Le reste (Earn, planification) est hors périmètre, pas « difficile ».
