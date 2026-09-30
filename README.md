# NEON BREAKER : HORROR — ÉDITION ABOMINATION

Casse-brique néon horrifique. Vanilla JS, Canvas 2D, audio procédural Web Audio, aucun asset externe.

> ⚠️ **ATTENTION** — Ce jeu contient des screamers, des flashs violents et des effets horrifiques. Ne pas jouer en cas d'épilepsie photosensible ou de fragilité cardiaque.

---

## Comment jouer

Ouvrir `index.html` dans un navigateur moderne. C'est tout. Aucune installation, aucun build.

---

## Contenu

### Édition Abomination (par défaut)

- **36 niveaux** repensés, difficulté qui monte en flèche dès le niveau 1
- **12 boss** à 3 phases chacun (ÉVEIL → RAGE → ABÎME), jusqu'à 500 PV pour l'Abomination finale
- **Thèmes sonores procéduraux uniques** par boss, qui s'accélèrent à chaque phase
- **Rangs S/A/B/C** sur chaque boss selon le temps de victoire
- **HUD de danger** en temps réel (0 à 10)

### Systèmes cachés

- **LE MONSTRE** : si ta raquette s'arrête pendant que la balle vole, il la mange. Bouge. Toujours.
- **Cinématiques** entre chaque niveau : 36 scènes uniques, chacune ajoute un malus permanent
- **16 screamers** différents
- **29 succès** sauvegardés localement. La VRAIE FIN s'ouvre quand tout est collecté

### Modes secrets (à taper dans le menu)

| Code | Effet |
|------|-------|
| `ENFER666` | Version Infernale — tout accélère |
| `ABYSSE404` | L'Abysse — noir quasi total, tu ne vois que des halos |
| `BONBON13` | Bonbon Maudit — palette rose, textes doucereux, 70 % de malus |
| `IRONMAN` ou `FER` | **Une seule vie, aucun power-up, Monstre ×1.8** |
| `DAILY` ou `QUOTIDIEN` | **Daily Run** — niveaux générés à partir de la date du jour |
| `CLASSIQUE` ou `ANCIEN` | Retour à la version originale du jeu |
| `NORMAL` | Efface tout mode secret |

### Fonctionnalités avancées

- **👻 Ghost du meilleur run** : ton meilleur passage sur chaque niveau est enregistré. Un fantôme vert rejoue ta raquette quand tu retentes le niveau.
- **💬 Dialogue procédural des boss** : ils t'insultent, paniquent, menacent. ~40 répliques selon leur phase, ta vie, ton mode rage, la durée du combat.
- **🛠️ Éditeur de niveaux** : appuie sur `E` au menu. Dessine, génère un code base64, partage-le.

### 3 mini-jeux cachés

| Mini-jeu | Accès |
|----------|-------|
| **LES CATACOMBES** (platformer) | Au menu, cliquer 3× sur la brique quasi invisible en bas à gauche |
| **VOL NOCTURNE** (Flappy) | Baisser la luminosité au minimum (flèche bas ×4) **et** couper le son (M), puis cliquer l'oiseau qui apparaît en haut à droite |
| **FACE AU MONSTRE** (Pong) | Au menu, taper au clavier `CAUCHEMAR` |

---

## Contrôles

- **Souris** / **Flèches** / **Q-D** : raquette
- **Espace** / **Clic** : lancer la balle, tirer au laser, passer les cinématiques
- **P** / **Échap** : pause
- **M** : couper le son
- **E** (au menu) : ouvrir l'éditeur de niveaux
- **Code Konami** : surprise

---

## Structure du projet
