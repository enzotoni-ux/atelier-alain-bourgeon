(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Feux de départ
  var lights = [].slice.call(document.querySelectorAll('#lights i'));
  var timers = [];
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function start() {
    clear();
    lights.forEach(function (l) { l.classList.remove('on'); });
    if (reduce) return;
    lights.forEach(function (l, i) {
      timers.push(setTimeout(function () { l.classList.add('on'); }, 500 + i * 600));
    });
    timers.push(setTimeout(function () {
      lights.forEach(function (l) { l.classList.remove('on'); });
    }, 500 + lights.length * 600 + 900 + Math.random() * 1200));
  }
  document.getElementById('replay').addEventListener('click', start);
  start();

  // Compteurs
  function count(el) {
    var end = +el.dataset.count;
    if (reduce) return;
    var t0 = null;
    (function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / 900, 1);
      el.textContent = Math.round(end * p);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { count(e.target); io.unobserve(e.target); } });
    });
    counters.forEach(function (c) { io.observe(c); });
  }

  // Onglets écuries
  var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return;
      e.preventDefault();
      select(tabs[(n + tabs.length) % tabs.length]);
    });
  });

  // Tri du tableau
  var table = document.getElementById('drivers');
  var body = table.tBodies[0];
  [].forEach.call(table.querySelectorAll('th[data-key]'), function (th) {
    th.querySelector('button').addEventListener('click', function () {
      var key = th.dataset.key;
      var dir = th.getAttribute('aria-sort') === 'descending' ? 1 : (key === 'titles' && !th.hasAttribute('aria-sort') ? -1 : th.getAttribute('aria-sort') === 'ascending' ? -1 : 1);
      [].forEach.call(table.querySelectorAll('th'), function (h) { h.removeAttribute('aria-sort'); });
      th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
      [].slice.call(body.rows).sort(function (a, b) {
        var x = a.dataset[key], y = b.dataset[key];
        var c = key === 'titles' ? x - y : x.localeCompare(y, 'fr');
        return c * dir;
      }).forEach(function (r) { body.appendChild(r); });
    });
  });
})();
