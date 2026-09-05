(function(){
  var toggle = document.getElementById('navToggle');
  var nav = document.querySelector('.main-nav');
  if(!toggle || !nav) return;
  function closeNav(){ toggle.classList.remove('is-open'); nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded','false'); }
  function openNav(){ toggle.classList.add('is-open'); nav.classList.add('is-open'); toggle.setAttribute('aria-expanded','true'); }
  toggle.addEventListener('click', function(){
    if(nav.classList.contains('is-open')) closeNav(); else openNav();
  });
  nav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', function(){ if(window.innerWidth > 860) closeNav(); });
})();

(function(){
  var params;
  try{ params = new URLSearchParams(window.location.search); }catch(e){ params = null; }
  if(params && (params.get('sent') === '1' || params.get('subscribed') === '1')){
    var isSub = params.get('subscribed') === '1';
    var toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = isSub ? 'Inscription enregistrée, merci ✓' : 'Message envoyé, merci ✓';
    document.body.appendChild(toast);
    window.requestAnimationFrame(function(){ toast.classList.add('is-visible'); });
    window.setTimeout(function(){ toast.classList.remove('is-visible'); }, 3500);
    params.delete('sent'); params.delete('subscribed');
    var qs = params.toString();
    var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
})();

(function(){
  var toggle = document.getElementById('themeToggle');
  var stored = null;
  try{ stored = localStorage.getItem('atelier-theme'); }catch(e){}
  if(stored === 'dark' || stored === 'light'){
    document.documentElement.setAttribute('data-theme', stored);
  }
  if(toggle){
    toggle.addEventListener('click', function(){
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var current = document.documentElement.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try{ localStorage.setItem('atelier-theme', next); }catch(e){}
    });
  }
})();

(function(){
  var flags = document.querySelectorAll('.lang-flag');
  var nodes = document.querySelectorAll('[data-fr]');

  function applyLang(lang){
    nodes.forEach(function(el){
      var val = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-fr');
      if(val == null) return;
      var attr = el.getAttribute('data-i18n-attr');
      if(attr === 'innerHTML'){ el.innerHTML = val; }
      else if(attr){ el.setAttribute(attr, val); }
      else { el.textContent = val; }
    });
    document.documentElement.lang = lang;
    flags.forEach(function(b){ b.classList.toggle('active', b.dataset.lang === lang); });
    try{ localStorage.setItem('atelier-lang', lang); }catch(e){}
  }

  var saved = 'fr';
  try{ saved = localStorage.getItem('atelier-lang') || 'fr'; }catch(e){}
  applyLang(saved);

  flags.forEach(function(b){
    b.addEventListener('click', function(){ applyLang(b.dataset.lang); });
  });
})();

function wireSimpleModal(modalId, openBtnId, closeBtnId){
  var modalEl = document.getElementById(modalId);
  var openBtn = document.getElementById(openBtnId);
  var closeBtn = document.getElementById(closeBtnId);
  if(!modalEl || !openBtn) return;
  var open = function(){ modalEl.classList.add('is-open'); };
  var close = function(){ modalEl.classList.remove('is-open'); };
  openBtn.addEventListener('click', open);
  if(closeBtn) closeBtn.addEventListener('click', close);
  modalEl.addEventListener('click', function(e){ if(e.target === modalEl) close(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
}

(function(){
  var banner = document.getElementById('cookieBanner');
  var modal = document.getElementById('cookieModal');
  if(!banner || !modal) return;

  function getConsent(){ try{ return localStorage.getItem('atelier-cookie-consent'); }catch(e){ return null; } }
  function setConsent(v){ try{ localStorage.setItem('atelier-cookie-consent', v); }catch(e){} }

  function openModal(){ modal.classList.add('is-open'); }
  function closeModal(){ modal.classList.remove('is-open'); }
  function hideBanner(){ banner.classList.remove('is-visible'); }

  if(!getConsent()){
    window.setTimeout(function(){ banner.classList.add('is-visible'); }, 600);
  }

  var accept = document.getElementById('cookieAccept');
  var decline = document.getElementById('cookieDecline');
  var learnMore = document.getElementById('cookieLearnMore');
  var openLink = document.getElementById('openCookieModal');
  var modalClose = document.getElementById('cookieModalClose');
  var modalAccept = document.getElementById('cookieModalAccept');
  var modalDecline = document.getElementById('cookieModalDecline');

  if(accept) accept.addEventListener('click', function(){ setConsent('accepted'); hideBanner(); });
  if(decline) decline.addEventListener('click', function(){ setConsent('declined'); hideBanner(); });
  if(learnMore) learnMore.addEventListener('click', openModal);
  if(openLink) openLink.addEventListener('click', openModal);
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modalAccept) modalAccept.addEventListener('click', function(){ setConsent('accepted'); closeModal(); hideBanner(); });
  if(modalDecline) modalDecline.addEventListener('click', function(){ setConsent('declined'); closeModal(); hideBanner(); });
  modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
})();

var backToTop = document.getElementById('backToTop');
if(backToTop){
  var toggleBackToTop = function(){
    if(window.scrollY > window.innerHeight * 0.6){ backToTop.classList.add('is-visible'); }
    else{ backToTop.classList.remove('is-visible'); }
  };
  window.addEventListener('scroll', toggleBackToTop, {passive:true});
  toggleBackToTop();
  backToTop.addEventListener('click', function(){
    window.scrollTo({top:0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  });
}

var revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, {threshold:0.15});
  revealEls.forEach(function(el){ io.observe(el); });
} else {
  revealEls.forEach(function(el){ el.classList.add('visible'); });
}

/* ---------- panier partagé ---------- */
function atelierReadCart(){ try{ return JSON.parse(localStorage.getItem('atelier-cart')) || []; }catch(e){ return []; } }
function atelierWriteCart(items){ try{ localStorage.setItem('atelier-cart', JSON.stringify(items)); }catch(e){} }
function atelierUpdateCartBadges(){
  var n = atelierReadCart().length;
  document.querySelectorAll('.cart-count').forEach(function(el){ el.textContent = n; });
}
function atelierShowToast(text){
  var toast = document.getElementById('cartToast');
  if(!toast) return;
  toast.textContent = text;
  toast.classList.add('is-visible');
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(function(){ toast.classList.remove('is-visible'); }, 2200);
}
window.atelierAddToCart = function(item, msgFr, msgEn){
  var items = atelierReadCart();
  items.push(item);
  atelierWriteCart(items);
  atelierUpdateCartBadges();
  var lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
  atelierShowToast(lang === 'en' ? (msgEn || 'Added to cart ✓') : (msgFr || 'Ajouté au panier ✓'));
};
atelierUpdateCartBadges();

/* galerie photo fiche produit (no-op ailleurs si absente) */
(function(){
  var mainImg = document.getElementById('mainProductImage');
  var thumbs = document.querySelectorAll('.product-gallery-thumb');
  if(!mainImg || !thumbs.length) return;
  thumbs.forEach(function(btn){
    btn.addEventListener('click', function(){
      mainImg.src = btn.dataset.src;
      mainImg.alt = btn.dataset.alt || mainImg.alt;
      thumbs.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
})();

/* videos maison tournantes : ralenties, la rotation source est trop rapide */
document.querySelectorAll('.turntable-video').forEach(function(v){
  v.playbackRate = 0.45;
});

/* filtres boutique (no-op ailleurs si absents) */
(function(){
  var chips = document.querySelectorAll('.filter-chip');
  var cards = document.querySelectorAll('.product-card');
  if(!chips.length || !cards.length) return;
  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      chips.forEach(function(c){ c.classList.remove('active'); });
      chip.classList.add('active');
      var filter = chip.dataset.filter;
      cards.forEach(function(card){
        var show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });
})();
