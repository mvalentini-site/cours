/* =========================================================
   parcours.js - ouverture des documents + etapes cochees
   ---------------------------------------------------------
   Utilisation : <script src="../../assets/js/parcours.js"></script> en fin de <body>
   Sur <body>, poser data-page="identifiant-unique" (ex. "1spe-ch01") :
   c'est la cle de memorisation des etapes cochees sur l'appareil de l'eleve.
   Contrat HTML :
     .doc[data-url][data-title]  -> s'ouvre dans un NOUVEL ONGLET du navigateur
     .etape > .marker            -> clic = etape cochee / decochee
     #nb-done, #bar, #reset      -> compteur, barre, bouton de remise a zero
   ========================================================= */
(function(){
  /* --- ouverture des documents dans un nouvel onglet --- */
  function openDoc(d){
    var url=d.dataset.url||'';
    if(!url)return;
    if(url.indexOf('drive.google.com/file/')>-1) url=url.replace('/preview','/view');
    window.open(url,'_blank','noopener');
  }
  document.querySelectorAll('.doc[data-url]').forEach(function(d){
    d.addEventListener('click',function(){openDoc(d);});
    if(d.tagName!=='BUTTON'){d.setAttribute('role','button');d.setAttribute('tabindex','0');
      d.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();d.click();}});}
  });

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
