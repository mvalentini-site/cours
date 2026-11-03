"""Génère 1ere-spe/documents/index.html à partir des « Liens de partage.md » de chaque chapitre.

Usage :  python generer.py ["G:/Mon Drive/00 1ère"]
Mise en page façon Classroom (styles et script communs : assets/css/archive.css, assets/js/archive.js) :
un onglet vertical par chapitre ; dans la carte du chapitre, une ligne repliable pour la fiche
synthèse et les vidéos, une pour le plan de travail, une par activité (énoncé + corrigé),
une pour les exercices et corrigés.
Exclus : évaluations (Eval_*, Évaluation*), sources (.tex, .html), vidéos brutes de pointage (.avi),
fichiers de logiciels (.lab, .h5p), consignes de correction et relevés de résultats.
"""
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

RACINE = Path(sys.argv[1] if len(sys.argv) > 1 else "G:/Mon Drive/00 1ère")
SORTIE = Path(__file__).with_name("index.html")
SOMMAIRE = Path(__file__).resolve().parents[2] / "data" / "sommaire-1ere-spe.json"

EXCLUS = re.compile(
    r"^(eval|éval|evaluation|évaluation|consigne de correction|da - |valeurs |r[ée]sul?tats|capture )"
    r"|\(1\)\.\w+$|\.(tex|html|avi|lab|h5p)$", re.I)

FORMATS = {
    ".pdf": "PDF", ".docx": "Word", ".odt": "ODT", ".mp4": "Vidéo", ".py": "Python", ".txt": "Texte",
    ".jpg": "Image", ".jpeg": "Image", ".png": "Image",
}

# Rubriques hors activités, dans l'ordre d'affichage ; les activités se placent entre « plan » et « exo »
RUBRIQUES = {
    "cours": "Fiche synthèse et vidéos de cours",
    "plan": "Plan de travail et compétences",
    "exo": "Exercices et corrigés",
    "autre": "Autres documents",
}

ICONES = {
    "cours": '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
    "plan": '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    "act": '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
    "exo": '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
    "autre": '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
}

# « Act 7A », « Act_1E », « Ac 15C », « Fiche_eval_groupe_Act1D », « Protocole Activité 4B »
CLE_ACT = re.compile(r"(?<![a-z])(?:act|ac|activit[ée])[ _]?(\d{1,2}[a-z])(?![a-z0-9])", re.I)
PREFIXE_ACT = re.compile(r"^(?:act|ac|activit[ée])[ _]?\d{1,2}[a-z][ _-]*", re.I)


def rubrique(nom, url):
    n = nom.lower()
    if (re.match(r"^(fs |cours|ft |fte |fm |fiche m[ée]thode|outil math|vid[ée]os)", n)
            or "_vid_" in n or n.endswith(".mp4")):
        return "cours"
    if re.match(r"^(plan de travail|comp[ée]tences|tableaux_comp|fiche suivi)", n):
        return "plan"
    if (re.search(r"exercices|\bexos?\b|corrig[ée] des|corrig[ée] td|corrige_|flash test|devoir maison", n)
            or re.match(r"^(td |exo|sujet |ece_|pc-gene|1gen_|pcm_|\d{4}_\d\d_dr)", n)):
        return "exo"
    return "autre"


def format_de(nom, url):
    ext = Path(nom).suffix.lower()
    if ext in FORMATS:
        return FORMATS[ext]
    if "/folders/" in url:
        return "Dossier"
    if "/presentation/" in url:
        return "Slides"
    if "/document/" in url:
        return "Google Doc"
    return "Lien"


def titre_affiche(nom):
    t = Path(nom).stem if Path(nom).suffix.lower() in FORMATS else nom
    return re.sub(r"\s+", " ", t.replace("_", " ").replace("📁", "")).strip()


def est_corrige(nom):
    return bool(re.search(r"corrig", nom, re.I))


