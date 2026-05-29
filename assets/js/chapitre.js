/* ════════════════════════════════════════════════════════════
   chapitre.js — Interactions des pages de chapitre
   Visionneuse de documents (PDF, iframe, YouTube)
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

  /* ── Clic sur un document ou miniature vidéo ── */
  document.querySelectorAll('.doc[data-url]').forEach(function (doc) {
    doc.addEventListener('click', function () {
      var url   = doc.getAttribute('data-url');
      var title = doc.getAttribute('data-title');

      if (!url || url.startsWith('LIEN_')) {
        alert('Lien à configurer : ' + url);
        return;
      }

      // YouTube → convertir en URL embed pour la visionneuse
      var ytMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (ytMatch) {
        openViewer('https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=1', title);
        return;
      }

      openViewer(url, title);
    });
  });

  /* ── Fermeture visionneuse ── */
  var closeBtn = document.getElementById('viewer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeViewer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeViewer();
  });

});
