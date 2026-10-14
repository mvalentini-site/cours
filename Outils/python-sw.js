// Service worker de python.html : ajoute les en-têtes COOP/COEP que GitHub Pages
// ne permet pas de configurer. Ils rendent la page « cross-origin isolated »,
// ce qui autorise SharedArrayBuffer : bouton Stop et input() dans le worker Python.
// Portée limitée à Outils/python* (voir l'enregistrement dans python.html).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const r = e.request;
  if (new URL(r.url).origin !== self.location.origin) return;
  if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
  e.respondWith(fetch(r).then(res => {
    if (res.status === 0) return res;
    const h = new Headers(res.headers);
    h.set('Cross-Origin-Embedder-Policy', 'require-corp');
    h.set('Cross-Origin-Opener-Policy', 'same-origin');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }));
});
