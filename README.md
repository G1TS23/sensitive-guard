# sensitive-guard

Un mod pour Claude Code qui suspend les commandes Bash sensibles et demande une validation explicite avant de les exécuter.

Quand Claude lance une commande destructrice ou irréversible, l'appel est mis en attente et un panneau « Sensitive guard » s'ouvre. Il affiche la commande et les raisons du blocage. **Proceed** (touche `1`) exécute la commande telle quelle, **Cancel** (touche `2`) la refuse et le signale à Claude, qui doit alors proposer une alternative plus sûre. Si le terminal est trop étroit pour placer le panneau, le même contenu s'affiche au-dessus du prompt. Les commandes ordinaires passent sans rien afficher.

## Commandes surveillées

- suppressions récursives ou forcées (`rm -r`, `rm -f`)
- `git reset --hard`, `git clean -f`, `git push --force`, `git branch -D`, `git checkout -- .`, `git restore .`
- SQL destructeur (`DROP TABLE`, `DROP DATABASE`, `DROP SCHEMA`, `TRUNCATE TABLE`)
- `terraform apply` et `terraform destroy`, `kubectl delete`, `docker system prune`, `docker volume prune`
- `chmod -R` et `chown -R`
- écriture directe sur un périphérique bloc (`dd of=/dev/...`, `mkfs`)
- exécution d'un script distant (`curl ... | sh`)
- `sudo`

Les règles sont la liste `RULES` en tête de `hooks/register.ts` : ajoutez ou retirez une ligne `{ label, pattern }` pour adapter le garde-fou à votre pile.

## Installation

Dans une session Claude Code (CLI ou application desktop), à saisir au prompt :

```
/plugin marketplace add G1TS23/sensitive-guard
/plugin install sensitive-guard@sensitive-guard
```

Choisissez la portée (utilisateur pour l'avoir dans toutes vos sessions, ou projet). Rechargez avec `/reload-plugins` si le mod n'apparaît pas, ou redémarrez Claude Code.

Pour l'essayer sans l'installer, depuis le dossier cloné :

```
claude --plugin-dir ./sensitive-guard
```

Nécessite Claude Code 2.1.287 ou plus récent.

## Limites

Le mod lit le texte de la commande. Un alias, un script qui appelle `rm` en interne ou une substitution comme `$(...)` peut lui échapper : c'est un filet de sécurité, pas un blocage strict. Pour un refus définitif, ajoutez des règles de permission `deny` dans les réglages de Claude Code. Comme tout mod, il s'exécute avec le même accès à votre machine que Claude Code lui-même et sans bac à sable : relisez le code avant de l'installer.

## Développement

```
claude plugin validate .
claude plugin test .
```

Les tests simulent le moteur (placement du panneau, attente, pression des boutons) mais ne reproduisent pas le rendu réel : vérifiez l'affichage dans une vraie session.