def lire_chapitre(dossier):
    md = dossier / "Liens de partage.md"
    docs = []
    for ligne in md.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\|\s*(.+?)\s*\|\s*(https://\S+?)\s*\|$", ligne)
        if m and not EXCLUS.search(m.group(1)):
            docs.append(m.groups())
    return docs


def icone(cle):
    return (f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONES[cle]}</svg>')


def piece(nom, url):
    corr = est_corrige(nom)
    titre = titre_affiche(nom)
    if corr:  # le badge « Corrigé » remplace la mention entre parenthèses
        titre = re.sub(r"\s*\(corrig[ée]\)", "", titre, flags=re.I)
    return (f'          <a class="piece{" corrige" if corr else ""}" href="{html.escape(url)}" '
            f'target="_blank" rel="noopener"><span class="nom">{html.escape(titre)}</span>'
            f'<span class="fmt">{format_de(nom, url)}</span></a>')


def ligne(cle, libelle, docs):
    docs = sorted(docs, key=lambda d: (est_corrige(d[0]), titre_affiche(d[0]).lower()))
    n = len(docs)
    return (
        f'      <details class="ligne {cle}">\n'
        f'        <summary><span class="ico">{icone(cle)}</span>'
        f'<span class="lib">{html.escape(libelle)}</span>'
        f'<span class="nb">{n} document{"s" if n > 1 else ""}</span></summary>\n'
        f'        <div class="pieces">\n' + "\n".join(piece(*d) for d in docs) + '\n        </div>\n'
        f'      </details>'
    )


def titre_activite(cle, docs):
    """« Activité 7A Représenter une molécule », d'après l'énoncé (fichier « Act … » non corrigé).
    Plusieurs candidats : on préfère celui qui a un corrigé, puis un .docx, puis le titre le plus court."""
    noms = [titre_affiche(nom) for nom, _ in docs]
    candidats = [(nom, PREFIXE_ACT.sub("", titre_affiche(nom))) for nom, _ in docs
                 if PREFIXE_ACT.match(nom) and not est_corrige(nom)]
    candidats = [(nom, reste) for nom, reste in candidats if reste]
    reste = min(candidats, key=lambda c: (
        not any(n.startswith(titre_affiche(c[0])) and est_corrige(n) for n in noms),
        not c[0].lower().endswith(".docx"), len(c[1])))[1] if candidats else ""
    reste = re.sub(r"\s*-\s*20\d\d.*$", "", reste)  # « Dosage du dakin - 2026 - modifié »
    return f"Activité {cle} {reste[:1].upper()}{reste[1:]}".strip()


def bloc_chapitre(ident, titre, docs):
    groupes = {c: [] for c in RUBRIQUES}
    activites = {}
    for nom, url in docs:
        m = CLE_ACT.search(nom)
        if m and not re.search(r"corrig[ée] des", nom, re.I):
            activites.setdefault(m.group(1).upper(), []).append((nom, url))
        else:
            groupes[rubrique(nom, url)].append((nom, url))

    lignes = [ligne(c, RUBRIQUES[c], groupes[c]) for c in ("cours", "plan") if groupes[c]]
    for cle in sorted(activites, key=lambda k: (int(k[:-1]), k[-1])):
        lignes.append(ligne("act", titre_activite(cle, activites[cle]), activites[cle]))
    lignes += [ligne(c, RUBRIQUES[c], groupes[c]) for c in ("exo", "autre") if groupes[c]]
    return (
        f'    <section class="chap" id="{ident}" aria-labelledby="t-{ident}">\n'
        f'      <h2 id="t-{ident}">{html.escape(titre)}</h2>\n'
        + "\n".join(lignes)
        + "\n    </section>"
    )


def sans_accents(s):
    s = unicodedata.normalize("NFD", s.replace("’", "'"))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def categories():
    """Numéro de chapitre → thème (« Mouvements et interactions »…) d'après le sommaire du site."""
    cats, cat = {}, None
    for e in json.loads(SOMMAIRE.read_text(encoding="utf-8"))["sommaire"]:
        if "cat" in e:
            cat = e["cat"]
        elif "num" in e:
            cats.setdefault(e["num"], cat)
    return cats


def main():
    chapitres = []
    for d in sorted(RACINE.iterdir()):
        m = re.match(r"^(\d\d) (?:\(Partie (\d)\) )?(.+)$", d.name)
        if not (d.is_dir() and m and (d / "Liens de partage.md").exists()):
            continue
        num, partie, titre = m.groups()
        ident = f"ch{num}" + ("b" if partie == "2" else "")
        court = f"{int(num)}" + ("b" if partie == "2" else "")
        entete = f"Chapitre {int(num)} : {titre}" + (f" (partie {partie})" if partie else "")
        chapitres.append((num, ident, court, titre, entete, lire_chapitre(d)))

    cats = categories()
    nav, cat_prec = [], None
    for num, ident, court, titre, _, docs in chapitres:
        if cats.get(num) and cats[num] != cat_prec:
            cat_prec = cats[num]
            nav.append(f'      <div class="cat">{html.escape(cat_prec)}</div>')
        nav.append(f'      <a href="#{ident}" data-ch="{ident}"><b>{court}</b><span>{html.escape(titre)}</span>'
                   f'<i>{len(docs)}</i></a>')
    sections = "\n\n".join(bloc_chapitre(ident, entete, docs) for _, ident, _, _, entete, docs in chapitres)
    total = sum(len(c[-1]) for c in chapitres)

    page = GABARIT.replace("{{NAV}}", "\n".join(nav)).replace("{{SECTIONS}}", sections)
    page = page.replace("{{TOTAL}}", str(total)).replace("{{NB}}", str(len(chapitres)))
    SORTIE.write_text(page, encoding="utf-8")
    print(f"{SORTIE} : {len(chapitres)} chapitres, {total} documents")


GABARIT = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Documents 1res Spé</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/parcours.css">
<link rel="stylesheet" href="../../assets/css/archive.css">
<!-- Page générée par generer.py — ne pas modifier à la main -->
</head>
<body class="niveau-1spe">

<header class="topbar">
  <div class="crumb"><a href="../../index.html#1ere-spe">1res Spé</a><span>/</span><b>Documents</b></div>
  <nav>
    <a href="../../index.html#accueil">Accueil</a>
    <a href="../../index.html#1ere-spe" aria-current="page">1res Spé</a>
    <a href="../../index.html#1ere-ens">Ens. Sci.</a>
    <a href="../../index.html#5eme">5ème</a>
    <a href="../../index.html#4eme">4ème</a>
    <a href="../../index.html#outils">Outils</a>
  </nav>
</header>

<div class="page">
  <div class="kicker">Physique-chimie · 1re Spécialité</div>
  <h1>Documents des chapitres</h1>
  <p class="lead">{{TOTAL}} documents répartis sur {{NB}} chapitres. Choisis un chapitre, puis ouvre une ligne : chaque lien ouvre le fichier dans Google Drive, dans un nouvel onglet.</p>

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
