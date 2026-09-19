/* =========================================================
   parcours.js — visionneuse + étapes cochées
   ---------------------------------------------------------
   Utilisation : <script src="../../assets/js/parcours.js"></script> en fin de <body>
   Sur <body>, poser data-page="identifiant-unique" (ex. "1spe-ch01") :
   c'est la clé de mémorisation des étapes cochées sur l'appareil de l'élève.
   Contrat HTML :
     .doc[data-url][data-title]  -> s'ouvre dans la visionneuse (#viewer)
     .etape > .marker            -> clic = étape cochée / décochée
     #nb-done, #bar, #reset      -> compteur, barre, bouton de remise à zéro
   ========================================================= */
(function(){
  /* --- visionneuse --- */
  var v=document.getElementById('viewer'),f=document.getElementById('viewer-frame'),
      t=document.getElementById('viewer-title'),n=document.getElementById('viewer-newTab');
  function open(url,title){
    f.src=url;t.textContent=title;n.href=url.replace('/preview','/view');
    v.classList.add('open');v.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  }
  function close(){
    v.classList.remove('open');v.setAttribute('aria-hidden','true');f.src='about:blank';document.body.style.overflow='';
  }
  if(v){
    document.querySelectorAll('.doc[data-url]').forEach(function(d){
      d.addEventListener('click',function(){open(d.dataset.url,d.dataset.title||d.textContent.trim());});
      if(d.tagName!=='BUTTON'){d.setAttribute('tabindex','0');
        d.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();d.click();}});}
    });
    document.getElementById('viewer-close').addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  }

  /* --- étapes cochées, mémorisées sur l'appareil (localStorage) --- */
  var KEY='parcours:'+(document.body.dataset.page||location.pathname),
      etapes=document.querySelectorAll('.etape'),done={};
  if(!etapes.length)return;
  try{done=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){done={};}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(done));}catch(e){}}
  function render(){
    var nb=0;
    etapes.forEach(function(el,i){var on=!!done[i+1];el.classList.toggle('done',on);if(on)nb++;});
    var c=document.getElementById('nb-done'),b=document.getElementById('bar');
    if(c)c.textContent=nb;
    if(b)b.style.width=(nb/etapes.length*100)+'%';
  }
  etapes.forEach(function(el,i){
    var m=el.querySelector('.marker');
    if(m)m.addEventListener('click',function(){done[i+1]=!done[i+1];save();render();});
  });
  var r=document.getElementById('reset');
  if(r)r.addEventListener('click',function(){done={};save();render();});
  render();
})();
