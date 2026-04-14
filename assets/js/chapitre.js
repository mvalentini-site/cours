/* ════════════════════════════════════════════════════════════
   chapitre.js — Interactions des pages de chapitre
   Accordéon sections + visionneuse de documents
   ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Visionneuse ── */
  function openViewer(url, title) {
    document.getElementById('viewer-title').textContent = title;
    document.getElementById('viewer-newTab').href = url;
    document.getElementById('viewer-frame').src = url;
    document.getElementById('viewer').classList.add('open');
  }

  function closeViewer() {
    document.getElementById('viewer').classList.remove('open');
    document.getElementById('viewer-frame').src = 'about:blank';
  }

  /* ── Accordéon sections ── */
  document.querySelectorAll('.sec-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var list  = header.nextElementSibling;
      var arrow = header.querySelector('.sec-toggle');
      var isOpen = list.classList.contains('open');

      // Fermer toutes les sections ouvertes
      document.querySelectorAll('.doc-list.open').forEach(function (l) {
        l.classList.remove('open');
        l.previousElementSibling.querySelector('.sec-toggle').classList.remove('open');
      });

      // Ouvrir celle cliquée si elle était fermée
      if (!isOpen) {
        list.classList.add('open');
        arrow.classList.add('open');
      }
    });
  });

  /* ── Clic sur un document (visionneuse) ── */
  document.querySelectorAll('.doc[data-url]').forEach(function (doc) {
    doc.addEventListener('click', function () {
      var url   = doc.getAttribute('data-url');
      var title = doc.getAttribute('data-title');

      if (url.startsWith('LIEN_')) {
        alert('Lien à configurer : ' + url);
        return;
      }
      openViewer(url, title);
    });
  });

  /* ── Fermeture visionneuse ── */
  document.getElementById('viewer-close').addEventListener('click', closeViewer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeViewer();
  });

});
