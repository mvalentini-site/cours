"""Génère 5eme/documents/index.html à partir des « Liens de partage.md » de chaque chapitre.

Usage :  python generer.py ["G:/Mon Drive/00 5ème"]
Les évaluations (Eval_*, Évaluation*) et les sources LaTeX (.tex) sont exclues.
Mise en page façon Classroom : un onglet vertical par chapitre, une carte par chapitre
avec une ligne repliable par rubrique (cours, activités, exercices, vidéos, corrigés).
"""
import html
import re
import sys
from pathlib import Path

RACINE = Path(sys.argv[1] if len(sys.argv) > 1 else "G:/Mon Drive/00 5ème")
SORTIE = Path(__file__).with_name("index.html")

EXCLUS = re.compile(r"^(Eval|Éval|Evaluation|Évaluation)", re.I)

CATEGORIES = [
    ("cours", "Cours et fiches"),
    ("act", "Activités"),
    ("exo", "Exercices et suivi"),
    ("media", "Vidéos et diaporamas"),
    ("corr", "Corrigés"),
]

FORMATS = {
    ".pdf": "PDF", ".docx": "Word", ".odt": "ODT", ".mp4": "Vidéo",
    ".jpg": "Image", ".jpeg": "Image", ".png": "Image",
}

ICONES = {
    "cours": '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
    "act": '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
    "exo": '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
    "media": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    "corr": '<path d="M5 12l4 4 10-10"/>',
}


def categorie(nom, url):
    n = nom.lower()
    if "corrig" in n:
        return "corr"
    if n.endswith(".mp4") or "/presentation/" in url:
        return "media"
    if re.match(r"^(x )?act|^activit|^schéma", n):
        return "act"
    if re.match(r"^(fiche_exercices|exos|exercice|\d+ exercices|qcm|pdt|plan_de_travail|fiche suivi)", n):
        return "exo"
    return "cours"


def format_de(nom, url):
    ext = Path(nom).suffix.lower()
    if ext in FORMATS:
        return FORMATS[ext]
    if "/presentation/" in url:
        return "Slides"
    if "/document/" in url:
        return "Google Doc"
    return ext.lstrip(".").upper() or "Lien"


def titre_affiche(nom):
    t = Path(nom).stem if Path(nom).suffix.lower() in FORMATS else nom
    return t.replace("_", " ").strip()


def lire_chapitre(dossier):
    md = dossier / "Liens de partage.md"
    docs = []
    for ligne in md.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\|\s*(.+?)\s*\|\s*(https://\S+?)\s*\|$", ligne)
        if not m:
            continue
        nom, url = m.groups()
        if EXCLUS.match(nom) or nom.lower().endswith(".tex"):
            continue
        docs.append((nom, url))
    return docs


def icone(cle):
    return (f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONES[cle]}</svg>')


def bloc_chapitre(num, titre, docs):
    groupes = {c: [] for c, _ in CATEGORIES}
    for nom, url in docs:
        groupes[categorie(nom, url)].append((nom, url))
    lignes = []
    for cle, libelle in CATEGORIES:
        if not groupes[cle]:
            continue
        n = len(groupes[cle])
        liens = "\n".join(
            f'          <a class="piece" href="{html.escape(url)}" target="_blank" rel="noopener">'
            f'<span class="nom">{html.escape(titre_affiche(nom))}</span>'
            f'<span class="fmt">{format_de(nom, url)}</span></a>'
            for nom, url in sorted(groupes[cle], key=lambda d: titre_affiche(d[0]).lower())
        )
        lignes.append(
            f'      <details class="ligne {cle}">\n'
            f'        <summary><span class="ico">{icone(cle)}</span>'
            f'<span class="lib">{libelle}</span>'
            f'<span class="nb">{n} document{"s" if n > 1 else ""}</span></summary>\n'
            f'        <div class="pieces">\n{liens}\n        </div>\n'
            f'      </details>'
        )
    return (
        f'    <section class="chap" id="ch{num}" aria-labelledby="t{num}">\n'
        f'      <h2 id="t{num}">Chapitre {int(num)} : {html.escape(titre)}</h2>\n'
        + "\n".join(lignes)
        + "\n    </section>"
    )


def main():
    chapitres = []
    for d in sorted(RACINE.iterdir()):
        m = re.match(r"^(\d\d) (.+)$", d.name)
        if d.is_dir() and m and (d / "Liens de partage.md").exists():
            chapitres.append((m.group(1), m.group(2), lire_chapitre(d)))

    nav = "\n".join(
        f'      <a href="#ch{n}" data-ch="ch{n}"><b>{int(n)}</b><span>{html.escape(t)}</span>'
        f'<i>{len(docs)}</i></a>'
        for n, t, docs in chapitres
    )
    sections = "\n\n".join(bloc_chapitre(n, t, docs) for n, t, docs in chapitres)
    total = sum(len(docs) for _, _, docs in chapitres)

    page = GABARIT.replace("{{NAV}}", nav).replace("{{SECTIONS}}", sections)
    page = page.replace("{{TOTAL}}", str(total)).replace("{{NB}}", str(len(chapitres)))
    SORTIE.write_text(page, encoding="utf-8")
    print(f"{SORTIE} : {len(chapitres)} chapitres, {total} documents")


GABARIT = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Documents 5ème</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/parcours.css">
<link rel="stylesheet" href="../../assets/css/archive.css">
<!-- Page générée par generer.py — ne pas modifier à la main -->
</head>
<body class="niveau-5e">

<header class="topbar">
  <div class="crumb"><a href="../../index.html#5eme">5ème</a><span>/</span><b>Documents</b></div>
  <nav>
    <a href="../../index.html#accueil">Accueil</a>
    <a href="../../index.html#1ere-spe">1res Spé</a>
    <a href="../../index.html#1ere-ens">Ens. Sci.</a>
    <a href="../../index.html#5eme" aria-current="page">5ème</a>
    <a href="../../index.html#4eme">4ème</a>
    <a href="../../index.html#outils">Outils</a>
  </nav>
</header>

<div class="page">
  <div class="kicker">Physique-chimie · 5ème</div>
  <h1>Documents des chapitres</h1>
  <p class="lead">{{TOTAL}} documents répartis sur {{NB}} chapitres. Choisis un chapitre, puis ouvre une rubrique : chaque lien ouvre le fichier dans Google Drive, dans un nouvel onglet.</p>

  <div class="archive">
    <nav class="onglets" aria-label="Chapitres">
      <input class="filtre" type="search" placeholder="Rechercher un document…" aria-label="Rechercher un document">
{{NAV}}
    </nav>

    <main>
      <input class="filtre" type="search" placeholder="Rechercher un document…" aria-label="Rechercher un document">
{{SECTIONS}}
      <p class="vide" id="vide">Aucun document ne correspond.</p>
    </main>
  </div>
</div>

<script src="../../assets/js/archive.js"></script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
