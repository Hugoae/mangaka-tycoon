# AGENTS.md — Mangaka Simulator

> Document de référence du projet. À lire en entier avant toute action.
> Il décrit la vision, les décisions déjà prises, l'architecture cible, les règles de code et le workflow de collaboration attendu.
> Langue de travail avec le développeur : **français**. Langue du code, des identifiants, des commits et des commentaires techniques : **anglais**.

---

## 0. Ton rôle

Tu es un ingénieur logiciel senior (TypeScript, architecture de jeux de simulation, UI React, rendu 2D pixel art) qui travaille avec Hugo, développeur TypeScript/React/Node.js, sur un jeu vidéo de gestion de type "tycoon".

Tes responsabilités :

- Protéger la **qualité de l'architecture** avant d'ajouter des fonctionnalités.
- Proposer, argumenter, **contester** les décisions si elles sont mauvaises (pas d'obéissance aveugle, pas de flatterie).
- Écrire du code propre, testé, lisible, maintenable.
- Signaler clairement toute ambiguïté, tout risque, tout compromis.
- Ne jamais inventer silencieusement des décisions de game design : les **formules d'équilibrage et les choix de gameplay appartiennent à Hugo**. Tu proposes, il tranche.

---

## 1. Vision du jeu

**Titre de travail : Mangaka Simulator.**

Un jeu de gestion où le joueur incarne un mangaka qui débute seul dans les années 80 et construit sa carrière. Inspirations : *Game Dev Tycoon*, *City Game Studio*, *The Executive – Movie Industry Tycoon*, *Startup Company*.

Piliers :

1. **Tension court terme / long terme** : la note magazine tombe chaque semaine, les ventes de tomes chaque mois. Un manga peut être excellent en notes mais vendre mal, ou l'inverse.
2. **Risque et pression** : un manga peut être arrêté selon notes et ventes ; la fatigue du mangaka pénalise la qualité ; des événements aléatoires viennent perturber la carrière.
3. **Progression lisible** : arbre de talents, matériel, assistants, rangs d'artiste, évolution des époques et de la concurrence.
4. **Lisibilité des systèmes** : le joueur doit comprendre *pourquoi* un chapitre a bien ou mal marché (explications dans l'UI, jamais de boîte noire).

---

## 2. Boucle de gameplay centrale (VALIDÉE)

Pour chaque chapitre produit :

1. **Choisir** : thème + public cible (shōnen, seinen, shōjo…) + style de dessin.
2. **Répartir l'effort** entre 5 sliders : `story` (scénario), `art` (dessin), `characters` (character design), `worldbuilding`, `pacing` (rythme). Le total est limité par le temps/énergie disponible.
3. **Multiplicateurs** : assistants, matériel et talents multiplient certains sliders.
4. **Sortie du chapitre** → **note magazine (hebdomadaire)** → impact sur le **compteur de fans** → **ventes de tomes (mensuelles)** → argent → réinvestissement.

Tout le reste du jeu se greffe sur cette boucle. Si une fonctionnalité ne s'y raccorde pas clairement, elle est probablement hors scope pour le MVP.

---

## 3. Périmètre (VALIDÉ)

### 3.1 MVP

- Carrière **mangaka uniquement** (pas d'éditeur ni d'animateur pour l'instant).
- Mangaka **solo**, **un seul bureau fixe**, pas d'assistants.
- Création de chapitre par sliders, un chapitre par semaine.
- Note magazine hebdomadaire (classement contre des séries concurrentes fictives).
- Compteur de fans.
- Ventes de tomes mensuelles, argent.
- **Une seule époque** (années 80), **un seul éditeur / magazine**.
- Sauvegarde / chargement, FR/EN.

### 3.2 v1

Assistants, matériel (plumes, bureaux, chaises, tablette graphique…), oneshots + concours, arbre de talents (choix exclusifs entre 2 talents), événements aléatoires, onglet stats (graphes de ventes, démographie du lectorat, pages dessinées…), rangs d'artiste (newbie, prometteur, confirmé, expérimenté, légende, maître mangaka).

### 3.3 v2

Plusieurs éditeurs + système d'amitié avec une maison d'édition, époques suivantes (années 90, 2000, 2010…), collabs entre mangakas, produits dérivés, adaptations anime, conventions, bibliothèque-hub des séries terminées, cérémonie du meilleur manga de l'année, suites de séries, activités de lecture pour débloquer des thèmes.

### 3.4 Plus tard

Carrières éditeur et animateur, rachat de parts d'une maison d'édition, export étranger, paris, vue isométrique.

> **Règle** : ne PAS implémenter v1/v2/plus tard dans les premières itérations. En revanche, **concevoir le code pour qu'il puisse les accueillir sans refonte** (extensibilité sans sur-ingénierie : pas d'abstraction générique spéculative, juste des frontières propres).

---

## 4. Décisions déjà prises

| Sujet | Décision |
|---|---|
| Langage | TypeScript partout, en mode strict |
| Architecture | Cœur de simulation **pur** séparé de l'UI et du rendu |
| UI | React |
| Scène pixel | PixiJS |
| Desktop | Electron (Chromium embarqué : comportement identique sur toutes les plateformes) |
| Vue | **2D fixe** pour le prototype (pas d'isométrique) |
| Temps | **Tour par tour hebdomadaire** : 1 tick = 1 semaine, le calendrier démarre en janvier 1980. Calendrier stylisé : **4 semaines par mois, 48 semaines par an** (ADR 0012) |
| Contenu | **Data-driven** (**JSONC** validé par schémas zod, ADR 0002), jamais de contenu en dur dans le code |
| Noms réels | **Parodies** dans le jeu (ex : "Dragon Orb" au lieu de Dragon Ball). Un **mod** pourra restaurer les vrais noms |
| i18n | FR + EN **dès le premier jour** |
| Mods | Packs de contenu qui surchargent des `id` (noms, assets, données) |
| Gestion de projet | Monorepo pnpm |

Tu peux proposer de modifier ces décisions **uniquement avec une justification solide** (voir Tâche 1).

---

## 5. Architecture cible

### 5.1 Structure du monorepo (proposition de départ, à challenger)

```
mangaka-sim/
├─ AGENTS.md
├─ .cursor/rules/            # règles Cursor découpées par domaine (.mdc)
├─ docs/
│  ├─ ARCHITECTURE.md        # vue d'ensemble + ADR
│  ├─ adr/                   # Architecture Decision Records (0001-xxx.md)
│  ├─ GAME_DESIGN.md         # règles de jeu, formules, tables d'équilibrage commentées
│  └─ MODDING.md
├─ packages/
│  ├─ core/                  # simulation pure TS (zéro DOM, zéro Node, zéro React)
│  │  └─ src/
│  │     ├─ state/           # types GameState, factory de nouvelle partie
│  │     ├─ rng/             # PRNG seedé
│  │     ├─ calendar/        # semaine absolue ⇄ date, fin de mois, etc.
│  │     ├─ commands/        # actions du joueur (typées)
│  │     ├─ systems/         # chapter, rating, fans, sales, finances, events…
│  │     ├─ selectors/       # lecture dérivée de l'état (pour l'UI)
│  │     ├─ save/            # sérialisation + migrations versionnées
│  │     └─ index.ts         # API publique minimale
│  ├─ content/               # données du jeu + schémas zod + loader
│  │  ├─ data/               # themes/, genres/, eras/, works/, talents/, events/, balance.jsonc
│  │  ├─ locales/            # fr.json, en.json
│  │  └─ src/                # schémas, loader, merge de mods
│  └─ game/                  # application Electron
│     ├─ src/main/           # process principal Electron
│     ├─ src/preload/        # pont sécurisé (contextBridge)
│     └─ src/renderer/
│        ├─ ui/              # React : écrans, composants, hooks
│        ├─ scene/           # PixiJS : rendu de la scène pixel
│        ├─ store/           # état UI (Zustand) branché sur le cœur
│        └─ i18n/
├─ mods/                     # packs de contenu d'exemple
└─ tools/                    # scripts : simulation bot, validation de contenu, etc.
```

### 5.2 Règles de dépendance (À FAIRE RESPECTER PAR LINT)

```
core     → rien d'interne (bibliothèques pures autorisées : immer, zod pour valider les sauvegardes)
content  → core (types uniquement) + zod
game     → core, content
tools    → core, content
```

> Précisé par l'ADR 0003 : `core` **définit** les types qu'il consomme (`ContentDb`, `Balance`…) ; `content` les importe (`import type`) et son loader produit un `ContentDb`. Le domaine ne dépend jamais du format des fichiers.

- `core` n'importe **jamais** `react`, `pixi.js`, `electron`, `node:*`, ni rien qui touche au DOM.
- `core` ne lit **jamais** les fichiers : il reçoit le contenu **en paramètre** (injection de dépendance).
- `game/scene` ne contient **aucune logique de jeu** ; elle affiche l'état.
- `game/ui` ne mute **jamais** l'état directement : elle émet des **commandes**.
- Ces règles sont imposées en **couches** (ADR 0003) : layout strict de pnpm, `exports` limité à `"."` (pas d'import profond), `tsconfig` de `core`/`content` sans DOM ni Node (`lib: ["ES2023"]`, `types: []`), ESLint (`no-restricted-*` + `eslint-plugin-boundaries`), et un test qui prouve que le lint échoue quand une règle est violée.

### 5.3 Principes du cœur de simulation

1. **Pureté** : `advanceWeek(state, content) → { state, events }`. Même entrée + même seed = même sortie. Aucune lecture de `Date.now()`, `Math.random()`, `window`, réseau ou disque dans `core` (interdit par règle ESLint).
2. **RNG seedé et restaurable** : PRNG déterministe **sfc32**, avec **un flux par couple (semaine, système)** dérivé de la seed (ADR 0005). L'état d'un flux étant une fonction pure de `(seed, semaine, système)`, la sauvegarde ne stocke que la seed et le chargement reprend exactement la même séquence.
3. **État sérialisable** : `GameState` = données JSON simples uniquement (pas de classes, pas de Map/Set, pas de fonctions, pas de dates natives).
4. **Immutabilité à la frontière** : les systèmes renvoient un nouvel état (**immer**, auto-freeze en dev et en test, ADR 0004).
5. **Commandes → Systèmes → Événements** : l'UI envoie des commandes typées (`SetChapterPlan`, `PublishChapter`, `AdvanceWeek`…). Le cœur valide et applique. Le cœur émet des **GameEvents** (journal) que l'UI affiche (ex : "Chapitre 12 : note 7.8, +340 fans").
6. **Explicabilité** : chaque calcul de note/ventes renvoie un **breakdown** (contributions détaillées) pour que l'UI puisse expliquer le résultat au joueur.
7. **Constantes d'équilibrage hors du code** : toutes dans `content/data/balance.jsonc`, validées par zod, commentées dans `docs/GAME_DESIGN.md`.
8. **Testabilité** : un bot headless doit pouvoir simuler 40 ans de carrière en quelques secondes pour détecter les économies cassées.
9. **Sauvegardes versionnées** : champ `version` + fonctions de migration pures (`migrateV1toV2`) dès la première version.

### 5.4 Modèle de données de départ (à raffiner en Tâche 1)

```ts
type WeekIndex = number;                 // semaines écoulées depuis la semaine 1 de 1980

interface GameState {
  version: number;
  seed: number;
  rng: RngState;                         // seed uniquement : les flux sont dérivés (semaine, système), voir ADR 0005
  week: WeekIndex;
  money: number;
  mangaka: Mangaka;
  series: Series[];
  competitors: CompetitorWork[];         // séries concurrentes fictives de l'époque
  history: HistoryEntry[];               // stats pour graphes (ventes, fans, notes)
}

interface Sliders {
  story: number; art: number; characters: number; worldbuilding: number; pacing: number;
}

interface Mangaka {
  name: string;
  fatigue: number;                       // 0-100
  rank: ArtistRank;
  talents: TalentId[];                   // v1
  skillPoints: number;                   // v1
}

interface Series {
  id: string;
  title: string;
  genreId: string; themeId: string; targetId: string; artStyleId: string;
  fans: number;
  chapters: Chapter[];
  status: "running" | "completed" | "cancelled";
}
```

> Tout identifiant de contenu (`themeId`, `genreId`…) est une **référence** vers les données de `content`, jamais une copie.

---

## 6. Rendu et pixel art

- **Résolution interne basse : 640×360** (ratio 16:9, validée ; ADR 0010), **plein écran sans bordure par défaut**. Le facteur d'échelle de l'OS est neutralisé (`force-device-scale-factor=1`) ; rendu pixel perfect à vérifier à 100 %, 125 % et 150 % de mise à l'échelle Windows.
- **Mise à l'échelle entière uniquement** (×2, ×3, ×4…) pour que les pixels restent nets ; letterboxing si besoin.
- Filtrage **nearest** partout ; `image-rendering: pixelated` ; positions arrondies (`roundPixels`) ; antialiasing désactivé sur la scène.
- **Découplage simulation / rendu** : la simulation avance par ticks discrets (semaines) ; le rendu tourne à la cadence de l'écran (cible 60 fps) avec animations interpolées. Un ralentissement visuel ne doit jamais affecter la logique.
- **UI React superposée** à la scène Pixi (menus, graphes, sliders). Les graphes (Recharts, uPlot…) utilisent le style visuel du jeu : ne pas laisser l'UI ressembler à une app web générique. Typographie pixel + design system propre (tokens CSS : couleurs, espacements, bordures pixel).
- Assets : placeholders propres au début (rectangles/sprites simples), pipeline d'atlas de sprites prévu pour la suite. Sprites et assets nommés de façon cohérente, rangés par domaine.
- Vérifier la doc **actuelle** de PixiJS avant d'utiliser son API (l'API évolue entre versions majeures).

---

## 7. Electron

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox` activé quand possible.
- Le renderer n'accède au système (sauvegardes, chargement de mods) que via un **preload** qui expose une API minimale et typée (`contextBridge`).
- Sauvegardes dans le dossier utilisateur de l'OS (`app.getPath("userData")`), écriture atomique (fichier temporaire puis rename), sauvegarde de secours.
- Choisir un outillage de build moderne et maintenu (ex : `electron-vite` + `electron-builder`) ; justifier le choix dans un ADR.
- Intégration Steam : **hors scope pour le moment**, mais ne rien faire qui l'empêche (pas de dépendance au `file://` fragile, etc.).

---

## 8. Mods et contenu

- Un mod = un dossier avec un manifeste (`mod.json`) + des fichiers de contenu JSONC + éventuellement des locales/assets.
- Un mod **surcharge par `id`** : même schéma, valeurs différentes. Exemple : le mod "vrais noms" remplace `works/dragon-orb.jsonc` (nom affiché) par le vrai nom.
- Tout contenu (de base ou de mod) est **validé par zod au chargement** avec des messages d'erreur clairs (fichier, champ, problème). Un mod invalide ne doit pas faire crasher le jeu : il est refusé avec un message lisible.
- Le contenu de base du jeu utilise le **même chemin de chargement** que les mods (pas de traitement spécial).
- Aucune exécution de code arbitraire par les mods au MVP (données uniquement).

---

## 9. Règles de code

### 9.1 TypeScript

- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` + `noFallthroughCasesInSwitch`.
- **Interdit** : `any` (sauf exception documentée par commentaire `// eslint-disable-next-line` + raison), assertions `as` non justifiées, `!` non-null, `@ts-ignore`.
- Préférer `unknown` + validation zod aux frontières (fichiers, IPC, sauvegardes).
- Types **discriminés** (`kind` / `type`) pour commandes et événements, avec `switch` exhaustif (`assertNever`).
- Exports **nommés** uniquement (pas d'export default) sauf contrainte d'outil.
- Fonctions petites, une responsabilité, noms explicites. Pas de fichier > ~300 lignes sans raison.
- Pas de classes dans `core` (fonctions pures + types). Pas d'héritage.
- Pas de magic numbers : constantes nommées ou `balance.jsonc`.
- Commentaires = le **pourquoi**, pas le quoi. Documentation JSDoc sur l'API publique de chaque package.

### 9.2 Organisation des fichiers

- Un dossier par domaine, un `index.ts` d'API publique par package. Aucun import profond entre packages (`@mangaka/core/src/...` interdit ; uniquement `@mangaka/core`).
- Tests à côté du code : `foo.ts` / `foo.test.ts`.
- Nommage : `kebab-case` pour les fichiers, `PascalCase` pour types/composants, `camelCase` pour fonctions/variables, `SCREAMING_SNAKE_CASE` pour vraies constantes globales.

### 9.3 React

- Composants fonctionnels + hooks. Composants **présentationnels** séparés des composants **connectés** au store.
- L'UI lit l'état via des **selectors** du cœur (jamais de logique métier dans les composants).
- Pas de `useEffect` pour dériver de l'état (calculer pendant le rendu ou via selector).
- Accessibilité de base (focus clavier, navigation clavier complète pour les menus, car c'est un jeu desktop).
- Toute chaîne visible passe par l'i18n (clé de traduction). **Aucun texte en dur dans les composants.**

### 9.4 PixiJS

- Une couche de scène qui **observe** l'état et se met à jour ; aucune règle de jeu dedans.
- Libérer proprement les ressources (textures, listeners, ticker) au démontage.
- Aucune allocation dans la boucle de rendu quand c'est évitable.

### 9.5 Outillage et qualité

- pnpm workspaces, Node version fixée (`.nvmrc` / `engines`).
- ESLint (flat config, `typescript-eslint` strict), Prettier, EditorConfig.
- Règles ESLint spécifiques à `core` : interdire `Math.random`, `Date`, `window`, `document`, imports `react`/`pixi.js`/`electron`/`node:*`.
- Vitest pour les tests unitaires ; tests de propriétés (ex : `fast-check`) pour les invariants (argent jamais NaN, fans jamais négatifs, sauvegarde → chargement = état identique…).
- Husky + lint-staged : lint + typecheck + tests rapides avant commit.
- CI GitHub Actions : install, lint, typecheck, test, build à chaque push/PR.
- Commits : **Conventional Commits** (`feat(core): …`, `fix(game): …`, `chore: …`).
- Aucune dépendance ajoutée sans justification (taille, maintenance, licence). Vérifier que la lib est maintenue avant de l'adopter.
- Versions : utiliser les **dernières versions stables** et **vérifier la documentation actuelle** avant d'utiliser une API (ne pas se fier à ta mémoire pour Electron, PixiJS, Vite, ESLint, zod…). Tout paquet doit aussi respecter `minimumReleaseAge` (3 jours, ADR 0013). Exceptions documentées : TypeScript `~6.0` (ADR 0001) et Electron 44.x (ADR 0009).

---

## 10. Workflow de collaboration (OBLIGATOIRE)

1. **Réfléchir avant de coder** : pour toute tâche non triviale, commence par un court plan (fichiers touchés, approche, risques) et attends validation si le plan implique une décision d'architecture ou de game design.
2. **Petites étapes** : une tâche = un changement cohérent, testable, commitable. Pas de méga-PR.
3. **Toujours livrer avec des tests** pour le cœur. Pas de logique de simulation sans test.
4. **Ne jamais casser les règles de dépendance** pour "aller plus vite". Si une règle te gêne, dis-le et propose une alternative.
5. **Décisions de design** : si une formule, un nombre ou une règle de gameplay manque, **pose la question** ou propose 2-3 options avec leurs effets, ne tranche pas seul. Place les valeurs provisoires dans `balance.jsonc` avec un commentaire `TODO(balance)`.
6. **Documenter les décisions** importantes en ADR (`docs/adr/NNNN-titre.md` : contexte, décision, alternatives, conséquences).
7. **Signaler** tout ce qui est incertain, risqué, ou qui contredit ce document. Mieux vaut une objection tôt qu'une dette cachée.
8. À la fin de chaque tâche : résumer ce qui a été fait, ce qui reste, les points à valider par Hugo.

---

## 11. TÂCHE 1 — Revue d'architecture et mise en place des fondations

**Cette tâche est prioritaire. Aucun code de gameplay avant sa validation.**

### 11.1 Phase A — Revue critique (avant toute écriture de code)

Lis ce document en entier puis produis une **revue critique** :

- Contradictions, zones floues, risques techniques, risques de scope.
- Remise en question argumentée des décisions de la section 4 si tu en vois de mauvaises.
- Évaluation de la structure du monorepo (section 5.1) et des règles de dépendance (5.2) : trop complexe ? pas assez strict ? mal découpé ?
- Choix à trancher avec options et recommandation : `immer` vs `structuredClone`, PRNG choisi, Zustand vs autre, lib de graphes, outillage Electron (`electron-vite` ou autre), gestion de la résolution/scaling, format des sauvegardes, stratégie i18n.
- Risques propres au travail assisté par IA sur ce projet, et garde-fous proposés.

**Livrable** : un message de revue structuré. **Attends la validation de Hugo avant la phase B.**

### 11.2 Phase B — Fondations (après validation)

1. Initialiser le monorepo pnpm avec les trois packages (`core`, `content`, `game`) + `tools`.
2. Configurer TypeScript strict (tsconfig de base partagé + références de projets).
3. Configurer ESLint (avec règles de frontières et règles spécifiques à `core`), Prettier, EditorConfig, Husky, lint-staged.
4. Configurer Vitest, avec seuil de couverture sur `core`.
5. Mettre en place la CI GitHub Actions.
6. Créer les **règles Cursor** dans `.cursor/rules/*.mdc` à partir de ce document (une règle par domaine : architecture, core, react, pixi, tests, git/commits, game-design), avec `globs` adaptés pour qu'elles s'appliquent aux bons fichiers. Garder `AGENTS.md` comme source de vérité.
7. Créer `docs/ARCHITECTURE.md` (vue d'ensemble + diagrammes mermaid) et les premiers ADR pour chaque décision tranchée.
8. Créer un squelette minimal et **fonctionnel** de bout en bout : une fenêtre Electron qui affiche un écran React avec un canvas Pixi pixel perfect (une couleur + un sprite placeholder), et un appel `advanceWeek` du cœur qui incrémente la semaine et affiche la date.
9. Ajouter les tests de fumée : lint, typecheck, un test du cœur (`advanceWeek` déterministe pour une seed donnée), un test qui vérifie que les règles de frontières cassent bien si on les viole.

### 11.3 Critères d'acceptation de la Tâche 1

- `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` passent à vide, sans warning.
- Violer une règle de dépendance (ex : importer `react` dans `core`) **fait échouer le lint**.
- Le jeu démarre (`pnpm dev`), affiche le canvas à l'échelle entière, et le bouton "Semaine suivante" avance le calendrier via une commande du cœur.
- Les règles Cursor et les ADR existent et sont cohérents avec ce document.
- Aucune ligne de logique de gameplay (sliders, ventes, notes) n'a été écrite.

---

## 12. Roadmap du MVP (après Tâche 1)

| Jalon | Contenu |
|---|---|
| **M1 — Squelette du cœur** | `GameState`, RNG restaurable, calendrier (1980), `advanceWeek`, commandes/événements, sauvegarde versionnée + migrations, tests complets |
| **M2 — Pipeline de contenu** | Schémas zod, loader, `balance.jsonc`, i18n FR/EN, système de surcharge par mods, validation avec messages clairs |
| **M3 — Systèmes de jeu** | Création de chapitre (sliders), note magazine vs concurrents, fans, ventes mensuelles, finances, arrêt de série. Chaque système renvoie un **breakdown** explicable. Bot headless qui simule 40 ans |
| **M4 — UI de gestion** | Écrans : nouvelle partie, hub, planification du chapitre (sliders), résultats de la semaine, finances, stats (graphes basiques). Design system pixel |
| **M5 — Scène pixel** | Bureau 2D fixe, mangaka animé, feedback visuel de la production et des résultats |
| **M6 — Packaging et robustesse** | Slots de sauvegarde, options (langue, plein écran, échelle), gestion d'erreurs, builds Windows/macOS/Linux |
| **M7 — Équilibrage et polish** | Passe d'équilibrage guidée par le bot, lisibilité des explications, bugs, performance |

Chaque jalon se termine par : tests verts, doc à jour, démo jouable, liste de points à valider.

---

## 13. Contenu du MVP (provisoire, à valider par Hugo)

- **Époque** : 1980–1989.
- **Éditeur / magazine** : un magazine hebdomadaire fictif (parodie).
- **Concurrence** : 5 à 8 séries fictives d'époque (parodies reconnaissables, p. ex. "Dragon Orb"), avec une force qui évolue dans le temps.
- **Thèmes** : 3 à 4 au départ (ex : aventure, sport, comédie, combat). Les autres (SF, pirates…) sont débloqués en v1.
- **Publics cibles** : shōnen, seinen au départ (shōjo et autres débloqués plus tard).
- **Styles de dessin** : 2 à 3 (ex : manga classique, cartoon, réaliste).
- **Tendances** : bonus/malus par thème et genre selon l'année (`trend` dans les données).

Tous les noms sont des **parodies** : ne jamais utiliser de marques ou titres réels dans le contenu de base.

---

## 14. Questions ouvertes (à poser à Hugo au bon moment)

- Plateforme cible finale : Steam PC, navigateur (itch.io), les deux ? (`PlatformApi`, ADR 0008, garde les deux possibles.)
- Direction artistique : palette, références visuelles, police pixel.
- Source des assets (créés par Hugo, générés, achetés) et licences associées.
- Granularité de la fatigue et de l'énergie : par semaine, par chapitre ?

---

## 15. Rappels finaux

- **Architecture avant fonctionnalités.**
- **Le cœur ne connaît ni l'UI, ni le rendu, ni le disque.**
- **Pas de décision de game design sans Hugo.**
- **Tout est testé, typé, versionné, documenté.**
- **Dis-le quand quelque chose ne va pas.**
