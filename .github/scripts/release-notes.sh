#!/usr/bin/env bash
# Usage: release-notes.sh <tag>
# Prints release notes grouped by Conventional Commit type, for the commits
# since the previous tag (or the whole history when there is none).
set -euo pipefail

tag="$1"
prev=$(git describe --tags --abbrev=0 --exclude "$tag" HEAD 2>/dev/null || true)
range="HEAD"
[ -n "$prev" ] && range="$prev..HEAD"

dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT

re='^([a-z]+)(\(([^)]+)\))?(!)?: (.+)$'
git log --no-merges --pretty=$'%h\t%s' "$range" | while IFS=$'\t' read -r sha subject; do
  type=other; scope=""; bang=""; desc="$subject"
  if [[ "$subject" =~ $re ]]; then
    type="${BASH_REMATCH[1]}"; scope="${BASH_REMATCH[3]}"
    bang="${BASH_REMATCH[4]}"; desc="${BASH_REMATCH[5]}"
  fi
  case "$type" in
    feat|fix|perf|docs) key="$type" ;;
    ci|chore|build|test|refactor|style) key=maintenance ;;
    *) key=other ;;
  esac
  [ -n "$bang" ] && key=breaking
  line="- "
  [ -n "$scope" ] && line="$line**$scope** : "
  printf '%s%s (`%s`)\n' "$line" "$desc" "$sha" >> "$dir/$key"
done

echo "## Quoi de neuf dans $tag"
section() {
  [ -s "$dir/$1" ] || return 0
  printf '\n### %s\n\n' "$2"
  cat "$dir/$1"
}
section breaking "⚠️ Changements majeurs"
section feat "✨ Nouveautés"
section fix "🐛 Corrections"
section perf "⚡ Performances"
section docs "📝 Documentation"
section maintenance "🔧 CI et maintenance"
section other "Autres changements"

if [ -n "${GITHUB_REPOSITORY:-}" ] && [ -n "$prev" ]; then
  printf '\n**Historique complet** : https://github.com/%s/compare/%s...%s\n' "$GITHUB_REPOSITORY" "$prev" "$tag"
fi
