/* archive.js — pages « Documents des chapitres » : onglets verticaux + recherche.
   Sans recherche, seul le chapitre de l'onglet actif est affiché (#chXX dans l'URL) ;
   avec une recherche, tous les chapitres qui ont un résultat, rubriques dépliées. */
(function () {
  const chaps = [...document.querySelectorAll('.chap')];
  const onglets = [...document.querySelectorAll('.onglets a')];
  const filtres = [...document.querySelectorAll('.filtre')];
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let actif = chaps[0].id, q = '';

  function afficher() {
    let total = 0;
    chaps.forEach(ch => {
      let nChap = 0;
      ch.querySelectorAll('.ligne').forEach(l => {
        // Le titre de la ligne compte aussi : « 7C » ou « Panique » retrouve toute l'activité
        const titreOk = q && norm(l.querySelector('.lib').textContent).includes(q);
        let n = 0;
        l.querySelectorAll('.piece').forEach(a => {
          const ok = !q || titreOk || norm(a.textContent).includes(q);
          a.hidden = !ok; if (ok) n++;
        });
        l.hidden = !n;
        if (q) l.open = n > 0;
        nChap += n;
      });
      ch.hidden = q ? !nChap : ch.id !== actif;
      total += nChap;
      onglets.find(a => a.dataset.ch === ch.id).classList.toggle('sans-res', !!q && !nChap);
    });
    onglets.forEach(a => {
      if (!q && a.dataset.ch === actif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.getElementById('vide').style.display = total ? 'none' : 'block';
  }

  function depuisHash() {
    const h = location.hash.slice(1);
    if (chaps.some(c => c.id === h)) actif = h;
    afficher();
  }

  onglets.forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    q = ''; filtres.forEach(f => f.value = '');
    history.replaceState(null, '', '#' + a.dataset.ch);
    depuisHash();
  }));
  filtres.forEach(f => f.addEventListener('input', () => {
    q = norm(f.value.trim());
    filtres.forEach(g => { if (g !== f) g.value = f.value; });
    afficher();
  }));
  window.addEventListener('hashchange', depuisHash);
  depuisHash();
})();
