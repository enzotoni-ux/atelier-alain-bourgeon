# Éco-conception — informations à récolter pour l'Atelier Alain Bourgeon

Audit réalisé le 17/11/2026 sur le **code du dépôt** (14 pages publiques), pas sur le site en ligne : aucune mesure de transfert réel n'a été faite. Les poids ci-dessous sont ceux des fichiers du dépôt.

Hypothèse de travail : le projet couvre **le site web ET le produit/l'atelier**. Si ton cadre se limite au site, ne garde que les blocs 1 à 5. Si le référentiel imposé est précis (RGESN, EcoIndex, ACV simplifiée…), dis-le : l'ordre de priorité change.

Légende : 🔴 bloquant pour le projet · 🟠 important · 🟢 utile · **Qui** = qui peut fournir l'info (Toi / Alain / Outil).

---

## 0. Cadrage du projet (à trancher AVANT de collecter)

- [ ] 🔴 **Périmètre** : site seul, ou site + produit + emballage + livraison ? — Qui : Toi
- [ ] 🔴 **Référentiel / méthode** exigé par ta formation (RGESN, 115 bonnes pratiques, EcoIndex, GR491, ACV simplifiée…) — Qui : Toi
- [ ] 🔴 **Unité fonctionnelle** : ex. « une visite du site de 3 pages » ou « une maquette de 15 cm livrée en France » — Qui : Toi
- [ ] 🟠 **Objectif chiffré** (ex. −30 % de poids de page) et date de rendu — Qui : Toi
- [ ] 🔴 **État « avant » à figer maintenant** : captures des scores/poids avant toute modification, sinon aucune comparaison avant/après possible — Qui : Toi + Outil

## 1. Mesures du site en ligne (rien n'existe dans le dépôt)

À faire sur l'URL publique, **page par page**, cache vidé, une fois en mobile et une fois en desktop. Pages à mesurer en priorité : `index`, `boutique`, `produit-manoir` (a la vidéo), `blog` (vidéo), `contact` (3 tiers), `panier`.

- [ ] 🔴 Poids transféré total (Ko) — DevTools > Réseau — Outil
- [ ] 🔴 Nombre de requêtes HTTP — DevTools — Outil
- [ ] 🔴 Score **EcoIndex** + note A–G, taille du DOM, requêtes, poids (ecoindex.fr) — Outil
- [ ] 🟠 Émissions CO₂ par visite (websitecarbon.com) — Outil
- [ ] 🟠 **Lighthouse** : performance, accessibilité, bonnes pratiques, SEO — Outil
- [ ] 🟠 Extension **GreenIT-Analysis** (détail par bonne pratique) — Outil
- [ ] 🟢 Test throttling « 3G lente » : temps avant contenu visible — Outil
- [ ] 🟢 Vérifier que le serveur envoie bien **gzip/brotli** et des **en-têtes de cache** sur images/CSS/JS — DevTools > en-têtes de réponse — Outil

Repères tirés du dépôt (à confirmer par la mesure) :

| Page | Contenu lourd connu |
|---|---|
| Accueil | 4 photos WebP ≈ 810 Ko + wabi.css 36 Ko + 17 Ko de JS + 3 familles de polices Google + widget Chatbase |
| Fiche Manoir | vidéo `VIDEO_manoir_360.mp4` **1,3 Mo en lecture automatique** + 4 photos (≈ 790 Ko) |
| Journal | vidéo tour 0,65 Mo en lecture automatique |
| Contact | formulaire Jotform (iframe) + Google Maps (iframe) + Cloudflare Turnstile |

## 2. Hébergement et infrastructure — informations contradictoires

Le dépôt dit deux choses : les mentions légales, le sitemap et les canonical annoncent **GitHub Pages**, mais `api/contact.js` et `api/upload.js` (fonctions serverless + `@vercel/blob`) ne tournent que sur **Vercel**. Une des deux est fausse, ou les deux sont utilisées.

- [ ] 🔴 **Où le site est réellement servi** (URL de production, GitHub Pages ou Vercel) — Qui : Toi
- [ ] 🔴 **Région des serveurs / datacenters** (Vercel : région des fonctions ; GitHub Pages : CDN Fastly) — Outil / doc de l'hébergeur
- [ ] 🟠 **Énergie / engagement renouvelable** de l'hébergeur : à chercher dans leur rapport environnemental, pas à supposer — Outil
- [ ] 🟠 Hébergeur du **nom de domaine et des e-mails** `bourgeonalain.fr` — Qui : Alain / Toi
- [ ] 🟢 Vérificateur d'hébergement vert (Green Web Foundation) sur le domaine — Outil
- [ ] 🟢 Corriger les mentions légales si l'hébergeur réel est Vercel — Toi

