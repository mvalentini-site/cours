"""Génère 5eme/documents/index.html à partir des « Liens de partage.md » de chaque chapitre.

Usage :  python generer.py ["G:/Mon Drive/00 5ème"]
Les évaluations (Eval_*, Évaluation*) et les sources LaTeX (.tex) sont exclues.
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


def bloc_chapitre(num, titre, docs):
    groupes = {c: [] for c, _ in CATEGORIES}
    for nom, url in docs:
        groupes[categorie(nom, url)].append((nom, url))
    parts = []
    for cle, libelle in CATEGORIES:
        if not groupes[cle]:
            continue
        liens = "\n".join(
            f'        <a class="doc{" corrige" if cle == "corr" else ""}" href="{html.escape(url)}" '
            f'target="_blank" rel="noopener">{html.escape(titre_affiche(nom))}'
            f'<span class="fmt">{format_de(nom, url)}</span></a>'
            for nom, url in sorted(groupes[cle], key=lambda d: d[0].lower())
        )
        parts.append(f'      <div class="groupe"><h3>{libelle}</h3>\n      <div class="docs">\n{liens}\n      </div></div>')
    return (
        f'    <section class="chap" id="ch{num}">\n'
        f'      <h2><span class="n">{int(num)}</span>{html.escape(titre)}</h2>\n'
        + "\n".join(parts)
        + "\n    </section>"
    )


def main():
    chapitres = []
    for d in sorted(RACINE.iterdir()):
        m = re.match(r"^(\d\d) (.+)$", d.name)
        if d.is_dir() and m and (d / "Liens de partage.md").exists():
            chapitres.append((m.group(1), m.group(2), lire_chapitre(d)))

    nav = "\n".join(
        f'      <a href="#ch{n}"><b>{int(n)}</b> {html.escape(t)}</a>' for n, t, _ in chapitres
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
<style>
  /* Page générée par generer.py — ne pas modifier à la main */
  .page{max-width:1000px;margin:0 auto;padding:40px clamp(16px,4vw,48px) 96px;}
  .lead{font-size:16px;color:var(--faded);max-width:62ch;margin-bottom:22px;}
  .sommaire{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;}
  .sommaire a{font-size:14px;text-decoration:none;padding:5px 12px;border:1px solid var(--rule);border-radius:999px;background:var(--surface);}
  .sommaire a:hover{border-color:var(--accent);}
  .sommaire b{color:var(--accent);margin-right:2px;}
  .filtre{width:100%;max-width:360px;font:inherit;font-size:15px;padding:8px 12px;border:1px solid var(--rule);border-radius:4px;background:var(--surface);color:var(--ink);margin-bottom:8px;}
  .filtre:focus{outline:none;border-color:var(--accent);}
  .chap{padding-top:34px;margin-top:34px;border-top:1px solid var(--rule);scroll-margin-top:12px;}
  .chap h2{display:flex;align-items:baseline;gap:12px;font-size:clamp(22px,2.6vw,28px);font-weight:800;letter-spacing:-.015em;line-height:1.15;margin-bottom:14px;}
  .chap h2 .n{flex-shrink:0;width:38px;height:38px;border-radius:50%;background:var(--accent);color:var(--paper);font-size:17px;display:inline-flex;align-items:center;justify-content:center;transform:translateY(-3px);}
  .groupe{margin:14px 0 0 50px;}
  .groupe h3{font-size:14px;font-weight:600;color:var(--faded);margin-bottom:8px;}
  .doc{font-size:15px;padding:7px 10px 7px 12px;--c:var(--accent);}
  .doc .fmt{font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--faded2);border-left:1px solid var(--rule);padding-left:8px;}
  [hidden]{display:none!important;}
  .vide{display:none;font-size:15px;color:var(--faded);margin-top:24px;}
  @media (max-width:820px){ .groupe{margin-left:0;} }
</style>
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
  <p class="lead">{{TOTAL}} documents répartis sur {{NB}} chapitres. Chaque lien ouvre le fichier dans Google Drive, dans un nouvel onglet.</p>
  <nav class="sommaire" aria-label="Chapitres">
{{NAV}}
  </nav>
  <input class="filtre" id="filtre" type="search" placeholder="Rechercher un document…" aria-label="Rechercher un document">

  <main>
{{SECTIONS}}
    <p class="vide" id="vide">Aucun document ne correspond.</p>
  </main>
</div>

<script>
const filtre = document.getElementById('filtre');
const norm = s => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
filtre.addEventListener('input', () => {
  const q = norm(filtre.value.trim());
  let total = 0;
  document.querySelectorAll('.chap').forEach(ch => {
    let nChap = 0;
    ch.querySelectorAll('.groupe').forEach(g => {
      let n = 0;
      g.querySelectorAll('.doc').forEach(a => {
        const ok = !q || norm(a.textContent).includes(q);
        a.hidden = !ok; if (ok) n++;
      });
      g.hidden = !n; nChap += n;
    });
    ch.hidden = !nChap; total += nChap;
  });
  document.getElementById('vide').style.display = total ? 'none' : 'block';
});
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
