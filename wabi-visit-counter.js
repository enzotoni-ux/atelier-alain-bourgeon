(function(){
  var countEl = document.getElementById('visitCount');
  if(!countEl) return;
  var BASE = 1287;
  var KEY = 'atelier-visit-count';
  var n = BASE;
  try{
    var stored = parseInt(localStorage.getItem(KEY), 10);
    n = (stored && !isNaN(stored)) ? stored + 1 : BASE;
    localStorage.setItem(KEY, n);
  }catch(e){}
  countEl.textContent = n.toLocaleString('fr-FR');
})();