## 3. Services tiers (chaque tiers = requêtes + données + hébergement hors de ton contrôle)

| Service | Où | À récolter |
|---|---|---|
| Google Fonts (Instrument Serif, Caveat, Archivo — 3 familles, `@import` dans `wabi.css`) | toutes pages | poids réel des fichiers de police téléchargés ; utilisation réelle des graisses |
| Chatbase (chatbot) | accueil, atelier, boutique | poids du script chargé ; nb de conversations/mois ; utilité réelle (les visiteurs s'en servent-ils ?) |
| Jotform (iframe + `for-form-embed-handler.js`) | contact | poids de l'iframe ; le formulaire demande les autorisations caméra, micro et géolocalisation (`allow=` dans l'iframe) : sont-elles nécessaires ? |
| Google Maps (iframe) | contact, carte | poids ; alternative statique (adresse + lien) |
| Cloudflare Turnstile | contact | poids ; nécessaire si Jotform filtre déjà le spam ? |
| Airtable, Resend, Vercel Blob, Make | back-office | volume de stockage ; fichiers clients conservés ou purgés ? durée de conservation |

- [ ] 🟠 Pour chaque service : **nécessaire / remplaçable / supprimable** — Qui : Toi, avec Alain
- [ ] 🟠 Combien de **photos/plans clients** sont stockés (Blob, Airtable), pour quelle durée — Qui : Alain / Outil

## 4. Audience et usage (impossible à calculer l'impact sans)

Le site n'a **aucun outil de mesure d'audience**. Le « compteur de visites » de l'accueil est **factice** : il part de 1287 et s'incrémente dans le `localStorage` du navigateur du visiteur (`wabi-visit-counter.js`). Il ne mesure rien et ne doit pas servir de donnée.

- [ ] 🔴 Visiteurs et pages vues par mois — hébergeur (analytics Vercel, logs) — Outil
- [ ] 🟠 Part mobile / desktop, pays, pages les plus vues — Outil
- [ ] 🟠 Nombre de commandes et de demandes de devis par mois — Airtable — Qui : Alain
- [ ] 🟢 Taux de rebond / pages jamais visitées (candidates à suppression) — Outil
- [ ] 🟢 Décider si on retire le faux compteur (honnêteté + 1 script en moins)

## 5. Contenus, médias et code

Constats du dépôt :
- **8 PNG non utilisés ≈ 6,5 Mo** (`IMG_2026*-clean.png`) + 6 WebP non référencés ≈ 0,67 Mo (dont `IMG_tourdesert_wip.webp`), tous dans le dépôt.
- `script.js` (50 Ko) et `styles.css` (34 Ko) ne sont **chargés par aucune page** : code mort.
- Sur les 37 balises `<img>` du site : **0** a `loading="lazy"`, **0** a `width`/`height`.
- Les fiches produit chargent les **3 photos** « vous aimerez aussi » (≈ 640 Ko) même hors écran.
- 2 vidéos en `autoplay loop` (bouton pause présent, mais lecture par défaut) ; pas d'attribut `preload`.
- Pages de test publiques : `test-chatbase.html`, `qr.html` ; `_archive-style-architecte/` exclu du robots mais présent.

À récolter :
- [ ] 🟠 **Photos originales** (résolution, nombre) : combien de nouvelles photos sont prévues ? — Alain
- [ ] 🟠 Décision sur les fichiers non utilisés : supprimer, ou archiver hors dépôt — Toi
- [ ] 🟠 Vidéos : durée, résolution d'origine, nécessité réelle du lancement automatique — Toi
- [ ] 🟢 Polices : combien de graisses réellement utilisées (Caveat 500/600/700 ?) — Outil
- [ ] 🟢 Contraste et version sombre : déjà prévus (`prefers-color-scheme`, `prefers-reduced-motion`) — à noter comme point positif dans ton audit

## 6. Le produit — matières (le gros manque : rien de vérifiable sur le site)

Le site se contredit : la page Atelier annonce « bois, laiton, résine » et « matériaux nobles », les fiches produit disent « mousse, plâtre & feuillage », « carton bois & balsa », « pierre reconstituée ». La page Atelier liste aussi « lierre, mousse, herbe » comme « végétation » sans préciser si c'est naturel ou synthétique.

Pour **chacun des 4 modèles** (Chaumière, Colombages, Ruine, Manoir) + l'édition limitée Wagram :

