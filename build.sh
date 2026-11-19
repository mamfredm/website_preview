#!/usr/bin/env bash
# Läuft bei jedem Cloudflare-Deploy (Build command: bash build.sh).
# Erzeugt nur auf Test-Branches eine Liste der Kundenordner für die
# Vorschau-Übersicht auf der Startseite. Auf main (preview.click-capybara.com)
# entsteht keine Liste – Kunden sehen sie also nie.
set -uo pipefail
cd "$(dirname "$0")"

if [[ "${CF_PAGES_BRANCH:-}" == "main" || -z "${CF_PAGES_BRANCH:-}" ]]; then
  rm -f _vorschau.json
  echo "Produktion: keine Vorschau-Liste."
  exit 0
fi

# In diesem Branch geänderte Kundenordner (klappt nur, wenn main erreichbar ist)
geaendert=""
if git fetch -q --depth=50 origin main 2>/dev/null; then
  geaendert=$(git diff --name-only FETCH_HEAD...HEAD 2>/dev/null | cut -d/ -f1 | sort -u)
fi

{
  echo '{"branch":"'"${CF_PAGES_BRANCH}"'","kunden":['
  erster=1
  for ordner in */; do
    k="${ordner%/}"
    [[ -d "$k/website" ]] || continue
    [[ "$k" == "muster" ]] && continue
    neu=false
    grep -qx "$k" <<< "$geaendert" && neu=true
    [[ $erster -eq 1 ]] || echo ','
    printf '{"ordner":"%s","geaendert":%s}' "$k" "$neu"
    erster=0
  done
  echo ']}'
} > _vorschau.json

echo "Vorschau-Liste erstellt:"; cat _vorschau.json
