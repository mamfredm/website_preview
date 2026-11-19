#!/usr/bin/env bash
# Legt einen neuen Kundenordner aus der Vorlage "muster" an.
# Aufruf:  ./neuer-kunde.sh baeckerei-schmitz "Bäckerei Schmitz"
set -euo pipefail

slug="${1:-}"
name="${2:-}"

if [[ -z "$slug" || -z "$name" ]]; then
  echo 'Aufruf: ./neuer-kunde.sh <kuerzel> "<Anzeigename>"'
  echo 'Beispiel: ./neuer-kunde.sh baeckerei-schmitz "Bäckerei Schmitz"'
  exit 1
fi
if [[ ! "$slug" =~ ^[a-z0-9-]+$ ]]; then
  echo "Kürzel nur aus Kleinbuchstaben, Ziffern und Bindestrichen (keine Umlaute): $slug"
  exit 1
fi
if [[ -e "$slug" ]]; then
  echo "Ordner '$slug' gibt es schon."
  exit 1
fi

cd "$(dirname "$0")"
cp -R muster "$slug"

# Namen einsetzen (& und / im Namen für sed entschärfen)
safe=$(printf '%s' "$name" | sed -e 's/[&/\]/\\&/g')
for f in "$slug/index.html" "$slug/website/index.html" "$slug/angebot.json"; do
  sed -i.bak "s/Musterfirma/$safe/g" "$f" && rm "$f.bak"
done

./kontaktkarten.sh >/dev/null

echo "Fertig: $slug/ (inkl. eigener Kontaktkarte)"
echo "1. Vorschau-Dateien nach $slug/website/ legen (index.html dort ersetzen)"
echo "2. Committen und pushen"
echo "3. Auf den NFC-Tag schreiben: https://preview.click-capybara.com/$slug"
