/* ════════════════════════════════════════════════════════════
   admin-chapitre.js — Panneau d'édition des pages de chapitre
   Ajouter à une page : <script src="../../assets/js/admin-chapitre.js"></script>
   Dépendances : aucune (vanilla JS, auto-injecte son CSS)
   ════════════════════════════════════════════════════════════ */

(function () {
'use strict';

/* ── Config ────────────────────────────────────────────────── */
const GH_OWNER = 'mvalentini-site';
const GH_REPO  = 'cours';
const LS_TOKEN = 'gh_admin_token_v1';

const PALETTE = [
  '#1c3d6e','#2a5c3a','#3a2010','#3a1c6b',
  '#5c2a2a','#1c4a4a','#6b3a1c','#3a3a1c',
  '#5a3a1c','#4a1c5c','#1c3a5c','#3a5c1c',
];
const LABELS = ['Cours','Activite','TD','Exercices','Evaluation','Videos','Simulation','Intro','Bilan','Correction'];
const ICONS  = ['📄','▶','🔗','📤','🎮','🔬','📊','🖼','📝','🧪','📌'];
const TAGS   = {
  'Cours':'#1c3d6e','Activite':'#2a5c3a','TD':'#3a2010','Corrige':'#5c2a2a',
  'Situation':'#3a1c6b','Lien':'#3a3a1c','Digiwall':'#6b3a1c',
  'Simulation':'#1c4a4a','Experience':'#2a5c3a','Video':'#5a3a1c','Document':'#1c3d6e',
};

let M = {};       // métadonnées de la page
let S = [];       // sections (blocs)
let _branch = 'main';
let _expanded = new Set();
let _uid = 0;
function nid() { return 'n' + (++_uid); }

/* ── Chemins ───────────────────────────────────────────────── */
function getGHPath() {
  const p = location.pathname;
  // GitHub Pages: /cours/1ere-spe/.../index.html
  const m1 = p.match(/\/cours\/(.+\.html)/);
  if (m1) return m1[1];
  // Fichier local Windows/Mac : .../GitHub/cours/...
  const m2 = p.match(/[Gg]it[Hh]ub[/\\]cours[/\\](.+\.html)/);
  if (m2) return m2[1].replace(/\\/g, '/');
  return window.ADMIN_GH_PATH || '';
}

function getAssetsPath() {
  const p = getGHPath();
  const depth = (p.match(/\//g) || []).length;
  return '../'.repeat(depth) + 'assets';
}

/* ── Lecture du DOM → données ─────────────────────────────── */
function readPage() {
  const h1    = document.querySelector('h1');
  const em    = h1 ? h1.querySelector('em') : null;
  const tape  = document.querySelector('.tape-label');
  const back  = document.querySelector('.back');
  const exp   = document.querySelector('.exp-tag');

  M = {
    title  : document.title,
    num    : em ? em.textContent.trim() : '',
    name   : h1 ? h1.textContent.replace(em ? em.textContent : '', '')
                   .replace(/^[\s——\-]+/, '').trim() : '',
    cls    : exp ? exp.textContent.split('—')[0].trim() : '1re Spécialité',
    theme  : tape ? tape.textContent.trim() : '',
    back   : back ? (back.getAttribute('href') || '../../index.html') : '../../index.html',
    backLbl: back ? back.textContent.trim() : '← Retour',
  };

  S = [];
  document.querySelectorAll('.section').forEach(function (sec, i) {
    const type   = sec.dataset.type || 'docs';
    const label  = sec.querySelector('.sec-label');
    const title  = sec.querySelector('.sec-title');

    const bloc = {
      id   : 's' + i,
      type,
      label: label ? label.textContent.trim() : '',
      color: label ? (label.style.background || '#1c3d6e') : '#1c3d6e',
      title: title ? title.textContent.trim() : '',
      docs : [],
    };

    if (type === 'docs') {
      sec.querySelectorAll('.doc').forEach(function (doc, di) {
        const isExt    = !!doc.getAttribute('href');
        const url      = isExt ? (doc.getAttribute('href') || '') : (doc.dataset.url || '');
        const iconEl   = doc.querySelector('.doc-icon');
        const nameEl   = doc.querySelector('.doc-name');
        const tagEl    = doc.querySelector('.doc-tag');
        bloc.docs.push({
          id      : 'd' + i + '_' + di,
          icon    : iconEl ? iconEl.textContent.trim() : '📄',
          name    : nameEl ? nameEl.textContent.trim() : '',
          tag     : tagEl  ? tagEl.textContent.trim()  : '',
          tagColor: tagEl  ? (tagEl.style.background || '#1c3d6e') : '#1c3d6e',
          url,
          ext     : isExt,
        });
      });
    }
    S.push(bloc);
  });
}

/* ── Génération HTML ───────────────────────────────────────── */
function e2(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function genSectionsHTML() {
  return S.map(function (b) {
    const hdr =
      '      <div class="sec-header">\n' +
      '        <span class="sec-label" style="background:' + b.color + '">' + e2(b.label) + '</span>\n' +
      '        <span class="sec-title">' + e2(b.title) + '</span>\n' +
      '      </div>';

    let content = '';
    if (b.type === 'docs') {
      const docsH = (b.docs || []).map(function (d) {
        if (d.ext) {
          return '        <a class="doc" href="' + e2(d.url) + '" target="_blank">\n' +
                 '          <span class="doc-icon">' + d.icon + '</span><span class="doc-name">' + e2(d.name) + '</span>\n' +
                 '          <span class="doc-tag" style="background:' + d.tagColor + '">' + e2(d.tag) + '</span>\n' +
                 '        </a>';
        }
        return '        <div class="doc" data-url="' + e2(d.url) + '" data-title="' + e2(d.name) + '">\n' +
               '          <span class="doc-icon">' + d.icon + '</span><span class="doc-name">' + e2(d.name) + '</span>\n' +
               '          <span class="doc-tag" style="background:' + d.tagColor + '">' + e2(d.tag) + '</span>\n' +
               '        </div>';
      }).join('\n');
      content = '      <div class="doc-list">\n' + docsH + '\n      </div>';
    }

    return '    <div class="section" data-type="' + b.type + '">\n' + hdr + '\n' + content + '\n    </div>';
  }).join('\n\n');
}

function generateFullHTML() {
  const assets = getAssetsPath();
  const sections = genSectionsHTML();

  return '<!DOCTYPE html>\n' +
'<html lang="fr">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>' + e2(M.title) + '</title>\n' +
'<link rel="stylesheet" href="' + assets + '/css/commun.css">\n' +
'<link rel="stylesheet" href="' + assets + '/css/chapitre.css">\n' +
'</head>\n' +
'<body>\n' +
'<div id="wrap">\n' +
'  <div class="paper">\n' +
'    <div class="holes"><div class="hole"></div><div class="hole"></div><div class="hole"></div><div class="hole"></div></div>\n' +
'    <a class="back" href="' + e2(M.back) + '">' + e2(M.backLbl) + '</a>\n' +
'    <div class="tape-label" style="background:var(--color)22;color:var(--color)">' + e2(M.theme) + '</div>\n' +
'    <div class="page-header">\n' +
'      <div>\n' +
'        <div class="exp-tag">' + e2(M.cls) + ' — Physique - Chimie</div>\n' +
'        <h1><em>' + e2(M.num) + '</em> — ' + e2(M.name) + '</h1>\n' +
'      </div>\n' +
'      <div class="ph-right">\n' +
'        <div class="ph-num">Chapitre ' + e2(M.num) + '</div>\n' +
'        <div>' + e2(M.cls) + '</div>\n' +
'      </div>\n' +
'    </div>\n\n' +
sections + '\n\n' +
'  </div>\n' +
'</div>\n' +
'<div id="viewer">\n' +
'  <div id="viewer-bar">\n' +
'    <span id="viewer-title">Document</span>\n' +
'    <a id="viewer-newTab" href="#" target="_blank">Ouvrir dans un onglet</a>\n' +
'    <button id="viewer-close">&#x2715;</button>\n' +
'  </div>\n' +
'  <iframe id="viewer-frame" src="about:blank" allowfullscreen></iframe>\n' +
'</div>\n' +
'<script src="' + assets + '/js/chapitre.js"><\/script>\n' +
'<script src="' + assets + '/js/admin-chapitre.js"><\/script>\n' +
'</body>\n' +
'</html>';
}

/* ── GitHub API ────────────────────────────────────────────── */
async function publishToGitHub() {
  const token = localStorage.getItem(LS_TOKEN);
  if (!token) { setStatus('Entrez un token GitHub d\'abord', 'err'); return; }

  const ghPath = getGHPath();
  if (!ghPath) { setStatus('Chemin du fichier introuvable', 'err'); return; }

  const btn = document.getElementById('adm-pub-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Publication…'; }
  setStatus('Publication en cours…', 'info');

  try {
    const apiUrl = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + ghPath;
    const headers = {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };

    const branch = window._GH_BRANCH || _branch;

    // Récupérer le SHA actuel
    const getR = await fetch(apiUrl + '?ref=' + branch, { headers });
    const getJ = await getR.json();
    const sha  = getJ.sha || null;

    const html    = generateFullHTML();
    const content = btoa(unescape(encodeURIComponent(html)));
    const body    = { message: 'Admin: mise à jour ' + ghPath, content, branch };
    if (sha) body.sha = sha;

    const putR = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
    const putJ = await putR.json();

    if (putR.ok) {
      setStatus('✓ Publié ! Mise à jour dans ~1 min.', 'ok');
    } else {
      setStatus('Erreur : ' + (putJ.message || putR.status), 'err');
    }
  } catch (e) {
    setStatus('Erreur réseau : ' + e.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⬆ Publier sur GitHub'; }
  }
}

async function testToken() {
  const token = localStorage.getItem(LS_TOKEN);
  if (!token) { setStatus('Entrez un token d\'abord', 'err'); return; }
  setStatus('Vérification…', 'info');
  try {
    const h = { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' };
    const uR   = await fetch('https://api.github.com/user', { headers: h });
    const user = await uR.json();
    const rR   = await fetch('https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO, { headers: h });
    const repo = await rR.json();
    _branch = repo.default_branch || 'main';
    window._GH_BRANCH = _branch;
    setStatus('✓ ' + user.login + ' · ' + repo.full_name + ' · ' + _branch, 'ok');
  } catch (e) {
    setStatus('Erreur : ' + e.message, 'err');
  }
}

/* ── Helpers UI ────────────────────────────────────────────── */
function setStatus(msg, type) {
  const el = document.getElementById('adm-status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === 'ok' ? '#2a5c3a' : type === 'err' ? '#a63020' : '#7a6a50';
}

function getVal(id)    { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }

/* ── Rendu éditeur ─────────────────────────────────────────── */
function renderAdmin() {
  const token = localStorage.getItem(LS_TOKEN) || '';
  const ghPath = getGHPath();

  const sectionsHTML = S.map(function (b, i) {
    const isOpen = _expanded.has(b.id);

    // Header de section (toujours visible)
    const headerRow =
      '<div class="ae-sec-hdr" onclick="window._admToggleSec(\'' + b.id + '\')">' +
        '<span class="ae-sec-dot" style="background:' + b.color + '"></span>' +
        '<span class="ae-sec-lbl">' + e2(b.label) + '</span>' +
        '<span class="ae-sec-ttl">' + e2(b.title) + '</span>' +
        '<span class="ae-sec-acts">' +
          (i > 0 ? '<button onclick="event.stopPropagation();window._admMoveBloc(' + i + ',-1)" title="Monter">↑</button>' : '') +
          (i < S.length - 1 ? '<button onclick="event.stopPropagation();window._admMoveBloc(' + i + ',1)" title="Descendre">↓</button>' : '') +
          '<button class="ae-btn-del" onclick="event.stopPropagation();window._admDelBloc(' + i + ')" title="Supprimer">✕</button>' +
        '</span>' +
      '</div>';

    if (!isOpen) {
      return '<div class="ae-sec ae-sec-closed" id="ae-sec-' + b.id + '">' + headerRow + '</div>';
    }

    // Champs d'édition section
    const labelSelect = '<select onchange="window._admUpdBloc(' + i + ',\'label\',this.value)">' +
      LABELS.map(function (l) { return '<option value="' + l + '"' + (b.label === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') +
      '</select>';

    const colorSwatches = PALETTE.map(function (c) {
      return '<span class="ae-swatch' + (b.color === c ? ' ae-swatch-sel' : '') + '" style="background:' + c + '" ' +
        'onclick="window._admUpdBloc(' + i + ',\'color\',\'' + c + '\');this.closest(\'.ae-sec\').querySelectorAll(\'.ae-swatch\').forEach(function(s){s.classList.remove(\'ae-swatch-sel\')});this.classList.add(\'ae-swatch-sel\');document.querySelector(\'#ae-sec-' + b.id + ' .ae-sec-dot\').style.background=\'' + c + '\'"></span>';
    }).join('');

    const titleInput = '<input type="text" value="' + e2(b.title) + '" placeholder="Titre du bloc" ' +
      'oninput="window._admUpdBloc(' + i + ',\'title\',this.value);this.closest(\'.ae-sec\').querySelector(\'.ae-sec-ttl\').textContent=this.value">';

    // Docs
    let docsHTML = '';
    if (b.type === 'docs') {
      docsHTML = (b.docs || []).map(function (d, di) {
        const iconOpts = ICONS.map(function (ic) {
          return '<option value="' + ic + '"' + (d.icon === ic ? ' selected' : '') + '>' + ic + '</option>';
        }).join('');

        const tagOpts = Object.keys(TAGS).map(function (t) {
          return '<option value="' + t + '"' + (d.tag === t ? ' selected' : '') + '>' + t + '</option>';
        }).join('');

        const urlCls = d.url && !d.url.startsWith('LIEN_') ? ' ae-ok' : (d.url.startsWith('LIEN_') ? ' ae-ph' : '');

        return '<div class="ae-doc" id="ae-doc-' + d.id + '">' +
          '<div class="ae-doc-row">' +
            '<select class="ae-ico" onchange="window._admUpdDoc(' + i + ',' + di + ',\'icon\',this.value)">' + iconOpts + '</select>' +
            '<input type="text" class="ae-name" value="' + e2(d.name) + '" placeholder="Nom" ' +
              'oninput="window._admUpdDoc(' + i + ',' + di + ',\'name\',this.value)">' +
            (di > 0 ? '<button onclick="window._admMoveDoc(' + i + ',' + di + ',-1)" title="Monter">↑</button>' : '') +
            (di < b.docs.length - 1 ? '<button onclick="window._admMoveDoc(' + i + ',' + di + ',1)" title="Descendre">↓</button>' : '') +
            '<button class="ae-btn-del" onclick="window._admDelDoc(' + i + ',' + di + ')" title="Supprimer">✕</button>' +
          '</div>' +
          '<div class="ae-doc-row">' +
            '<input type="text" class="ae-url' + urlCls + '" value="' + e2(d.url) + '" placeholder="https://… ou LIEN_À_CONFIGURER" ' +
              'oninput="window._admUpdDoc(' + i + ',' + di + ',\'url\',this.value);this.className=\'ae-url\'+(this.value&&!this.value.startsWith(\'LIEN_\')?\' ae-ok\':(this.value.startsWith(\'LIEN_\')?\' ae-ph\':\''))">' +
          '</div>' +
          '<div class="ae-doc-row ae-doc-row-sm">' +
            '<select onchange="window._admUpdDoc(' + i + ',' + di + ',\'tag\',this.value);window._admUpdDoc(' + i + ',' + di + ',\'tagColor\',window._TAGS[this.value]||\'#555\')">' +
              tagOpts + '</select>' +
            '<input type="color" value="' + d.tagColor + '" style="width:28px;height:22px;border:none;border-radius:4px;cursor:pointer;padding:1px;background:#ede7d3;" ' +
              'oninput="window._admUpdDoc(' + i + ',' + di + ',\'tagColor\',this.value)">' +
            '<label style="display:flex;align-items:center;gap:4px;font-size:9px;color:#7a6a50;cursor:pointer;">' +
              '<input type="checkbox"' + (d.ext ? ' checked' : '') + ' onchange="window._admUpdDoc(' + i + ',' + di + ',\'ext\',this.checked)"> Onglet</label>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    const addDocBtn = b.type === 'docs'
      ? '<button class="ae-add-doc" onclick="window._admAddDoc(' + i + ')">+ Document</button>'
      : '';

    return '<div class="ae-sec ae-sec-open" id="ae-sec-' + b.id + '">' +
      headerRow +
      '<div class="ae-sec-body">' +
        '<div class="ae-sec-fields">' +
          '<div class="ae-row">' + labelSelect + colorSwatches + '</div>' +
          '<div class="ae-row">' + titleInput + '</div>' +
        '</div>' +
        (b.type === 'docs' ? '<div class="ae-docs-list">' + docsHTML + '</div>' : '') +
        addDocBtn +
      '</div>' +
    '</div>';
  }).join('');

  const pathDisplay = ghPath
    ? '<span style="font-size:9px;color:#7a6a50;font-family:monospace">' + ghPath + '</span>'
    : '<span style="font-size:9px;color:#a63020">Chemin introuvable</span>';

  document.getElementById('adm-body').innerHTML =
    /* Token */
    '<div class="ae-card">' +
      '<div class="ae-label">Token GitHub</div>' +
      '<div class="ae-row">' +
        '<input id="adm-token" type="password" placeholder="ghp_…" value="' + (token ? '●●●●●●●●' : '') + '" ' +
          'onfocus="if(this.value===\'●●●●●●●●\')this.value=\'\'" ' +
          'onblur="if(!this.value)this.value=\'' + (token ? '●●●●●●●●' : '') + '\'">' +
        '<button onclick="window._admSaveToken()" class="ae-btn-sm">Sauv.</button>' +
        '<button onclick="window._admTestToken()" class="ae-btn-sm">⚡</button>' +
        '<button onclick="window._admClearToken()" class="ae-btn-sm ae-btn-del">✕</button>' +
      '</div>' +
      '<div id="adm-status" style="font-size:10px;padding:4px 0;color:#7a6a50;min-height:16px"></div>' +
    '</div>' +

    /* Meta */
    '<div class="ae-card">' +
      '<div class="ae-label">En-tête</div>' +
      '<div class="ae-row">' +
        '<label>N°</label><input id="adm-num" type="text" value="' + e2(M.num) + '" style="max-width:48px" oninput="window._admUpdM(\'num\',this.value)">' +
        '<label>Nom</label><input id="adm-name" type="text" value="' + e2(M.name) + '" oninput="window._admUpdM(\'name\',this.value)">' +
      '</div>' +
      '<div class="ae-row">' +
        '<label>Thème</label><input id="adm-theme" type="text" value="' + e2(M.theme) + '" oninput="window._admUpdM(\'theme\',this.value)">' +
      '</div>' +
      '<div class="ae-row">' +
        '<label>Titre</label><input id="adm-title" type="text" value="' + e2(M.title) + '" oninput="window._admUpdM(\'title\',this.value)">' +
      '</div>' +
    '</div>' +

    /* Sections */
    '<div class="ae-card">' +
      '<div class="ae-label">Sections ' + pathDisplay + '</div>' +
      '<div id="ae-secs">' + sectionsHTML + '</div>' +
      '<button class="ae-add-sec" onclick="window._admAddSec()">+ Ajouter une section</button>' +
    '</div>' +

    /* Publier */
    '<div class="ae-card ae-pub-card">' +
      '<button id="adm-pub-btn" onclick="window._admPublish()" class="ae-pub-btn">⬆ Publier sur GitHub</button>' +
    '</div>';
}

/* ── Mutations ─────────────────────────────────────────────── */
window._admToggleSec = function (id) {
  if (_expanded.has(id)) _expanded.delete(id); else _expanded.add(id);
  renderAdmin();
};

window._admUpdM = function (k, v) { M[k] = v; };

window._admUpdBloc = function (i, k, v) {
  S[i][k] = v;
  if (k === 'label' || k === 'color') {
    // Mettre à jour le DOM du header sans re-render complet
    const el = document.getElementById('ae-sec-' + S[i].id);
    if (k === 'label' && el) el.querySelector('.ae-sec-lbl').textContent = v;
  }
};

window._admMoveBloc = function (i, dir) {
  const id = S[i].id;
  const [b] = S.splice(i, 1);
  S.splice(i + dir, 0, b);
  renderAdmin();
};

window._admDelBloc = function (i) {
  if (!confirm('Supprimer « ' + S[i].title + ' » ?')) return;
  _expanded.delete(S[i].id);
  S.splice(i, 1);
  renderAdmin();
};

window._admAddSec = function () {
  const id = nid();
  S.push({ id, type: 'docs', label: 'Activite', color: '#2a5c3a', title: 'Nouvelle section', docs: [] });
  _expanded.add(id);
  renderAdmin();
  setTimeout(function () {
    const el = document.getElementById('ae-sec-' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
};

window._admUpdDoc = function (bi, di, k, v) { S[bi].docs[di][k] = v; };

window._admMoveDoc = function (bi, di, dir) {
  const [d] = S[bi].docs.splice(di, 1);
  S[bi].docs.splice(di + dir, 0, d);
  renderAdmin();
};

window._admDelDoc = function (bi, di) {
  S[bi].docs.splice(di, 1);
  renderAdmin();
};

window._admAddDoc = function (bi) {
  S[bi].docs.push({
    id: nid(), icon: '📄', name: 'Nouveau document',
    tag: 'Document', tagColor: '#1c3d6e', url: 'LIEN_A_CONFIGURER', ext: false,
  });
  renderAdmin();
  setTimeout(function () {
    const docs = document.querySelectorAll('#ae-sec-' + S[bi].id + ' .ae-doc');
    if (docs.length) docs[docs.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
};

window._admSaveToken = function () {
  const inp = document.getElementById('adm-token');
  if (!inp || !inp.value || inp.value === '●●●●●●●●') return;
  localStorage.setItem(LS_TOKEN, inp.value.trim());
  inp.value = '●●●●●●●●';
  setStatus('Token sauvegardé', 'ok');
};

window._admClearToken = function () {
  localStorage.removeItem(LS_TOKEN);
  const inp = document.getElementById('adm-token');
  if (inp) inp.value = '';
  setStatus('Token supprimé', 'info');
};

window._admTestToken  = testToken;
window._admPublish    = publishToGitHub;
window._TAGS          = TAGS;

/* ── CSS du panneau ────────────────────────────────────────── */
function injectCSS() {
  const style = document.createElement('style');
  style.textContent =
    /* FAB */
    '#adm-fab{position:fixed;bottom:22px;right:22px;z-index:9990;' +
      'width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;' +
      'background:var(--ink,#1c1208);color:var(--paper,#f6f1e4);' +
      'font-size:18px;box-shadow:0 3px 12px rgba(0,0,0,.35);' +
      'display:flex;align-items:center;justify-content:center;transition:transform .15s;}' +
    '#adm-fab:hover{transform:scale(1.1);}' +

    /* Drawer */
    '#adm-drawer{position:fixed;top:0;right:-380px;width:370px;height:100vh;z-index:9991;' +
      'background:var(--paper,#f6f1e4);border-left:1.5px solid rgba(28,18,8,.15);' +
      'box-shadow:-4px 0 24px rgba(0,0,0,.18);transition:right .22s cubic-bezier(.4,0,.2,1);' +
      'display:flex;flex-direction:column;overflow:hidden;}' +
    '#adm-drawer.adm-open{right:0;}' +

    /* Header tiroir */
    '#adm-head{display:flex;align-items:center;gap:10px;padding:14px 16px;' +
      'border-bottom:1.5px solid rgba(28,18,8,.1);flex-shrink:0;background:var(--ink,#1c1208);color:var(--paper,#f6f1e4);}' +
    '#adm-head-title{font-size:11px;letter-spacing:2px;text-transform:uppercase;flex:1;}' +
    '#adm-close{background:none;border:none;color:var(--paper,#f6f1e4);font-size:18px;cursor:pointer;padding:0 2px;line-height:1;}' +
    '#adm-close:hover{opacity:.7;}' +

    /* Corps scrollable */
    '#adm-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;}' +

    /* Cartes */
    '.ae-card{background:rgba(255,255,255,.5);border:1px solid rgba(28,18,8,.1);border-radius:8px;padding:12px;}' +
    '.ae-label{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#7a6a50;margin-bottom:8px;display:flex;align-items:center;gap:8px;}' +
    '.ae-row{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;}' +
    '.ae-row label{font-size:9px;color:#7a6a50;white-space:nowrap;}' +
    '.ae-row input:not([type=checkbox]):not([type=color]),.ae-row select,.ae-row textarea{flex:1;min-width:0;' +
      'background:#fff;border:1px solid rgba(28,18,8,.15);border-radius:5px;padding:5px 7px;' +
      'font-size:11px;color:#1c1208;font-family:inherit;outline:none;}' +
    '.ae-row input:focus,.ae-row select:focus{border-color:#1c3d6e;}' +
    '.ae-btn-sm{background:rgba(28,18,8,.07);border:1px solid rgba(28,18,8,.15);border-radius:5px;' +
      'padding:4px 8px;font-size:10px;cursor:pointer;color:#1c1208;white-space:nowrap;}' +
    '.ae-btn-sm:hover{background:rgba(28,18,8,.12);}' +
    '.ae-btn-del{background:rgba(166,48,32,.08)!important;color:#a63020!important;border-color:rgba(166,48,32,.25)!important;}' +
    '.ae-btn-del:hover{background:rgba(166,48,32,.15)!important;}' +

    /* Sections */
    '.ae-sec{border:1px solid rgba(28,18,8,.1);border-radius:7px;overflow:hidden;margin-bottom:6px;}' +
    '.ae-sec-closed .ae-sec-hdr{background:rgba(255,255,255,.4);}' +
    '.ae-sec-open .ae-sec-hdr{background:rgba(28,18,8,.06);}' +
    '.ae-sec-hdr{display:flex;align-items:center;gap:7px;padding:8px 10px;cursor:pointer;' +
      'user-select:none;transition:background .1s;}' +
    '.ae-sec-hdr:hover{background:rgba(28,18,8,.05);}' +
    '.ae-sec-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}' +
    '.ae-sec-lbl{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#7a6a50;flex-shrink:0;}' +
    '.ae-sec-ttl{font-size:11px;color:#1c1208;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.ae-sec-acts{display:flex;gap:3px;flex-shrink:0;}' +
    '.ae-sec-acts button{background:none;border:none;cursor:pointer;font-size:11px;color:#7a6a50;padding:1px 3px;border-radius:3px;}' +
    '.ae-sec-acts button:hover{background:rgba(28,18,8,.1);color:#1c1208;}' +
    '.ae-sec-body{padding:10px;border-top:1px solid rgba(28,18,8,.07);display:flex;flex-direction:column;gap:8px;}' +
    '.ae-sec-fields{display:flex;flex-direction:column;gap:5px;}' +

    /* Swatches couleur */
    '.ae-swatch{display:inline-block;width:18px;height:16px;border-radius:3px;cursor:pointer;' +
      'border:2px solid transparent;transition:transform .1s;}' +
    '.ae-swatch:hover{transform:scale(1.2);border-color:rgba(0,0,0,.3);}' +
    '.ae-swatch-sel{border-color:#1c1208!important;}' +

    /* Docs */
    '.ae-docs-list{display:flex;flex-direction:column;gap:6px;}' +
    '.ae-doc{background:rgba(255,255,255,.6);border:1px solid rgba(28,18,8,.1);border-radius:6px;padding:8px 9px;' +
      'display:flex;flex-direction:column;gap:5px;}' +
    '.ae-doc-row{display:flex;align-items:center;gap:5px;}' +
    '.ae-doc-row input:not([type=checkbox]):not([type=color]),.ae-doc-row select{flex:1;min-width:0;' +
      'background:#fff;border:1px solid rgba(28,18,8,.15);border-radius:4px;padding:4px 6px;' +
      'font-size:10px;color:#1c1208;font-family:inherit;outline:none;}' +
    '.ae-doc-row input:focus,.ae-doc-row select:focus{border-color:#1c3d6e;}' +
    '.ae-doc-row button{background:none;border:none;cursor:pointer;font-size:10px;color:#7a6a50;padding:1px 3px;border-radius:3px;}' +
    '.ae-doc-row button:hover{background:rgba(28,18,8,.1);}' +
    '.ae-ico{max-width:46px;flex:none!important;}' +
    '.ae-name{flex:1;}' +
    '.ae-url{font-size:10px!important;}' +
    '.ae-ok{border-color:rgba(42,92,58,.5)!important;}' +
    '.ae-ph{border-color:rgba(217,119,6,.5)!important;}' +
    '.ae-doc-row-sm{flex-wrap:wrap;}' +

    /* Boutons ajouter */
    '.ae-add-doc,.ae-add-sec{width:100%;padding:6px;border:1px dashed rgba(28,18,8,.2);' +
      'background:transparent;border-radius:6px;cursor:pointer;font-size:10px;color:#7a6a50;' +
      'font-family:inherit;transition:all .15s;}' +
    '.ae-add-doc:hover,.ae-add-sec:hover{border-color:#1c3d6e;color:#1c3d6e;}' +
    '.ae-add-sec{margin-top:4px;}' +

    /* Publier */
    '.ae-pub-card{background:none!important;border:none!important;padding:4px 0!important;}' +
    '.ae-pub-btn{width:100%;padding:11px;background:var(--ink,#1c1208);color:var(--paper,#f6f1e4);' +
      'border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;' +
      'font-family:inherit;letter-spacing:.5px;transition:opacity .15s;}' +
    '.ae-pub-btn:hover{opacity:.85;}' +
    '.ae-pub-btn:disabled{opacity:.4;cursor:not-allowed;}';

  document.head.appendChild(style);
}

/* ── HTML du panneau ───────────────────────────────────────── */
function injectHTML() {
  const fab = document.createElement('button');
  fab.id        = 'adm-fab';
  fab.title     = 'Admin';
  fab.innerHTML = '⚙';
  fab.addEventListener('click', function () { toggleDrawer(); });

  const drawer = document.createElement('div');
  drawer.id        = 'adm-drawer';
  drawer.innerHTML =
    '<div id="adm-head">' +
      '<span id="adm-head-title">⚙ Admin — chapitre</span>' +
      '<button id="adm-close" onclick="document.getElementById(\'adm-drawer\').classList.remove(\'adm-open\')" title="Fermer">×</button>' +
    '</div>' +
    '<div id="adm-body"></div>';

  document.body.appendChild(fab);
  document.body.appendChild(drawer);
}

function toggleDrawer() {
  const drawer = document.getElementById('adm-drawer');
  const opening = !drawer.classList.contains('adm-open');
  drawer.classList.toggle('adm-open');
  if (opening) {
    readPage();
    renderAdmin();
  }
}

/* ── Init ──────────────────────────────────────────────────── */
function init() {
  injectCSS();
  injectHTML();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
