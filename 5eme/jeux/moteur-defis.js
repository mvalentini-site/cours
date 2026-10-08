/* Moteur commun des jeux « défis » de 5ème (chapitres 2 à 10).

   Chaque page fournit une configuration puis appelle demarrerJeu(JEU) :
     JEU = {
       cle:      'nom_records_v1',          // clé des records dans le navigateur
       duree:    240,                       // secondes pour que le compteur tombe à 0
       niveaux:  {facile:{nom,pts,desc,compo:['gen1','gen2',…]}, moyen:{…}, difficile:{…}},
       gen:      {gen1(niv,deja){ return defi; }, …},
       memo:     [{t:'Titre', svg?, tab?, li:['…'], ex?}],
     }
   Un défi : {titre, html, type:'num'|'choix', rep, unite?, tol?, options?, pq}
     num   : rep est un nombre ; tol = écart toléré (0 par défaut) ; unite affichée à côté du champ.
     choix : rep est le texte de la bonne option ; options = liste des textes, dans l'ordre d'affichage.
     pq    : explication affichée à la correction. */

const $=id=>document.getElementById(id);
const ENC='#1c1208', EAU='#a9cbe6', EAU2='#4f86b8';

/* ══════════ OUTILS ══════════ */
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
function melange(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const arr=x=>Math.round(x*1e6)/1e6;
const fr=x=>arr(x).toLocaleString('fr-FR',{maximumFractionDigits:6});
const d=x=>`<span class="donnee">${x}</span>`;
function lireNombre(s){
  s=String(s).replace(/[\s  ]/g,'').replace(',','.').replace('−','-');
  if(!/^-?\d*\.?\d+$/.test(s)) return NaN;
  return Number(s);
}

// Tire un élément d'une banque {n:'facile'|'moyen'|'difficile', …} sans répéter ceux déjà utilisés dans la partie.
// facile → items faciles ; moyen → moyens (surtout) et faciles ; difficile → difficiles (surtout) et moyens.
function tirer(banque,niv,deja,cle){
  const rang={facile:['facile'],moyen:['moyen','facile'],difficile:['difficile','moyen']}[niv];
  const k=cle||(b=>b.q);
  let pool=banque.filter(b=>rang.includes(b.n)&&!deja.has(k(b)));
  if(!pool.length) pool=banque.filter(b=>!deja.has(k(b)));
  if(!pool.length) pool=banque;
  const prio=pool.filter(b=>b.n===rang[0]); if(prio.length&&Math.random()<.7) pool=prio;
  const b=pick(pool); deja.add(k(b)); return b;
}
// Défi à choix multiple à partir d'un item {q, o:[bonne, autres…], pq, svg?, fixe?} (o[0] est la bonne réponse).
function defiQcm(b,titre){
  return {titre:titre||b.titre||'Question', type:'choix', options:b.fixe?b.o.slice():melange(b.o), rep:b.o[0],
    html:(b.svg||'')+`<div class="enonce${b.svg?'':' grand'}">${b.q}</div>`, pq:b.pq};
}
// Générateur de QCM à partir d'une banque.
const qcmDepuis=(banque,titre)=>(niv,deja)=>defiQcm(tirer(banque,niv,deja),titre);

/* ══════════ MOTEUR ══════════ */
function demarrerJeu(JEU){
  const NIVEAUX=JEU.niveaux, NOMS=Object.keys(NIVEAUX);
  const nbDefis=k=>NIVEAUX[k].compo.length;

  $('p-jeu').innerHTML=
    `<ol class="consigne"><li>Choisis un niveau, puis clique sur « Lancer » (à droite).</li>`+
    `<li>Réponds à chaque défi (touche Entrée pour passer au suivant).</li>`+
    `<li>Valide vite : sans erreur, tu gagnes les points du compteur ; une seule erreur et c'est 0.</li></ol>`+
    `<div class="niveaux" id="niveaux">`+NOMS.map((k,i)=>`<button class="niv${i?'':' on'}" data-niv="${k}"><b>${NIVEAUX[k].nom}</b>`+
      `<small>${nbDefis(k)} défis${NIVEAUX[k].desc?' · '+NIVEAUX[k].desc:''} · ${NIVEAUX[k].pts} pts</small></button>`).join('')+
    `<div class="compteur attente" id="compteur" aria-live="off"><span class="val" id="cpt"></span><small id="cpt_lib">pts à gagner</small></div>`+
    `<div class="records" id="records"></div></div>`+
    `<div class="jeu" id="jeu"><div class="plateau vide" id="plateau"></div>`+
    `<div class="carte col-rep"><div class="entete-carte"><h3>Mes réponses</h3><span class="titre-partie" id="titre">Aucune partie</span></div>`+
      `<ul class="reponses" id="reponses"></ul><div class="resultat" id="resultat" hidden></div></div>`+
    `<div class="carte col-saisie"><button class="btn plein lancer" id="b_new">Lancer</button><h3>Ma réponse</h3>`+
      `<div class="saisie" id="saisie"></div><div class="aide" id="aide"></div>`+
      `<div class="boutons"><button class="btn plein" id="b_valider" disabled>Valider</button><button class="btn" id="b_effacer">Effacer</button></div></div></div>`;

  function partieNiveau(niv){
    const deja=new Set();
    return {niv, defis:NIVEAUX[niv].compo.map(t=>JEU.gen[t](niv,deja))};
  }

  /* état */
  let P=null, rep=[], sel=0, corrige=false, niveau=NOMS[0];
  const juste=(df,r)=>df.type==='num'?(r!=null&&Math.abs(lireNombre(r)-df.rep)<=(df.tol||0)+1e-9):r===df.rep;
  const rempli=r=>r!=null&&String(r).trim()!=='';
  const affRep=(df,r)=>df.type==='num'?(rempli(r)?r.trim()+' '+(df.unite||''):''):(r||'');
  const affBonne=df=>df.type==='num'?fr(df.rep)+' '+(df.unite||''):df.rep;

  /* compteur de points : part des points du niveau et descend jusqu'à 0 en DUREE secondes */
  const DUREE=JEU.duree||180;
  let t0=0, tFin=0, minuteur=null;
  const secondes=()=>((tFin||performance.now())-t0)/1000;
  const ptsActuels=()=>Math.max(0,Math.round(NIVEAUX[P.niv].pts*(1-secondes()/DUREE)));
  function afficherCompteur(val,etat,lib){$('compteur').className='compteur '+etat;$('cpt').textContent=val;$('cpt_lib').textContent=lib;}
  function majCompteur(){
    if(!P||corrige) return;
    const v=ptsActuels();
    afficherCompteur(v,'marche'+(v<NIVEAUX[P.niv].pts*.2?' bas':''),'pts à gagner');
  }
  const compteurAttente=()=>afficherCompteur(NIVEAUX[niveau].pts,'attente','pts à gagner');
  function demarrer(){t0=performance.now();tFin=0;clearInterval(minuteur);minuteur=setInterval(majCompteur,50);majCompteur();}
  function arreter(){tFin=performance.now();clearInterval(minuteur);}

  /* records (gardés dans ce navigateur) */
  let records={};
  try{records=JSON.parse(localStorage.getItem(JEU.cle)||'{}')||{};}catch(e){records={};}
  function sauverRecords(){try{localStorage.setItem(JEU.cle,JSON.stringify(records));}catch(e){}}
  function majRecords(){
    const l=NOMS.filter(k=>records[k]!=null).map(k=>NIVEAUX[k].nom+' <b>'+records[k]+' pts</b>');
    $('records').innerHTML=l.length?'Mes records : '+l.join(' · '):'';
  }

  function charger(p){
    P=p; rep=p.defis.map(()=>null); sel=0; corrige=false;
    $('titre').innerHTML='<b>'+NIVEAUX[p.niv].nom+'</b> · '+p.defis.length+' défis';
    $('resultat').hidden=true;
    demarrer(); majTout(); focusSaisie();
  }

  /* plateau */
  function dessiner(){
    const pl=$('plateau');
    if(!P){
      pl.className='plateau vide';
      pl.innerHTML='<div class="accueil"><span class="q">?</span>Choisis un niveau,<br>puis clique sur « Lancer ».</div>';
      return;
    }
    const df=P.defis[sel], r=rep[sel];
    pl.className='plateau';
    let corr='';
    if(corrige){
      const ok=juste(df,r);
      corr=`<div class="correction ${ok?'':'ko'}">`+(ok?`<b>Bonne réponse : ${affBonne(df)}</b> ✓`
        :`Ta réponse : <b>${rempli(r)?affRep(df,r):'—'}</b> · Bonne réponse : <b>${affBonne(df)}</b>`)+
        `<span class="pourquoi">${df.pq}</span></div>`;
    }
    pl.innerHTML=`<div class="defi-tete"><span class="badge">${sel+1}</span><b>${df.titre}</b><span>Défi ${sel+1} / ${P.defis.length}</span></div>`+
      `<div class="defi-corps">${df.html}</div>${corr}`+
      `<div class="nav"><button class="btn" id="b_prec" ${sel===0?'disabled':''}>← Précédent</button>`+
      `<button class="btn" id="b_suiv" ${sel===P.defis.length-1?'disabled':''}>Suivant →</button></div>`;
    $('b_prec').addEventListener('click',()=>aller(sel-1));
    $('b_suiv').addEventListener('click',()=>aller(sel+1));
  }

  /* panneau de réponses */
  function listeReponses(){
    const ul=$('reponses');
    if(!P){ul.innerHTML='<li class="attente"><span class="vide">Lance une partie pour commencer.</span></li>';return;}
    ul.innerHTML=P.defis.map((df,i)=>{
      const r=rep[i], cls=[];
      if(rempli(r)) cls.push('rempli');
      if(i===sel) cls.push('sel');
      let txt;
      if(!corrige) txt=rempli(r)?affRep(df,r):'<span class="vide">à compléter</span>';
      else if(juste(df,r)){cls.push('ok');txt='<span class="bonne">'+affBonne(df)+'</span> ✓';}
      else {cls.push('ko');txt=(rempli(r)?'<span class="barre-rep">'+affRep(df,r)+'</span> → ':'')+'<span class="bonne">'+affBonne(df)+'</span>';}
      return `<li class="${cls.join(' ')}" data-i="${i}"><span class="n">${i+1}</span><span><span class="t">${df.titre}</span>${txt}</span></li>`;
    }).join('');
    ul.querySelectorAll('li').forEach(li=>li.addEventListener('click',()=>aller(+li.dataset.i)));
  }

  /* saisie */
  function zoneSaisie(){
    const z=$('saisie');
    if(!P){z.innerHTML='<div class="champ"><input disabled placeholder="…"><span class="unite">&nbsp;</span></div>';return;}
    const df=P.defis[sel], off=corrige?'disabled':'';
    if(df.type==='num'){
      z.innerHTML=`<div class="champ"><input id="champ" inputmode="decimal" autocomplete="off" ${off} value="${rempli(rep[sel])?rep[sel].replace(/"/g,''):''}" aria-label="Réponse${df.unite?' en '+df.unite:''}"><span class="unite">${df.unite||''}</span></div>`;
      const inp=$('champ');
      inp.addEventListener('input',()=>{rep[sel]=inp.value;listeReponses();majBoutons();});
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();suivant();}});
    }else{
      z.innerHTML='<div class="choix">'+df.options.map((o,k)=>`<button class="opt ${rep[sel]===o?'on':''}" data-k="${k}" ${off}><span class="k">${k+1}</span><span>${o}</span></button>`).join('')+'</div>';
      z.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>choisirOption(+b.dataset.k)));
    }
  }
  function choisirOption(k){const df=P.defis[sel];if(corrige||df.type!=='choix'||!df.options[k])return;rep[sel]=df.options[k];suivant();}
  function focusSaisie(){const c=$('champ');if(c&&!c.disabled){c.focus();c.select();}}

  function majBoutons(){
    const manque=P?rep.filter(r=>!rempli(r)).length:1;
    $('b_valider').disabled=!P||corrige||manque>0;
    $('b_valider').hidden=corrige;
    $('b_effacer').hidden=corrige;
    $('b_effacer').disabled=!P;
    let a='';
    if(P&&!corrige){
      const df=P.defis[sel];
      if(manque) a=df.type==='num'?'Tape ta réponse (une virgule pour les décimales), puis Entrée.':'Clique sur ta réponse (ou tape son numéro).';
      else a='Tout est rempli : tu peux valider (ou revenir sur un défi pour changer ta réponse).';
    }
    if(P&&corrige) a='Clique sur un défi de la liste pour revoir sa correction.';
    $('aide').textContent=a;
  }

  function majTout(){dessiner();listeReponses();zoneSaisie();majBoutons();}

  /* actions */
  function aller(i){if(!P||i<0||i>=P.defis.length)return;sel=i;majTout();focusSaisie();}
  function suivant(){
    // passe au prochain défi sans réponse (ou au suivant si tout est rempli)
    const n=P.defis.length;
    let suiv=-1;
    for(let k=1;k<=n;k++){const j=(sel+k)%n;if(!rempli(rep[j])){suiv=j;break;}}
    if(suiv<0) suiv=Math.min(sel+1,n-1);
    aller(suiv);
    if(rep.every(rempli)) $('b_valider').focus();
  }
  function valider(){
    arreter();
    corrige=true;
    const n=P.defis.length, err=P.defis.filter((df,i)=>!juste(df,rep[i])).length;
    const s=Math.round(secondes()), R=$('resultat');
    if(err===0){
      const pts=ptsActuels();
      afficherCompteur(pts,'gagne','pts gagnés');
      const rec=records[P.niv]==null||pts>records[P.niv];
      if(rec){records[P.niv]=pts;sauverRecords();}
      R.className='resultat parfait';
      R.innerHTML=`<div class="score">${pts} <small>pts</small>${rec?'<span class="record">Nouveau record</span>':''}</div><div class="detail">Sans erreur · ${s} s</div>`;
    }else{
      R.className='resultat zero';
      afficherCompteur(0,'perdu','pas de score');
      R.innerHTML=`<div class="score">Pas de score</div><div class="detail">${err} erreur${err>1?'s':''} sur ${n}. Clique sur un défi en rouge pour voir l'explication.</div>`;
      sel=P.defis.findIndex((df,i)=>!juste(df,rep[i]));
    }
    R.hidden=false;
    majRecords(); majTout();
  }

  $('b_valider').addEventListener('click',valider);
  $('b_effacer').addEventListener('click',()=>{if(!P)return;rep=rep.map(()=>null);sel=0;majTout();focusSaisie();});
  $('b_new').addEventListener('click',()=>charger(partieNiveau(niveau)));
  document.querySelectorAll('.niv').forEach(b=>b.addEventListener('click',()=>{
    niveau=b.dataset.niv;
    document.querySelectorAll('.niv').forEach(x=>x.classList.toggle('on',x===b));
    if(!P||corrige) compteurAttente();
  }));
  // touches 1 à 9 : choisir une option (hors champ de saisie)
  document.addEventListener('keydown',e=>{
    if(!P||corrige||$('p-jeu').hidden||e.ctrlKey||e.metaKey||e.altKey||e.target.tagName==='INPUT') return;
    if(/^[1-9]$/.test(e.key)&&P.defis[sel].type==='choix'){e.preventDefault();choisirOption(+e.key-1);}
  });

  /* mémo */
  if(JEU.memo) $('memo').innerHTML=JEU.memo.map(f=>`<div class="fiche">${f.svg||''}<b>${f.t}</b>${f.tab||''}`+
    `<ul>${f.li.map(x=>'<li>'+x+'</li>').join('')}</ul>${f.ex?'<div class="ex">'+f.ex+'</div>':''}</div>`).join('');

  /* onglets */
  document.querySelectorAll('.onglet').forEach(o=>o.addEventListener('click',()=>{
    document.querySelectorAll('.onglet').forEach(x=>{x.classList.remove('actif');x.setAttribute('aria-selected','false');});
    document.querySelectorAll('.panneau').forEach(p=>p.hidden=true);
    o.classList.add('actif');o.setAttribute('aria-selected','true');
    $(o.dataset.cible).hidden=false;
  }));

  majTout(); majRecords(); compteurAttente();

  // pour les tests automatiques (console) : générer une partie sans l'afficher
  window.JEU_TEST={partieNiveau, juste, partie:()=>P};
}
