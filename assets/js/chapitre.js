/* ════════════════════════════════════════════════════════════
   chapitre.js — Interactions des pages de chapitre
   Visionneuse de documents (PDF, iframe, YouTube)
   + documents verrouillés par mot de passe élève (data-lock)
   + documents masqués (data-hidden, gérés en CSS)
   ════════════════════════════════════════════════════════════ */

function _sha256(ascii){
function rightRotate(v,a){return(v>>>a)|(v<<(32-a));}
var mathPow=Math.pow,maxWord=mathPow(2,32),result='',i,j,words=[],asciiBitLength=ascii.length*8;
var hash=_sha256.h=_sha256.h||[],k=_sha256.k=_sha256.k||[],primeCounter=k.length;
var isComposite={};
for(var candidate=2;primeCounter<64;candidate++){
if(!isComposite[candidate]){
for(i=0;i<313;i+=candidate)isComposite[i]=candidate;
hash[primeCounter]=(mathPow(candidate,.5)*maxWord)|0;
k[primeCounter++]=(mathPow(candidate,1/3)*maxWord)|0;
}}
ascii+='\x80';
while(ascii.length%64-56)ascii+='\x00';
for(i=0;i<ascii.length;i++){
j=ascii.charCodeAt(i);
if(j>>8)return;
words[i>>2]|=j<<((3-i)%4*8);
}
words[words.length]=(asciiBitLength/maxWord)|0;
words[words.length]=asciiBitLength;
for(j=0;j<words.length;){
var w=words.slice(j,j+=16),oldHash=hash;
hash=hash.slice(0,8);
for(i=0;i<64;i++){
var w15=w[i-15],w2=w[i-2];
var a=hash[0],e=hash[4];
var temp1=hash[7]+(rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25))+((e&hash[5])^(~e&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:(w[i-16]+(rightRotate(w15,7)^rightRotate(w15,18)^(w15>>>3))+w[i-7]+(rightRotate(w2,17)^rightRotate(w2,19)^(w2>>>10)))|0);
var temp2=(rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
hash=[(temp1+temp2)|0].concat(hash);
hash[4]=(hash[4]+temp1)|0;
}
for(i=0;i<8;i++)hash[i]=(hash[i]+oldHash[i])|0;
}
for(i=0;i<8;i++)for(j=3;j+1;j--){var b=(hash[i]>>(j*8))&255;result+=((b<16)?0:'')+b.toString(16);}
return result;
}

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

  /* ── Verrou par mot de passe élève ── */
  function lockUnlocked(h) {
    try { return sessionStorage.getItem('dl_' + h) === '1'; } catch (e) { return false; }
  }
  function markUnlocked(h) {
    document.querySelectorAll('.doc[data-lock="' + h + '"]').forEach(function (d) {
      d.classList.add('doc-unlocked');
    });
  }
  function checkLock(el) {
    var h = el.getAttribute('data-lock');
    if (!h) return true;
    if (lockUnlocked(h)) return true;
    var p = prompt('Document verrouillé — mot de passe :');
    if (p === null) return false;
    if (_sha256(p) === h) {
      try { sessionStorage.setItem('dl_' + h, '1'); } catch (e) {}
      markUnlocked(h);
      return true;
    }
    alert('Mot de passe incorrect.');
    return false;
  }

  /* cadenas déjà déverrouillés dans cette session */
  document.querySelectorAll('.doc[data-lock]').forEach(function (d) {
    if (lockUnlocked(d.getAttribute('data-lock'))) d.classList.add('doc-unlocked');
  });

  /* ── Clic sur un document ou miniature vidéo ── */
  document.querySelectorAll('.doc[data-url]').forEach(function (doc) {
    doc.addEventListener('click', function () {
      if (!checkLock(doc)) return;

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

  /* ── Liens externes verrouillés ── */
  document.querySelectorAll('a.doc[data-lock]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!checkLock(a)) e.preventDefault();
    });
  });

  /* ── Fermeture visionneuse ── */
  var closeBtn = document.getElementById('viewer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeViewer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeViewer();
  });

});
