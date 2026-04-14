"""
Script: make_chapter.py
Lit un fichier Word (modele de chapitre) et genere la page HTML correspondante.
Usage: python3 make_chapter.py "fiche_chapitre.docx"
"""

import sys
import os
import re
from docx import Document

COLORS = {
    'cours':    '#1c3d6e',
    'activite': '#2a5c3a',
    'td':       '#3a2010',
    'situation':'#3a1c6b',
    'corrige':  '#5c2a2a',
    'video':    '#5a3a1c',
    'simulation':'#1c4a4a',
    'digiwall': '#6b3a1c',
    'lien':     '#3a3a1c',
}

ICONS = {
    'cours':     '&#128196;',
    'activite':  '&#128196;',
    'td':        '&#128196;',
    'corrige':   '&#128196;',
    'video':     '&#9654;',
    'simulation':'&#127918;',
    'digiwall':  '&#128228;',
    'lien':      '&#128279;',
    'experience':'&#128300;',
}

def color(key): return COLORS.get(key.lower(), '#3a2010')
def icon(key):  return ICONS.get(key.lower(), '&#128196;')

def read_docx(path):
    doc = Document(path)
    data = {}
    sections = []
    current_section = None

    for para in doc.paragraphs:
        text = para.text.strip()
        style = para.style.name.lower()

        if not text:
            continue

        if style == 'heading 1':
            # Ex: "Chapitre 11 - Fluides au repos"
            data['titre_complet'] = text

        elif style == 'heading 2':
            # Ex: "Numero: 11" ou "Niveau: 1re Spe" etc.
            if ':' in text:
                k, v = text.split(':', 1)
                data[k.strip().lower()] = v.strip()

        elif style == 'heading 3':
            # Nouvelle section: "Cours", "Activite 11A", "TD", etc.
            if current_section:
                sections.append(current_section)
            label = text.split('|')[0].strip()
            tag   = text.split('|')[1].strip() if '|' in text else label.split()[0]
            current_section = {'label': label, 'tag': tag, 'docs': []}

        elif style in ('list paragraph', 'list bullet') or text.startswith('-'):
            # Document: "Nom du doc | type | lien"
            if current_section is not None:
                raw = text.lstrip('-').strip()
                parts = [p.strip() for p in raw.split('|')]
                if len(parts) >= 1:
                    doc_entry = {
                        'nom':  parts[0],
                        'type': parts[1] if len(parts) > 1 else 'document',
                        'lien': parts[2] if len(parts) > 2 else '',
                        'newtab': parts[1].lower() in ('digiwall','simulation','lien') if len(parts) > 1 else False,
                    }
                    current_section['docs'].append(doc_entry)

    if current_section:
        sections.append(current_section)

    data['sections'] = sections
    return data


def build_html(data):
    titre = data.get('titre_complet', 'Chapitre')
    num   = data.get('numero', '?')
    categ = data.get('categorie', 'Physique - Chimie')
    niveau= data.get('niveau', '1re Specialite')

    # Titre affichage
    titre_sans_num = re.sub(r'^chapitre\s*\d+\s*[-–]\s*', '', titre, flags=re.IGNORECASE)

    sections_html = ''
    for sec in data['sections']:
        docs_html = ''
        for d in sec['docs']:
            lien = d['lien']
            typ  = d['type'].lower()
            if d['newtab'] or typ in ('digiwall','simulation','lien'):
                docs_html += f'''
        <a class="doc" href="{lien}" target="_blank">
          <span class="doc-icon">{icon(typ)}</span>
          <span class="doc-name">{d["nom"]}</span>
          <span class="doc-tag" style="background:{color(typ)}">{d["type"]}</span>
        </a>'''
            else:
                data_url = lien if lien else f'LIEN_{d["nom"].upper().replace(" ","_")}'
                docs_html += f'''
        <div class="doc" data-url="{data_url}" data-title="{d["nom"]}">
          <span class="doc-icon">{icon(typ)}</span>
          <span class="doc-name">{d["nom"]}</span>
          <span class="doc-tag" style="background:{color(typ)}">{d["type"]}</span>
        </div>'''

        col = color(sec['tag'].split()[0].lower())
        sections_html += f'''
    <div class="section">
      <div class="sec-header">
        <span class="sec-label" style="background:{col}">{sec["tag"]}</span>
        <span class="sec-title">{sec["label"]}</span>
        <span class="sec-toggle">&#9658;</span>
      </div>
      <div class="doc-list">{docs_html}
      </div>
    </div>
'''

    # Chemin relatif vers assets/ depuis le dossier du chapitre (2 niveaux : niveau/chapitre/)
    assets = '../../assets'

    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chapitre {num} - {titre_sans_num}</title>
<link rel="stylesheet" href="{assets}/css/commun.css">
<link rel="stylesheet" href="{assets}/css/chapitre.css">
</head>
<body>
<div id="wrap">
  <div class="paper">
    <div class="holes"><div class="hole"></div><div class="hole"></div><div class="hole"></div><div class="hole"></div></div>
    <a class="back" href="../../index.html">← Retour</a>
    <div class="tape-label" style="background:var(--color)22;color:var(--color)">{categ}</div>
    <div class="page-header">
      <div>
        <div class="exp-tag">{niveau} - Physique - Chimie</div>
        <h1><em>{num}</em> - {titre_sans_num}</h1>
      </div>
      <div class="ph-right">
        <div class="ph-num">Chapitre {num}</div>
        <div>{niveau}</div>
      </div>
    </div>
{sections_html}
  </div>
</div>
<div id="viewer">
  <div id="viewer-bar">
    <span id="viewer-title">Document</span>
    <a id="viewer-newTab" href="#" target="_blank">Ouvrir dans un onglet</a>
    <button id="viewer-close">✕</button>
  </div>
  <iframe id="viewer-frame" src="about:blank" allowfullscreen></iframe>
</div>
<script src="{assets}/js/chapitre.js"></script>
</body>
</html>'''


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 make_chapter.py fiche_chapitre.docx [dossier_sortie]")
        sys.exit(1)
    docx_path = sys.argv[1]
    out_dir   = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(docx_path)
    data = read_docx(docx_path)
    html = build_html(data)
    out_path = os.path.join(out_dir, 'index.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Page generee : {out_path}")
