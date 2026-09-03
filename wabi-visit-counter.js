(async function(){
  var countEl = document.getElementById('visitCount');
  if(!countEl || !window.claude || !window.claude.use) return;
  try{
    var db = await window.claude.use('db');
    if(!db){ countEl.textContent = '—'; return; }
    var ref = db.doc('stats/visits');
    var snap = await ref.get();
    if(snap.exists){
      await ref.update({count: (snap.data().count || 0) + 1});
    } else {
      await ref.set({count: 1});
    }
    ref.onSnapshot(function(s){
      if(s.exists){
        countEl.textContent = (s.data().count || 0).toLocaleString('fr-FR');
      }
    }, function(){ countEl.textContent = '—'; });
  }catch(e){
    countEl.textContent = '—';
  }
})();