- [ ] 🔴 **Liste exhaustive des matériaux** avec **masse approximative** par pièce (g) — Alain (peser une pièce finie)
- [ ] 🔴 **Origine de chaque matériau** : récupération, achat neuf ; fournisseur ; distance — Alain
- [ ] 🔴 Végétation : **naturelle (cueillie ? où ?) ou synthétique** — Alain
- [ ] 🟠 **Colles, peintures, vernis, patines** : marque, composition, base eau ou solvant, fiche de données de sécurité — Alain
- [ ] 🟠 **Chutes et déchets** par pièce, ce qui est réutilisé / jeté / trié — Alain
- [ ] 🟠 **Durée de vie** attendue, réparabilité, entretien — Alain
- [ ] 🟠 **Fin de vie** : le produit se démonte-t-il ? matières séparables ? — Alain
- [ ] 🟢 Temps de fabrication par modèle (h) — Alain
- [ ] 🟢 Nombre de pièces produites par an, **invendus / pièces ratées** — Alain

## 7. Atelier et énergie

- [ ] 🟠 Fournisseur d'électricité et offre (verte ou non) ; consommation annuelle de l'atelier — facture — Alain
- [ ] 🟠 Chauffage de l'atelier (type, énergie) — Alain
- [ ] 🟠 Outillage électrique (poste, puissance, heures d'utilisation) ; éclairage ; séchage/cuisson éventuels — Alain
- [ ] 🟢 Eau (peinture, plâtre : rejets) — Alain
- [ ] 🟢 Déplacements d'approvisionnement (km, véhicule, fréquence) — Alain
- [ ] 🟢 Équipement informatique de l'atelier (ordinateur, téléphone, âge) — Alain

## 8. Emballage et livraison

Site : « boîte sur-mesure, mousse de protection », option « papier kraft, ficelle et carte manuscrite (+2 €) », livraison France 5–10 j, UE 8–15 j, reste du monde sur devis.

- [ ] 🔴 **Matière de la boîte** (carton neuf / recyclé), dimensions, masse — Alain
- [ ] 🔴 **Matière de la « mousse de protection »** (plastique ? papier ? amidon ?) — c'est probablement le point le plus fort ou le plus faible de l'emballage — Alain
- [ ] 🟠 **Transporteur** et mode (Colissimo, Mondial Relay, autre), gamme éventuelle bas carbone — Alain
- [ ] 🟠 Poids d'un colis complet ; répartition France / UE / monde des expéditions — Alain
- [ ] 🟠 **Taux de casse et de retours** (un retour double l'impact transport) — Alain
- [ ] 🟢 Réutilisation d'emballages reçus ? — Alain
- [ ] 🟢 Papier et encre des documents joints (carte, facture papier ou PDF) — Alain

## 9. Communication environnementale — absente du site

Aucune page, aucune phrase sur la démarche environnementale. Seule mention : « Bretagne », « fait main », « matériaux nobles ».

- [ ] 🟠 Ce qu'Alain **peut affirmer avec preuve** (origine locale, récupération, matériaux naturels) — Alain
- [ ] 🟠 Preuves disponibles (factures, fiches fournisseur, photos de l'atelier) — Alain
- [ ] 🟠 **Ne rien afficher que tu ne puisses justifier** : un « éco-responsable » sans justificatif relève du greenwashing (loi Climat et Résilience, 2021) — à intégrer à ton audit
- [ ] 🟢 Où afficher la démarche : page dédiée, ligne sur chaque fiche produit, ou rien tant que les chiffres manquent
- [ ] 🟢 Accessibilité : alternatives textuelles présentes sur les images principales, à auditer page par page (éco-conception et accessibilité se recoupent)

---

## Ordre de collecte recommandé

1. **Cette semaine, avant toute modification** : bloc 0 (cadrage) + bloc 1 (mesures « avant »). C'est ce qui rend le projet défendable.
2. **Une seule conversation avec Alain** : blocs 6, 7, 8 (matériaux, énergie, emballage). Prévoir de peser une pièce et de photographier une boîte emballée.
3. **Ensuite** : blocs 2, 3, 4 (hébergement, tiers, audience), qui dépendent de l'accès aux comptes.
4. **En dernier** : blocs 5 et 9, une fois les chiffres en main.

## Ce que cet audit ne dit pas

- Aucune mesure sur le site en ligne : tous les poids viennent du dépôt.
- Le référentiel de ton projet m'est inconnu : j'ai pris un périmètre large par prudence.
- Je ne sais pas si GitHub Pages ou Vercel sert la production.
