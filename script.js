/* ============================================
   ATELIER BOURGEON ALAIN — Script global
   ============================================ */

/* ============================================
   PANIER — stocké dans localStorage, partagé entre toutes les pages
   Structure : [{ id, name, price, image, qty }]
   ============================================ */
const CART_KEY = 'bourgeonalain_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) existing.qty += item.qty;
  else cart.push(item);
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function updateCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty = Math.max(1, qty);
  saveCart(cart);
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartCount() {
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

/* --- Loader de page : évite le flash de contenu au chargement --- */
document.documentElement.classList.add('js-loading');
document.body?.classList.add('is-loading');

document.addEventListener('DOMContentLoaded', () => {

  updateCartCount();

  /* --- Bouton retour en haut, avec halo lumineux --- */
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Remonter en haut de la page');
  backToTop.innerHTML = '↑';
  document.body.appendChild(backToTop);
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* --- Sélecteur de langue FR / EN avec drapeaux, en haut à gauche --- */
  const headerInner = document.querySelector('.header-inner');
  if (headerInner) {
    const langSwitch = document.createElement('div');
    langSwitch.className = 'lang-switch';
    langSwitch.innerHTML = `
      <button data-lang-btn="fr" aria-label="Français">
        <svg class="flag-icon" viewBox="0 0 3 2" width="22" height="15"><rect width="1" height="2" x="0" fill="#0055A4"/><rect width="1" height="2" x="1" fill="#FFFFFF"/><rect width="1" height="2" x="2" fill="#EF4135"/></svg>
      </button>
      <button data-lang-btn="en" aria-label="English">
        <svg class="flag-icon" viewBox="0 0 60 30" width="22" height="15">
          <rect width="60" height="30" fill="#00247d"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#cf142b" stroke-width="2"/>
          <path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/>
          <path d="M30,0 V30 M0,15 H60" stroke="#cf142b" stroke-width="6"/>
        </svg>
      </button>
    `;
    headerInner.prepend(langSwitch);
  }

  const TRANSLATIONS = {
    "Accueil": "Home", "Boutique": "Shop", "L'Atelier": "The Workshop", "Contact": "Contact",
    "Accueil / Boutique": "Home / Shop", "Accueil / CGV": "Home / Terms of sale",
    "Accueil / Contact": "Home / Contact", "Accueil / L'Atelier": "Home / The Workshop",
    "Accueil / Livraison & retours": "Home / Shipping & returns",
    "Accueil / Mentions légales": "Home / Legal notice", "Accueil / Panier": "Home / Cart",
    "Découvrir la boutique": "Discover the shop", "Notre savoir-faire": "Our craftsmanship",
    "Ajouter au panier": "Add to cart", "♡ Favoris": "♡ Wishlist",
    "Voir toute la boutique →": "View full shop →", "Voir toute\nla boutique →": "View full\nshop →",
    "Collections signature": "Signature collections", "Nos univers": "Our worlds",
    "Pièces emblématiques": "Signature pieces", "Sélection": "Selection",
    "Fait main": "Handmade", "Fait main en France": "Handmade in France",
    "Maisons en pierre": "Stone houses", "Maisons à colombages": "Timber-framed houses",
    "Sur-mesure": "Custom-made", "Sur devis": "On request",
    "Restez proche de l'atelier": "Stay close to the workshop",
    "S'inscrire": "Subscribe", "Passer la commande": "Checkout",
    "Continuer mes achats": "Continue shopping", "Votre panier": "Your cart",
    "Votre panier est vide pour le moment.": "Your cart is currently empty.",
    "Total": "Total", "Envoyer le message": "Send message",
    "Contactez l'atelier": "Contact the workshop", "Navigation": "Navigation",
    "Informations": "Information", "Livraison & retours": "Shipping & returns",
    "Mentions légales": "Legal notice", "CGV": "Terms of sale",

    "Atelier Bourgeon Alain": "Atelier Bourgeon Alain",
    "Atelier Bourgeon Alain — Miniatures de bâtiments historiques faites main": "Atelier Bourgeon Alain — Handmade miniature historical buildings",
    "Boutique — Atelier Bourgeon Alain": "Shop — Atelier Bourgeon Alain",
    "Contact — Atelier Bourgeon Alain": "Contact — Atelier Bourgeon Alain",
    "L'Atelier — Atelier Bourgeon Alain": "The Workshop — Atelier Bourgeon Alain",
    "Livraison & Retours — Atelier Bourgeon Alain": "Shipping & Returns — Atelier Bourgeon Alain",
    "Mentions légales — Atelier Bourgeon Alain": "Legal notice — Atelier Bourgeon Alain",
    "Conditions Générales de Vente — Atelier Bourgeon Alain": "Terms of Sale — Atelier Bourgeon Alain",
    "Panier — Atelier Bourgeon Alain": "Cart — Atelier Bourgeon Alain",
    "Chaumière de Pierre — Atelier Bourgeon Alain": "Stone Cottage — Atelier Bourgeon Alain",
    "Maison à Colombages — Atelier Bourgeon Alain": "Timber-Framed House — Atelier Bourgeon Alain",
    "Ferme en Ruine — Atelier Bourgeon Alain": "Ruined Farm — Atelier Bourgeon Alain",

    "Miniatures de bâtiments historiques faites main": "Handmade miniature historical buildings",
    "Maquettes d'architecture façonnées à la main, pour les amateurs d'objets rares.": "Architectural models handcrafted for collectors of rare objects.",
    "Chaque miniature de l'Atelier Bourgeon Alain — maison en pierre, chaumière ou bâtisse à colombages — est façonnée, peinte et végétalisée à la main pour donner vie à vos dioramas et collections.":
      "Each miniature from Atelier Bourgeon Alain — stone house, cottage or timber-framed building — is handcrafted, hand-painted and hand-landscaped to bring your dioramas and collections to life.",

    "1 pièce": "1 piece", "2 pièces": "2 pieces",
    "15 €": "€15", "0 €": "€0",
    "1/72": "1/72",
    "/ pièce — 100% fait main": "/ piece — 100% handmade",
    "4 à 5 jours ouvrés": "4 to 5 business days",
    "Chaumière de Pierre": "Stone Cottage", "Maison à Colombages": "Timber-Framed House",
    "Ferme en Ruine": "Ruined Farm",
    "Collection Maisons en pierre": "Stone Houses Collection",
    "Collection Maisons à colombages": "Timber-Framed Houses Collection",
    "Mousse, plâtre & feuillage": "Moss, plaster & foliage",
    "Mousse, plâtre & clôture bois": "Moss, plaster & wooden fence",
    "Carton bois & balsa peint": "Wood board & painted balsa",
    "Échelle": "Scale", "État": "Condition", "Intacte": "Intact", "En ruine": "Ruined",
    "Version en ruine": "Ruined version", "Version intacte": "Intact version",
    "Pièce unique faite main — expédition sous 4 à 5 jours": "One-of-a-kind handmade piece — shipped within 4 to 5 days",
    "Pièce unique faite main — expédition sous [délai à préciser]": "One-of-a-kind handmade piece — shipped within [delay to be specified]",
    "Dimensions : 12 × 8 × 7 cm (socle inclus). Structure en mousse/carton, enduit type plâtre, feuillage synthétique et lierre peint à la main. Socle peint.":
      "Dimensions: 12 × 8 × 7 cm (base included). Foam/cardboard structure, plaster-type coating, synthetic foliage and hand-painted ivy. Painted base.",
    "Dimensions : 14 × 10 × 9 cm (socle inclus). Structure en mousse/carton, enduit type plâtre, feuillage automnal, clôture en bois véritable, socle enherbé.":
      "Dimensions: 14 × 10 × 9 cm (base included). Foam/cardboard structure, plaster-type coating, autumn foliage, real wooden fence, grassy base.",
    "Dimensions : 6 × 5 × 15 cm (socle inclus). Structure en carton bois et balsa, peinture acrylique, toit en tuiles miniatures, lierre synthétique.":
      "Dimensions: 6 × 5 × 15 cm (base included). Wood board and balsa structure, acrylic paint, miniature tile roof, synthetic ivy.",
    "[Dimensions à préciser]. Structure en mousse/carton, enduit type plâtre, feuillage synthétique et lierre peint à la main. Socle peint.":
      "[Dimensions to be specified]. Foam/cardboard structure, plaster-type coating, synthetic foliage and hand-painted ivy. Painted base.",
    "Chaque pierre est sculptée puis peinte à la main, la végétation posée brin par brin dans notre atelier. Comptez environ 4 heures de travail par pièce.":
      "Each stone is hand-sculpted and painted, with vegetation applied blade by blade in our workshop. Allow around 4 hours of work per piece.",
    "Chaque pierre est sculptée puis peinte à la main, la végétation posée brin par brin dans notre atelier. [Temps de fabrication à préciser].":
      "Each stone is hand-sculpted and painted, with vegetation applied blade by blade in our workshop. [Production time to be specified].",
    "Ossature à colombages reconstituée poutre par poutre, puis peinte et patinée à la main. Comptez environ 5 heures de travail par pièce.":
      "Timber frame rebuilt beam by beam, then hand-painted and weathered. Allow around 5 hours of work per piece.",
    "Les effets de ruine (toit percé, pierres effondrées) sont sculptés à la main pour un rendu réaliste, puis végétalisés brin par brin. Comptez environ 6 heures de travail par pièce.":
      "The ruined effects (broken roof, collapsed stones) are hand-sculpted for a realistic result, then hand-landscaped blade by blade. Allow around 6 hours of work per piece.",
    "Emballage protecteur avec calage intérieur. Expédition sous 4 à 5 jours ouvrés.": "Protective packaging with interior padding. Shipped within 4 to 5 business days.",
    "Emballage protecteur avec calage intérieur, notamment pour la clôture en bois. Expédition sous 4 à 5 jours ouvrés.":
      "Protective packaging with interior padding, especially for the wooden fence. Shipped within 4 to 5 business days.",
    "Emballage protecteur adapté à la fragilité de la pièce. [Détails de livraison à préciser].": "Protective packaging suited to the fragility of the piece. [Shipping details to be specified].",
    "Dépoussiérer à l'aide d'un pinceau doux. Éviter l'exposition directe et prolongée au soleil pour préserver les couleurs.":
      "Dust with a soft brush. Avoid prolonged direct sunlight to preserve the colours.",
    "Une chaumière en pierre grise entièrement recouverte de lierre et de mousse végétale, entourée d'un muret de pierre. Chaque bloc de pierre, chaque touche de végétation est façonnée et posée à la main pour un rendu réaliste, idéal pour une collection ou un diorama.":
      "A grey stone cottage entirely covered in ivy and moss, surrounded by a low stone wall. Every stone block and every touch of vegetation is handcrafted and placed by hand for a realistic result, ideal for a collection or diorama.",
    "Une bâtisse médiévale à pans de bois noirs et façade blanche, sur trois niveaux, avec toit d'ardoise miniature et lierre grimpant sur la façade. Chaque poutre est peinte à la main pour reproduire l'authenticité du colombage traditionnel.":
      "A three-storey medieval building with black timber framing and a white facade, a miniature slate roof, and ivy climbing the front. Each beam is hand-painted to reproduce the authenticity of traditional timber framing.",
    "Une ferme en pierre à l'abandon, toit percé et pans de mur effondrés, envahie par une végétation d'automne. Entourée d'une clôture en bois faite main, cette pièce d'exception apporte une atmosphère narrative forte à toute collection ou diorama.":
      "An abandoned stone farm, with a broken roof and collapsed wall sections, overrun by autumn vegetation. Surrounded by a handmade wooden fence, this exceptional piece brings a strong narrative atmosphere to any collection or diorama.",

    "Avis clients": "Customer reviews", "Ce qu'en disent nos clients": "What our customers say",
    "Achat vérifié": "Verified purchase",
    "Basé sur 24 avis vérifiés": "Based on 24 verified reviews",
    "Basé sur 17 avis vérifiés": "Based on 17 verified reviews",
    "Basé sur 12 avis vérifiés": "Based on 12 verified reviews",
    "(24 avis)": "(24 reviews)", "(17 avis)": "(17 reviews)", "(12 avis)": "(12 reviews)",
    "Note moyenne (53 avis)": "Average rating (53 reviews)",
    "4.9/5": "4.9/5", "4.8/5": "4.8/5",
    "Camille R.": "Camille R.", "Julien M.": "Julien M.", "Sophie D.": "Sophie D.",
    "Thomas L.": "Thomas L.", "Marion P.": "Marion P.", "Nicolas B.": "Nicolas B.",
    "Élodie V.": "Élodie V.", "Antoine G.": "Antoine G.", "Camille F.": "Camille F.",
    "Juillet 2026": "July 2026", "Juin 2026": "June 2026", "Mai 2026": "May 2026", "Août 2026": "August 2026",
    "Le niveau de détail sur la mousse et le lierre est bluffant. Une pièce magnifique pour ma collection.":
      "The level of detail on the moss and ivy is stunning. A beautiful piece for my collection.",
    "Emballage impeccable, aucune casse. La pièce est encore plus belle en vrai qu'en photo.":
      "Impeccable packaging, no damage. The piece is even more beautiful in person than in the photos.",
    "Très joli rendu, un vrai coup de cœur. Le délai de livraison était un peu juste mais ça valait l'attente.":
      "Really lovely result, a true favourite. The delivery time was a bit tight but it was worth the wait.",
    "Les colombages sont peints avec une précision incroyable, un vrai travail d'orfèvre.":
      "The timber framing is painted with incredible precision, real craftsmanship.",
    "Parfaite pour compléter mon diorama médiéval, la patine est superbe.":
      "Perfect to complete my medieval diorama, the weathering finish is superb.",
    "Très belle pièce, j'aurais aimé un peu plus d'informations sur l'échelle avant l'achat.":
      "Very nice piece, I would have liked a bit more information about the scale before buying.",
    "L'effet de ruine est saisissant de réalisme, on sent vraiment l'histoire de la ferme.":
      "The ruined effect is strikingly realistic, you can really feel the farm's history.",
    "Une pièce pleine de caractère, la clôture en bois apporte un vrai plus à la scène.":
      "A piece full of character, the wooden fence really adds to the scene.",
    "Coup de cœur total, j'en commande une deuxième pour un ami passionné de maquettes.":
      "Absolute favourite, I'm ordering a second one for a friend who loves model-making.",

    "Toutes nos maquettes": "All our models", "Trier par : Nouveautés": "Sort by: Newest",
    "Popularité": "Popularity", "Prix croissant": "Price: low to high", "Prix décroissant": "Price: high to low",
    "Tout": "All", "Autre": "Other",
    "Votre sélection": "Your selection",
    "D'autres pièces arrivent bientôt dans la boutique. [À personnaliser au fil de vos créations]":
      "More pieces are coming soon to the shop. [To personalise as your creations grow]",
    "Vous aimerez aussi": "You may also like", "Autres pièces de la collection": "Other pieces in the collection",

    "L'art de sculpter l'architecture": "The art of sculpting architecture",
    "Une passion transmise, un geste précis": "A passion passed down, a precise craft",
    "De l'esquisse à la maquette": "From sketch to model",
    "Notre histoire": "Our story",
    "[À personnaliser] Fondé par Alain Bourgeon, l'atelier est né d'une fascination pour les volumes et les proportions de l'architecture. Ce qui a commencé comme la reproduction d'un bâtiment familial est devenu un métier : donner corps, à petite échelle, aux idées des architectes.":
      "[To personalise] Founded by Alain Bourgeon, the workshop was born from a fascination with the volumes and proportions of architecture. What began as the reproduction of a family building became a craft: giving shape, at a small scale, to architects' ideas.",
    "[À personnaliser] Aujourd'hui, chaque maquette qui sort de l'atelier porte cette exigence : fidélité aux proportions, choix des matériaux nobles, finitions manuelles. Rien n'est standardisé — chaque commande est une nouvelle étude.":
      "[To personalise] Today, every model that leaves the workshop carries this same standard: faithful proportions, carefully chosen materials, handmade finishes. Nothing is standardised — every order is a new study.",
    "Depuis [année de création]": "Since [founding year]",
    "Alain Bourgeon — Fondateur": "Alain Bourgeon — Founder",
    "« Nous ne construisons pas des objets. Nous condensons, à l'échelle d'une main, l'intention d'un architecte. »":
      "\u201cWe do not build objects. We condense, at the scale of a hand, an architect's intention.\u201d",
    "Méthode": "Method", "Étude": "Study", "Découpe": "Cutting", "Assemblage": "Assembly", "Finition": "Finishing",
    "Analyse des plans, photos ou références du bâtiment à reproduire, et définition de l'échelle.":
      "Analysis of the plans, photos or references of the building to reproduce, and definition of the scale.",
    "Découpe précise des matériaux (bois, laiton, résine) selon les plans techniques établis.":
      "Precise cutting of materials (wood, brass, resin) according to established technical plans.",
    "Montage minutieux de chaque élément, à la main, sous loupe binoculaire pour les détails fins.":
      "Meticulous assembly of each element, by hand, under a binocular magnifier for fine details.",
    "Patine, vernis et contrôle qualité avant emballage sur-mesure et expédition.":
      "Weathering, varnish and quality control before custom packaging and shipping.",
    "Des matériaux choisis avec exigence": "Carefully selected materials",
    "Bois massif, laiton, résine et plâtre sélectionnés avec soin.": "Solid wood, brass, resin and plaster selected with care.",
    "Matières": "Materials", "Bois & colombages": "Wood & timber framing", "Pierre & mousse": "Stone & moss",
    "Végétation": "Vegetation", "Lierre, mousse, herbe": "Ivy, moss, grass",
    "Ossatures peintes": "Painted frames", "Pans de bois noirs": "Black timber sections",
    "Nous réalisons aussi des maquettes sur-mesure": "We also create custom models",
    "Décrivez-nous votre bâtiment ou votre projet architectural : notre atelier étudie sa faisabilité et vous propose un devis personnalisé.":
      "Tell us about your building or architectural project: our workshop will study its feasibility and offer you a personalised quote.",
    "Discuter de mon projet": "Discuss my project", "Un projet architectural en tête ?": "An architectural project in mind?",
    "Résidentiel": "Residential", "Monuments": "Monuments", "Urbanisme": "Urban planning",

    "Une question, une commande, un projet sur-mesure ?": "A question, an order, a custom project?",
    "Notre atelier vous répond sous 48 h. Pour les demandes de maquettes personnalisées, joignez si possible des plans ou photos du bâtiment concerné.":
      "Our workshop replies within 48 hours. For custom model requests, please attach plans or photos of the building if possible.",
    "Prénom": "First name", "Nom": "Last name", "Email": "Email", "Téléphone": "Phone",
    "Type de demande": "Type of request", "Question sur une pièce de la boutique": "Question about a shop item",
    "Projet de maquette sur-mesure": "Custom model project", "Suivi de commande": "Order tracking",
    "Votre message": "Your message", "Informations légales": "Legal information",
    "Martigné-Ferchaud, 35640, Ille-et-Vilaine — France [adresse précise à compléter]":
      "Martigné-Ferchaud, 35640, Ille-et-Vilaine — France [exact address to be completed]",
    "Horaires": "Opening hours", "Du lundi au vendredi, 9h – 18h (sur rendez-vous)": "Monday to Friday, 9am – 6pm (by appointment)",
    "Les visites sont possibles sur rendez-vous. Écrivez-nous pour convenir d'un créneau.":
      "Visits are possible by appointment. Write to us to arrange a time.",
    "Questions fréquentes": "Frequently asked questions",
    "Délais d'expédition": "Shipping times",
    "Chaque pièce étant fabriquée à la main, le délai d'expédition est de 4 à 5 jours ouvrés à compter de la validation de la commande. Les frais et modalités de livraison sont précisés lors de la commande.":
      "As each piece is handmade, the shipping time is 4 to 5 business days from order confirmation. Delivery fees and terms are shown at checkout.",
    "Zones de livraison": "Delivery areas",
    "[À personnaliser] Livraison en France métropolitaine. Livraison internationale possible sur demande — contactez-nous pour un devis d'expédition adapté.":
      "[To personalise] Delivery within mainland France. International delivery possible on request — contact us for a suitable shipping quote.",
    "Retours": "Returns",
    "Comptez 2 à 3 semaines pour les pièces du catalogue, et 6 à 10 semaines pour une maquette sur-mesure selon sa complexité.":
      "Allow 2 to 3 weeks for catalogue pieces, and 6 to 10 weeks for a custom model depending on its complexity.",
    "Pièce endommagée à la livraison ?": "Piece damaged on delivery?",
    "Contactez-nous sous 48h avec des photos de la pièce et de l'emballage. Nous étudierons un remplacement ou un remboursement dans les meilleurs délais.":
      "Contact us within 48 hours with photos of the piece and the packaging. We will consider a replacement or refund as quickly as possible.",
    "Sur-mesure possible": "Custom-made possible",
    "[À personnaliser] Oui, avec un emballage renforcé adapté au transport longue distance. Contactez-nous pour un devis de livraison.":
      "[To personalise] Yes, with reinforced packaging suited to long-distance transport. Contact us for a delivery quote.",
    "Un projet précis en tête ?": "A specific project in mind?",
    "Nous étudions toutes les demandes de maquettes sur-mesure.": "We consider all requests for custom models.",
    "Demander un devis": "Request a quote",
    "Un projet architectural précis ? Nous le reproduisons à l'échelle.": "A specific architectural project? We reproduce it to scale.",

    "Livraison & retours": "Shipping & returns",
    "Livraison soignée": "Careful shipping",
    "Chaque pièce est protégée par un emballage avec calage intérieur sur-mesure, pensé pour la fragilité des éléments (toitures, végétation, clôtures) et le transport.":
      "Each piece is protected by custom packaging with interior padding, designed for the fragility of the elements (roofs, vegetation, fences) and transport.",
    "Après votre commande": "After your order",
    "Toute commande passée sur le site fait l'objet d'une confirmation par email. [À ce stade, le site est une vitrine de démonstration : le paiement en ligne n'est pas encore activé — à connecter à une solution de paiement (Stripe, PayPal...) avant mise en production.]":
      "Every order placed on the site is confirmed by email. [At this stage, the site is a demo showcase: online payment is not yet enabled — to be connected to a payment solution (Stripe, PayPal...) before going live.]",
    "Retours et garanties": "Returns and warranties",
    "Toute pièce reçue endommagée doit être signalée sous 48h avec photos à l'appui, à l'adresse [email de contact à personnaliser]. Un remplacement ou remboursement sera étudié au cas par cas.":
      "Any piece received damaged must be reported within 48 hours with supporting photos, to the address [contact email to be personalised]. A replacement or refund will be considered case by case.",
    "Emballage sur-mesure pensé pour la fragilité de chaque maquette.": "Custom packaging designed for the fragility of each model.",
    "Frais de livraison calculés à l'étape suivante. Expédition sous 4 à 5 jours ouvrés.": "Shipping costs calculated at the next step. Shipped within 4 to 5 business days.",

    "Conditions Générales de Vente": "Terms of Sale", "Conditions de vente": "Terms of sale",
    "Les présentes conditions générales de vente régissent les ventes de miniatures et maquettes faites main proposées par l'Atelier Bourgeon Alain sur ce site. Toute commande implique l'acceptation sans réserve des présentes CGV.":
      "These terms of sale govern the sale of handmade miniatures and models offered by Atelier Bourgeon Alain on this site. Any order implies unreserved acceptance of these terms.",
    "Ce document est un modèle générique fourni à titre indicatif. Il est recommandé de le faire valider par un professionnel du droit avant mise en ligne définitive, notamment une fois le paiement en ligne activé.":
      "This document is a generic template provided for guidance. It is recommended to have it validated by a legal professional before final publication, especially once online payment is enabled.",
    "Ce document est un modèle générique fourni à titre indicatif. Il est recommandé de le faire valider par un professionnel du droit avant mise en ligne définitive.":
      "This document is a generic template provided for guidance. It is recommended to have it validated by a legal professional before final publication.",
    "1. Objet": "1. Purpose", "2. Produits et prix": "2. Products and prices", "3. Commande": "3. Orders",
    "4. Délais et livraison": "4. Delivery times", "5. Droit de rétractation": "5. Right of withdrawal",
    "6. Retours et garanties": "6. Returns and warranties", "7. Litiges": "7. Disputes",
    "Chaque pièce étant réalisée à la main, de légères variations (teinte, végétation, patine) peuvent exister entre la photo présentée et la pièce livrée : cela fait partie du caractère unique de chaque création. Les prix sont indiqués en euros, [toutes taxes comprises / à préciser selon votre statut fiscal].":
      "As each piece is handmade, slight variations (colour, vegetation, patina) may exist between the photo shown and the delivered piece: this is part of the unique character of each creation. Prices are shown in euros, [all taxes included / to be specified according to your tax status].",
    "Conformément à la législation en vigueur, vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sauf pour les pièces réalisées sur-mesure selon vos spécifications, qui ne sont pas soumises à ce droit.":
      "In accordance with current legislation, you have 14 days from receipt of your order to exercise your right of withdrawal, except for custom-made pieces made to your specifications, which are not subject to this right.",
    "En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux compétents seront ceux du lieu du siège de l'Atelier Bourgeon Alain.":
      "In the event of a dispute, an amicable solution will be sought first. Failing that, the competent courts will be those of the registered office of Atelier Bourgeon Alain.",

    "Mentions légales": "Legal notice",
    "1. Éditeur du site": "1. Site publisher", "2. Hébergement": "2. Hosting",
    "3. Propriété intellectuelle": "3. Intellectual property", "4. Données personnelles": "4. Personal data",
    "5. Cookies": "5. Cookies",
    "[Nom de l'entreprise / Alain Bourgeon]": "[Company name / Alain Bourgeon]",
    "[Adresse de l'atelier]": "[Workshop address]",
    "L'ensemble des contenus présents sur ce site (textes, photographies, illustrations, logo) est la propriété exclusive de l'Atelier Bourgeon Alain, sauf mention contraire. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable, est interdite.":
      "All content on this site (texts, photographs, illustrations, logo) is the exclusive property of Atelier Bourgeon Alain, unless otherwise stated. Any reproduction, representation, modification or use, in whole or in part, without prior written authorisation, is prohibited.",
    "Les informations recueillies via le formulaire de contact ou la newsletter sont utilisées uniquement pour répondre à vos demandes et vous tenir informé de l'actualité de l'atelier. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données, exerçable en écrivant à [email de contact à personnaliser].":
      "Information collected via the contact form or newsletter is used solely to respond to your requests and keep you informed of workshop news. In accordance with GDPR, you have the right to access, rectify and delete your data, which can be exercised by writing to [contact email to be personalised].",
    "Ce site peut utiliser des cookies techniques nécessaires à son bon fonctionnement (ex : mémorisation du panier). Aucun cookie de traçage publicitaire n'est utilisé à ce stade. [À adapter selon les outils réellement utilisés — Google Analytics, etc.]":
      "This site may use technical cookies necessary for its proper operation (e.g. remembering the cart). No advertising tracking cookies are used at this stage. [To adapt based on the tools actually used — Google Analytics, etc.]",

    "Édition limitée": "Limited edition", "Catalogue": "Catalogue",
    "Nouvelles pièces, coulisses de fabrication, éditions limitées.": "New pieces, behind-the-scenes crafting, limited editions.",
    "Maquettes livrées": "Models delivered", "Années d'atelier": "Years of workshop", "Clients satisfaits": "Satisfied customers",
    "Fabrication artisanale": "Handcrafted production", "Matériaux nobles": "Fine materials",
    "Livraison protégée": "Protected shipping",
    "Chaque pièce est réalisée dans notre atelier, à la main.": "Each piece is made by hand in our workshop.",
    "Instagram": "Instagram", "Pinterest": "Pinterest",
    "© 2026 Atelier Bourgeon Alain. Tous droits réservés.": "© 2026 Atelier Bourgeon Alain. All rights reserved.",
    "[À personnaliser] +33 0 00 00 00 00": "[To personalise] +33 0 00 00 00 00",
    "+33 0 00 00 00 00": "+33 0 00 00 00 00",
    "contact@bourgeonalain.fr": "contact@bourgeonalain.fr",
    "Avant de nous écrire": "Before writing to us", "Parlons de votre projet": "Let's talk about your project",
    "Atelier": "Workshop", "Nous confier un projet": "Entrust us with a project",
    "[Site de démonstration — le paiement en ligne n'est pas encore activé. À connecter à Stripe / PayPal avant mise en production.]":
      "[Demo site — online payment is not yet enabled. To be connected to Stripe / PayPal before going live.]",
    "Suivi de commande": "Order tracking",
    "Bougez la souris • Molette pour zoomer": "Move your mouse • Scroll to zoom",
    "Glissez pour tourner • Pincez pour zoomer": "Drag to rotate • Pinch to zoom",
    "La conception, en quelques mots": "Design, in a few words",
    "Chaque maquette naît d'une observation minutieuse du bâtiment réel, avant d'être recréée à la main, matière par matière.": "Each model begins with a careful study of the real building, before being recreated by hand, material by material.",
    "Étude": "Study", "Sculpture": "Sculpting", "Patine": "Weathering",
    "Observation des proportions et de l'architecture d'origine.": "Observation of the proportions and original architecture.",
    "Modelage de chaque volume, pierre par pierre ou poutre par poutre.": "Shaping of every volume, stone by stone or beam by beam.",
    "Vieillissement et finitions pour un rendu réaliste et vivant.": "Ageing and finishing touches for a realistic, lifelike result.",
  };

  function walkTextNodes(root, fn) {
    root.querySelectorAll('*').forEach(el => {
      if (el.closest('.page-loader')) return;
      if (el.children.length === 0 && el.textContent.trim()) fn(el);
      else if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) fn(el, true);
    });
  }

  function applyLanguage(lang) {
    document.querySelectorAll('[data-lang-btn]').forEach(b => b.classList.toggle('active', b.dataset.langBtn === lang));
    document.documentElement.lang = lang;
    if (lang === 'en') {
      walkTextNodes(document.body, (el) => {
        const key = el.textContent.trim();
        if (TRANSLATIONS[key]) {
          if (!el.dataset.origFr) el.dataset.origFr = el.textContent;
          el.textContent = el.textContent.replace(key, TRANSLATIONS[key]);
        }
      });
      document.querySelectorAll('[data-en]').forEach(el => {
        const inner = el.querySelector('span') || el;
        if (!inner.dataset.origFr) inner.dataset.origFr = inner.textContent;
        inner.textContent = el.dataset.en;
      });
    } else {
      document.querySelectorAll('[data-orig-fr]').forEach(el => { el.textContent = el.dataset.origFr; });
    }
    localStorage.setItem('site_lang', lang);
  }

  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.langBtn));
  });
  applyLanguage(localStorage.getItem('site_lang') || 'fr');

  /* --- Compteur de visites premium (simulation locale, sans backend) --- */
  const visitFooter = document.querySelector('.footer-bottom');
  if (visitFooter) {
    let count = parseInt(localStorage.getItem('ba_visit_count') || '1284', 10);
    if (!sessionStorage.getItem('ba_counted')) {
      count += 1;
      localStorage.setItem('ba_visit_count', count);
      sessionStorage.setItem('ba_counted', '1');
    }
    const counterEl = document.createElement('div');
    counterEl.className = 'visit-counter';
    counterEl.innerHTML = `<span>Visiteurs de l'atelier</span> <strong data-target="${count}">0</strong>`;
    visitFooter.insertAdjacentElement('beforebegin', counterEl);
    const strongEl = counterEl.querySelector('strong');
    const target = count;
    const start = performance.now();
    const animateCount = (now) => {
      const p = Math.min((now - start) / 1200, 1);
      strongEl.textContent = Math.floor(p * target).toLocaleString('fr-FR');
      if (p < 1) requestAnimationFrame(animateCount);
      else strongEl.textContent = target.toLocaleString('fr-FR');
    };
    requestAnimationFrame(animateCount);
  }

  /* --- Réseaux sociaux additionnels (WhatsApp, TikTok) + adresse réelle --- */
  document.querySelectorAll('.footer-social').forEach(social => {
    if (social.querySelector('[data-social="whatsapp"]')) return;
    const wa = document.createElement('a');
    wa.href = 'https://wa.me/33000000000';
    wa.target = '_blank'; wa.rel = 'noopener';
    wa.className = 'link-underline';
    wa.dataset.social = 'whatsapp';
    wa.textContent = 'WhatsApp';
    const tk = document.createElement('a');
    tk.href = 'https://www.tiktok.com/@bourgeonalain';
    tk.target = '_blank'; tk.rel = 'noopener';
    tk.className = 'link-underline';
    tk.dataset.social = 'tiktok';
    tk.textContent = 'TikTok';
    social.append(wa, tk);
  });
  document.querySelectorAll('li').forEach(li => {
    if (li.textContent.trim() === "[Adresse de l'atelier]") {
      li.textContent = 'Martigné-Ferchaud (35), France';
    }
  });

  /* --- Barre de progression de lecture --- */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = scrolled + '%';
  }, { passive: true });

  /* --- Transition "rideau" en fondu croisé entre les pages internes --- */
  const transitionEl = document.createElement('div');
  transitionEl.className = 'page-transition';
  transitionEl.innerHTML = '<span class="curtain-panel top"></span><span class="curtain-panel bottom"></span>';
  document.body.appendChild(transitionEl);

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || link.target === '_blank') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      transitionEl.classList.add('active');
      setTimeout(() => { window.location.href = href; }, 560);
    });
  });

  /* --- Bouton "Ajouter au panier" sur les fiches produit --- */
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qtyInput = document.querySelector('.qty-selector input');
      const qty = qtyInput ? parseInt(qtyInput.value || '1', 10) : 1;
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image,
        qty,
      });
      const original = btn.textContent;
      btn.textContent = 'Ajouté ✓';
      setTimeout(() => { btn.textContent = original; }, 1600);
    });
  });

  /* --- Page panier : rendu de la liste + total --- */
  const cartContainer = document.querySelector('.cart-items');
  if (cartContainer) {
    renderCart();
  }

  function renderCart() {
    const cart = getCart();
    const emptyMsg = document.querySelector('.cart-empty');
    const summary = document.querySelector('.cart-summary');
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (summary) summary.style.display = 'none';
      return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (summary) summary.style.display = 'block';

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-row-img">
        <div class="cart-row-info">
          <p class="product-name">${item.name}</p>
          <p class="product-material">${item.price} € / pièce</p>
        </div>
        <div class="qty-selector cart-row-qty">
          <button class="qty-minus" aria-label="Diminuer">−</button>
          <input type="text" value="${item.qty}" readonly>
          <button class="qty-plus" aria-label="Augmenter">+</button>
        </div>
        <span class="cart-row-total">${(item.price * item.qty).toLocaleString('fr-FR')} €</span>
        <button class="cart-row-remove" aria-label="Retirer">✕</button>
      `;
      row.querySelector('.qty-minus').addEventListener('click', () => {
        updateCartQty(item.id, item.qty - 1);
        renderCart();
      });
      row.querySelector('.qty-plus').addEventListener('click', () => {
        updateCartQty(item.id, item.qty + 1);
        renderCart();
      });
      row.querySelector('.cart-row-remove').addEventListener('click', () => {
        removeFromCart(item.id);
        renderCart();
      });
      cartContainer.appendChild(row);
    });

    const totalEl = document.querySelector('.cart-total-value');
    if (totalEl) totalEl.textContent = cartTotal().toLocaleString('fr-FR') + ' €';
  }

  /* --- Galerie produit : effet 3D interactif (tilt + zoom sur la photo) --- */
  document.querySelectorAll('.product-gallery-main').forEach(el => {
    const hint = document.createElement('span');
    hint.className = 'gallery-3d-hint';
    hint.textContent = window.matchMedia('(hover: none)').matches
      ? 'Glissez pour tourner • Pincez pour zoomer'
      : 'Bougez la souris • Molette pour zoomer';
    if ((localStorage.getItem('site_lang') || 'fr') === 'en' && TRANSLATIONS[hint.textContent]) {
      hint.dataset.origFr = hint.textContent;
      hint.textContent = TRANSLATIONS[hint.textContent];
    }
    el.appendChild(hint);

    let rotateX = 0, rotateY = 0, scale = 1;
    const maxTilt = 9;
    const minScale = 1, maxScale = 1.7;

    function applyTransform() {
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    }

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rotateY = x * maxTilt * 2;
      rotateX = -y * maxTilt * 2;
      applyTransform();
    });

    el.addEventListener('mouseleave', () => {
      rotateX = 0; rotateY = 0; scale = 1;
      applyTransform();
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      scale = Math.min(maxScale, Math.max(minScale, scale - e.deltaY * 0.0012));
      applyTransform();
    }, { passive: false });

    /* Support tactile : glisser pour incliner, pincer pour zoomer */
    let touchStartX = 0, touchStartY = 0;
    let pinchStartDist = 0, pinchStartScale = 1;

    el.addEventListener('touchstart', (e) => {
      el.classList.add('gallery-touching');
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartScale = scale;
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        rotateY = Math.max(-maxTilt * 2, Math.min(maxTilt * 2, dx * 0.3));
        rotateX = Math.max(-maxTilt * 2, Math.min(maxTilt * 2, -dy * 0.3));
        applyTransform();
        e.preventDefault();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        scale = Math.min(maxScale, Math.max(minScale, pinchStartScale * (dist / pinchStartDist)));
        applyTransform();
        e.preventDefault();
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        el.classList.remove('gallery-touching');
        rotateX = 0; rotateY = 0;
        applyTransform();
      }
    });
  });

  /* --- Tilt 3D léger : cartes produits + vignettes de galerie --- */
  function attachLightTilt(el, target, maxTilt, hoverScale) {
    target = target || el;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * maxTilt * 2;
      const rotateX = -y * maxTilt * 2;
      target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${hoverScale})`;
    });
    el.addEventListener('mouseleave', () => {
      target.style.transform = '';
    });
  }

  if (!window.matchMedia('(hover: none)').matches) {
    document.querySelectorAll('.product-image').forEach(el => {
      const img = el.querySelector('img');
      if (img) attachLightTilt(el, img, 6, 1.1);
    });
    document.querySelectorAll('.product-gallery-thumbs img').forEach(img => {
      attachLightTilt(img, img, 8, 1.15);
    });
  }

  /* --- Retrait du loader ---
     Sécurité : on retire l'écran de chargement dès que la page est chargée
     (event "load"), MAIS avec un délai de secours maximum de 1.8s au cas où
     une ressource externe (police, image) ne se chargerait jamais — par
     exemple en ouverture locale (file://) sans connexion internet stable. */
  const loader = document.querySelector('.page-loader');
  let loaderRemoved = false;
  const loaderMinDisplay = 1500; // durée mini pour laisser voir l'animation du logo
  const loaderStart = performance.now();
  function removeLoader() {
    if (loaderRemoved) return;
    const elapsed = performance.now() - loaderStart;
    if (elapsed < loaderMinDisplay) {
      setTimeout(removeLoader, loaderMinDisplay - elapsed);
      return;
    }
    loaderRemoved = true;
    document.body.classList.remove('is-loading');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 700);
    }
  }
  window.addEventListener('load', () => setTimeout(removeLoader, 400));
  setTimeout(removeLoader, 2400); // filet de sécurité

  /* --- Boutons magnétiques : suivent légèrement le curseur --- */
  if (!isTouch) {
    document.querySelectorAll('.magnetic, .cart-icon, .footer-social a').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0, 0)'; });
    });
  }

  /* --- Parallax léger sur les images (hero, catégories) --- */
  const parallaxEls = document.querySelectorAll('.parallax-img');
  if (parallaxEls.length) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.speed || '0.15');
        el.style.transform = `translateY(${scrolled * speed}px)`;
      });
    }, { passive: true });
  }

  /* --- Compteurs animés au scroll --- */
  const counters = document.querySelectorAll('.counter-value:not([data-static])');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count || '0', 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const startTime = performance.now();
        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target + suffix;
        };
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  /* --- Header : effet au scroll --- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  /* --- Menu mobile --- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('mobile-open');
    });
  }

  /* --- Animations au scroll (reveal) --- */
  const revealEls = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));

  /* --- Filtres boutique --- */
  const filterChips = document.querySelectorAll('.filter-chip');
  const productCards = document.querySelectorAll('.product-card');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const category = chip.dataset.filter;
      productCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* --- Accordéons fiche produit --- */
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* --- Sélecteur d'options (finition, échelle...) --- */
  document.querySelectorAll('.option-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatch.parentElement.querySelectorAll('.option-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });

  /* --- Sélecteur de quantité (+ total dynamique "prix / pièce") --- */
  document.querySelectorAll('.qty-selector').forEach(selector => {
    const input = selector.querySelector('input');
    const minus = selector.querySelector('.qty-minus');
    const plus = selector.querySelector('.qty-plus');
    if (!input) return;
    const unitPrice = parseFloat(selector.dataset.unitPrice || '0');
    const totalEl = document.querySelector('.qty-total');

    const updateTotal = () => {
      if (!totalEl || !unitPrice) return;
      const qty = parseInt(input.value || '1', 10);
      const total = (qty * unitPrice).toLocaleString('fr-FR', { minimumFractionDigits: 0 });
      totalEl.textContent = `${total} €`;
    };

    minus?.addEventListener('click', () => {
      input.value = Math.max(1, parseInt(input.value || '1') - 1);
      updateTotal();
    });
    plus?.addEventListener('click', () => {
      input.value = parseInt(input.value || '1') + 1;
      updateTotal();
    });
  });

  /* --- Galerie fiche produit : miniatures --- */
  const mainImage = document.querySelector('.product-gallery-main');
  document.querySelectorAll('.product-gallery-thumbs img').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.product-gallery-thumbs img').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImage && thumb.dataset.full) {
        mainImage.style.backgroundImage = `url(${thumb.dataset.full})`;
      }
    });
  });

  /* --- Formulaires : simulation d'envoi (pas de backend connecté) --- */
  document.querySelectorAll('form[data-simulate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Envoi en cours...';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Message envoyé ✓';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          form.reset();
        }, 2000);
      }, 1200);
    });
  });

});
