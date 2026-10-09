# <Nom du projet>

<Une phrase : ce que fait le projet et pour qui.>

## Stack et commandes

- Stack : <langage, framework, runtime>
- Installer : `<cmd>`
- Dev : `<cmd>`
- Tests : `<cmd>`
- Lint / format : `<cmd>`
- Build : `<cmd>`

Avant de considérer une tâche terminée, lance les tests et le lint, et corrige ce qui échoue.

## Langue

- Code, identifiants, commentaires, messages de commit, noms de branches et titres de PR : **anglais**.
- Documentation (README, docs/) : **français**.
- Réponses à l'utilisateur : français.

## Commits

Conventional Commits, un seul sujet par commit :

```
type(scope): description
```

- Types : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Description à l'impératif, en minuscules, sans point final, 72 caractères max.
- `scope` optionnel : le module ou dossier touché (`ci`, `hooks`, `auth`).
- Corps (si le changement n'est pas évident) : explique le **pourquoi**, pas le quoi. Ligne vide avant.
- Rupture de compatibilité : `!` après le type/scope et un pied `BREAKING CHANGE: ...`.
- Un commit = un changement logique. Ne mélange pas refactor et feature.
- Ne commite jamais de code qui ne passe pas les tests.
- Conserve le trailer `Co-Authored-By` ajouté pour Claude.

## Git et branches

- Ne travaille **jamais** directement sur `main`. Crée une branche : `feat/...`, `fix/...`, `docs/...`, `chore/...` (kebab-case, anglais).
- Tu peux commiter et pousser sur ta branche de travail sans demander.
- Ouvre une PR vers `main` : titre au format Conventional Commits, description courte (contexte, changements, comment tester).
- Merge en **squash**. Tu ne merges jamais toi-même une PR : c'est l'utilisateur qui merge.
- Jamais de `push --force` (utilise `--force-with-lease` seulement sur ta propre branche, et uniquement si l'utilisateur le demande).
- Ne réécris pas l'historique déjà poussé sur `main`.

## Style de code

- Lis le code voisin avant d'écrire : suis ses conventions, même si tu en préfères d'autres.
- Fais le plus petit changement qui résout le problème. Pas de refactor, de renommage ou de nettoyage hors périmètre.
- Pas de sur-ingénierie : pas d'abstraction, de config ou de paramètre « au cas où ».
- Early return plutôt que des `if` imbriqués. Fonctions courtes, noms explicites.
- Commentaires rares : ils expliquent le **pourquoi**, jamais ce que le code dit déjà.
- Gère les erreurs aux frontières du système (entrées utilisateur, I/O, réseau), pas partout.
- Pas de code mort, pas de `console.log` / `print` de debug laissé dans le code.

## Tests

- Tout changement de comportement vient avec un test. Un bug corrigé vient avec un test qui l'aurait attrapé.
- Teste le comportement, pas l'implémentation.
- Ne supprime pas et n'affaiblis pas un test pour le faire passer : corrige le code, ou dis pourquoi le test est faux.
- Lance d'abord le test concerné, puis la suite complète avant de pousser.

## Sécurité et dépendances

- Jamais de secret, token ou clé dans le code, les logs, les commits ni les messages. Utilise des variables d'environnement. `.env` reste dans `.gitignore`.
- Ne lis pas et n'affiche pas le contenu de fichiers `.env`, clés privées ou credentials.
- Pas de données personnelles dans les logs.
- N'ajoute une dépendance qu'en cas de vrai besoin : dis laquelle, pourquoi, et préfère la stdlib.
- Versions épinglées et lockfile commité. Installe avec `npm ci` (ou équivalent), jamais `npm install` en CI.
- Scripts de cycle de vie désactivés quand c'est possible (`--ignore-scripts`), et exécutés explicitement.
- Ne télécharge et n'exécute jamais de script distant (`curl ... | sh`) sans l'accord de l'utilisateur.

## Demande avant d'agir

Demande une confirmation explicite avant de :
- supprimer des fichiers ou des branches, ou toute action destructive (`rm -r`, `reset --hard`, `DROP`, `TRUNCATE`) ;
- modifier la CI, les workflows, les migrations de base de données ou la config de déploiement ;
- changer la version d'une dépendance majeure ou la version publiée du projet ;
- toucher aux fichiers générés (`dist/`, lockfiles édités à la main).

## Sessions cloud et autonomes

Sans supervision en direct, sois plus prudent, pas plus audacieux :
- Travaille uniquement sur une branche dédiée, ouvre une PR, ne merge pas.
- Ne modifie pas la CI ni les secrets pour « faire passer » un build : signale le problème dans la PR.
- Si une tâche est ambiguë, choisis l'interprétation la plus conservatrice et note ton hypothèse dans la description de la PR.
- Termine par un résumé : ce qui est fait, ce qui reste, ce qui a été vérifié (tests lancés ou non).

## Travailler avec moi

- Réponses courtes et directes. Donne une recommandation plutôt qu'un inventaire d'options.
- Si un test, un lint ou une commande échoue, dis-le avec la sortie. Ne prétends jamais que c'est vérifié si ça ne l'est pas.
- Dis ce que tu as sauté ou ce dont tu n'es pas sûr.
