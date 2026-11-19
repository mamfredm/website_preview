#!/usr/bin/env bash
# Erstellt alle Kontaktkarten (kontakt.vcf) neu:
#   - eine allgemeine im Hauptordner
#   - eine pro Kunde (jeder Ordner mit "website/"), zusätzlich mit Link zur Vorschau
# Daten oder Foto ändern? Oben anpassen bzw. assets/kontakt-foto.jpg ersetzen
# (quadratisch, JPEG, ca. 256x256) und das Skript erneut ausführen.
set -euo pipefail
cd "$(dirname "$0")"

VORNAME="Max"
NACHNAME="Müller"
FIRMA="Click-Capybara"
TITEL="Digital Marketing Spezialist"
EMAIL="hello@click-capybara.com"
WEBSITE="https://click-capybara.com"
TELEFON=""                      # z. B. "+49 211 1234567", leer = keine Nummer
FOTO="assets/kontakt-foto.jpg"
BASIS="https://preview.click-capybara.com"

karte() { # $1 = Zieldatei, $2 = Link zur Vorschau (optional)
  {
    echo "BEGIN:VCARD"
    echo "VERSION:3.0"
    echo "N:$NACHNAME;$VORNAME;;;"
    echo "FN:$VORNAME $NACHNAME"
    echo "ORG:$FIRMA"
    echo "TITLE:$TITEL"
    echo "EMAIL;TYPE=INTERNET,WORK:$EMAIL"
    if [[ -n "$TELEFON" ]]; then echo "TEL;TYPE=WORK,VOICE:$TELEFON"; fi
    echo "item1.URL:$WEBSITE"
    echo "item1.X-ABLabel:Website"
    if [[ -n "${2:-}" ]]; then
      echo "item2.URL:$2"
      echo "item2.X-ABLabel:Deine Website-Vorschau"
    fi
    echo "NOTE:Google Ads · Websites · Lokale Sichtbarkeit"
    if [[ -f "$FOTO" ]]; then
      echo "PHOTO;ENCODING=b;TYPE=JPEG:"
      base64 < "$FOTO" | tr -d '\n' | fold -w 74 | sed 's/^/ /'
      echo
    fi
    echo "END:VCARD"
  } | awk 'NF || /^ / {printf "%s\r\n", $0}' > "$1"
}

karte "kontakt.vcf"
echo "✓ kontakt.vcf (allgemein)"

for ordner in */; do
  kunde="${ordner%/}"
  [[ -d "$kunde/website" ]] || continue
  karte "$kunde/kontakt.vcf" "$BASIS/$kunde/"
  echo "✓ $kunde/kontakt.vcf"
done
