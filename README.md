# Cahier de physique-chimie — site « parcours »

Site GitHub Pages : https://mvalentini-site.github.io/cours/ (dépôt `mvalentini-site/cours`).

```
./
├── index.html                    ← accueil à onglets (Accueil, 1res Spé, Ens. Sci., 5ème, Outils | Post Bac., À propos)
├── progression-1ere-spe.html     ← progression annuelle 1res Spé (données : data/sessions-1ere-spe.json)
├── assets/
│   ├── css/parcours.css          ← style commun (pages chapitre + accueil)
│   └── js/parcours.js            ← visionneuse + étapes cochées
├── gabarit/chapitre-modele.html  ← à copier pour chaque nouveau chapitre
├── data/
│   ├── sommaire-1ere-spe.json    ← sommaire 1res Spé (modifiable depuis le mode admin de l'accueil)
│   └── sessions-1ere-spe.json
├── 1ere-spe/
│   ├── ch01-mole/index.html
│   └── ch11-fluides/index.html
├── 5eme/
│   └── ch01-matiere/index.html
└── Outils/                       ← outils interactifs (pointage vidéo, Mariotte, Melde…) et leurs vidéos
```

## Créer un chapitre
1. Copier `gabarit/chapitre-modele.html` dans `NIVEAU/chXX-nom/index.html`.
2. Sur `<body>`, poser `class="niveau-1spe|niveau-ens|niveau-5e"` et `data-page="identifiant-unique"`.
3. Remplacer chaque `ID_DRIVE` par l'identifiant du fichier partagé.
4. Référencer la page sur l'accueil :
   - **1res Spé** : mode admin (⚙ en bas à droite de l'onglet 1res Spé) → modifier le chapitre, champ « Lien » = `1ere-spe/chXX-nom/index.html`, le dévoiler, Publier.
   - **5ème / Ens. Sci.** : ajouter une ligne dans `SOMMAIRES` en haut du script de `index.html`.
   - **Outils** : ajouter une ligne dans `PAGES.outils`.

## Liens Drive
- Fichier (pdf, docx, odt, jpg, mp4) : `https://drive.google.com/file/d/ID/preview`
- Google Doc : `https://docs.google.com/document/d/ID/preview`
- Vidéo YouTube dans la visionneuse : `https://www.youtube.com/embed/ID`
- Le dossier Drive doit être partagé en « Tous les utilisateurs disposant du lien ».
- Un fichier `.html` (ex. un calculateur) ne s'affiche pas via Drive : le déposer dans le dossier du chapitre et le lier en relatif.

## Couleurs des étapes (`style="--c:var(--…)"`)
green = TP · blue = documentaire · brown = lecture · red = entraînement · purple = atelier · olive = expert · ink = bilan

## Étapes cochées
Mémorisées dans le navigateur de l'élève (localStorage), clé `parcours:` + `data-page`.
Rien n'est envoyé nulle part ; le bouton « Tout décocher » remet à zéro.

## Mode admin (accueil, onglet 1res Spé)
Clic sur ⚙ Admin puis mot de passe ; publication directe de
`data/sommaire-1ere-spe.json` via l'API GitHub avec un token personnel (droit Contents → Read & write).
Un chapitre masqué apparaît en « À venir » ; en mode admin sa carte reste cliquable pour vérifier la page.
