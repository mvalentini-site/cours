/* =========================================================
   parcours.js - ouverture des documents + etapes cochees (+ mode onglets)
   ---------------------------------------------------------
   Utilisation : <script src="../../assets/js/parcours.js"></script> en fin de <body>
   Sur <body>, poser data-page="identifiant-unique" (ex. "1spe-ch01") :
   c'est la cle de memorisation des etapes cochees sur l'appareil de l'eleve.
   Contrat HTML :
     .doc[data-url][data-title]  -> s'ouvre dans un NOUVEL ONGLET du navigateur
     .etape > .marker            -> clic = etape cochee / decochee
     #nb-done, #bar, #reset      -> compteur, barre, bouton de remise a zero
   Mode onglets (classe "en-onglets" sur <body>) :
     un onglet "Plan & cours" (section .intro + reperes generaux), puis un onglet par .etape
     .etape[data-court]          -> libelle court de l'onglet (sinon le titre)
     li.repere.section           -> nom de section, affiche en tete des etapes qui suivent
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
  function toggle(i){done[i+1]=!done[i+1];save();render();}
  var onglets=document.body.classList.contains('en-onglets')?construireOnglets():null;
  function render(){
    var nb=0;
    etapes.forEach(function(el,i){
      var on=!!done[i+1];el.classList.toggle('done',on);if(on)nb++;
      if(el._onglet)el._onglet.classList.toggle('fait',on);
      if(el._btnFait)el._btnFait.textContent=on?'✓ Étape terminée — annuler':'J’ai terminé cette étape';
      if(el._btnFait)el._btnFait.classList.toggle('on',on);
    });
    var c=document.getElementById('nb-done'),b=document.getElementById('bar');
    if(c)c.textContent=nb;
    if(b)b.style.width=(nb/etapes.length*100)+'%';
  }
  etapes.forEach(function(el,i){
    var m=el.querySelector('.marker');
    if(m)m.addEventListener('click',function(){toggle(i);});
  });
  var r=document.getElementById('reset');
  if(r)r.addEventListener('click',function(){done={};save();render();});
  render();

  /* --- mode onglets --- */
  function construireOnglets(){
    var main=document.querySelector('main'),intro=main.querySelector('.intro'),
        ol=main.querySelector('.etapes'),titre=main.querySelector('.parcours-titre');
    var nav=document.createElement('nav');nav.className='onglets';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Étapes');
    var zone=document.createElement('div');zone.className='panneaux';
    var tabs=[],panels=[];
    function ajouter(label,num,couleur,panel,sep){
      var t=document.createElement('button');t.type='button';t.className='onglet'+(sep?' sep':'');
      t.setAttribute('role','tab');t.title=label;t.style.setProperty('--c',couleur);
      t.innerHTML='<span class="num">'+num+'</span><span class="lib"></span>';t.querySelector('.lib').textContent=label;
      var k=tabs.length;t.addEventListener('click',function(){afficher(k,true);});
      panel.className='panneau';panel.setAttribute('role','tabpanel');
      nav.appendChild(t);zone.appendChild(panel);tabs.push(t);panels.push(panel);return t;
    }
    /* onglet 0 : plan de travail et cours */
    var p0=document.createElement('div');
    if(intro)p0.appendChild(intro);
    ajouter('Plan & cours','<svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h12M4 10h12M4 15h8"/></svg>','var(--accent)',p0);
    /* une étape = un onglet */
    var section='',nouvelle=false,generaux=[];
    Array.prototype.slice.call(ol.children).forEach(function(li){
      if(li.classList.contains('repere')){
        if(li.classList.contains('section')){section=li.textContent.trim();nouvelle=true;}
        else generaux.push(li);
        return;
      }
      if(!li.classList.contains('etape'))return;
      var i=Array.prototype.indexOf.call(etapes,li),p=document.createElement('div');
      if(section){var k=document.createElement('div');k.className='section-nom';k.textContent=section;p.appendChild(k);}
      var o=document.createElement('ol');o.className='etapes';o.appendChild(li);p.appendChild(o);
      var b=document.createElement('button');b.type='button';b.className='btn-fait';
      b.addEventListener('click',function(){var avant=!!done[i+1];toggle(i);if(!avant)suivante();});
      li._btnFait=b;
      var court=li.dataset.court||(li.querySelector('.titre')||{}).textContent||('Étape '+(i+1));
      var couleur=li.style.getPropertyValue('--c')||'var(--ink)';
      li._onglet=ajouter(court,(li.querySelector('.marker span')||{}).textContent||(i+1),couleur,p,nouvelle);
      nouvelle=false;
    });
    /* repères généraux (consignes) : dans l'onglet Plan & cours */
    if(generaux.length){var ul=document.createElement('ul');ul.className='consignes-generales';
      generaux.forEach(function(g){ul.appendChild(g);});p0.insertBefore(ul,p0.firstChild);}
    /* barre de navigation en bas de chaque panneau */
    panels.forEach(function(p,k){
      var bas=document.createElement('div');bas.className='nav-bas';
      var prec=document.createElement('button');prec.type='button';prec.className='nav-btn';prec.textContent='← '+(k?(k===1?'Plan & cours':'Étape précédente'):'');
      if(!k)prec.style.visibility='hidden';prec.addEventListener('click',function(){afficher(k-1,true);});
      bas.appendChild(prec);
      etapes.forEach(function(el){if(el._onglet===tabs[k])bas.appendChild(el._btnFait);});
      var suiv=document.createElement('button');suiv.type='button';suiv.className='nav-btn suiv';
      suiv.textContent=k?'Étape suivante →':'Commencer l’étape 1 →';
      if(k===panels.length-1)suiv.style.visibility='hidden';suiv.addEventListener('click',function(){afficher(k+1,true);});
      bas.appendChild(suiv);p.appendChild(bas);
    });
    ol.parentNode.insertBefore(nav,ol);ol.parentNode.insertBefore(zone,ol);ol.remove();if(titre)titre.remove();
    var actif=0;
    function afficher(k,focus){
      actif=Math.max(0,Math.min(k,panels.length-1));
      tabs.forEach(function(t,j){var on=j===actif;t.classList.toggle('actif',on);t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;});
      panels.forEach(function(p,j){p.hidden=j!==actif;});
      try{localStorage.setItem(KEY+':onglet',actif);}catch(e){}
      tabs[actif].scrollIntoView({block:'nearest',inline:'nearest'});
      if(focus){var top=nav.getBoundingClientRect().top;if(top<0)window.scrollBy(0,top-12);}
    }
    function suivante(){afficher(actif+1,true);}
    nav.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'){afficher(actif+1);tabs[actif].focus();}
      if(e.key==='ArrowLeft'){afficher(actif-1);tabs[actif].focus();}
    });
    var memo=0;try{memo=parseInt(localStorage.getItem(KEY+':onglet')||'0',10)||0;}catch(e){}
    afficher(memo);
    return true;
  }
})();
