#!/usr/bin/env bash
# Legt im bestehenden Kundenordner eine weitere Variante an (website-2/, website-3/ …)
# und ergänzt die Zwischenseite um einen Knopf.
#
# Aufruf:
#   ./neue-variante.sh <kunde> "<Beschreibung neue Variante>" [Optionen]
# Optionen:
#   --von <ordner>        Startpunkt kopieren, z. B. website oder website-2
#                         (ohne: leere Vorlage aus muster/website)
#   --erste "<Text>"      Beschreibung für Variante 1. Pflicht bei der ersten
#                         zusätzlichen Variante, weil aus "Vorschau ansehen"
#                         dann "Variante 1 ansehen" wird.
#   --angebot             angebot.json als angebot-website-N.json kopieren
#                         (für ein eigenes Angebot dieser Variante)
# Beispiel:
#   ./neue-variante.sh blue-barbershop "Helles Design in euren Logo-Farben" --von website --erste "Dunkles Design"
set -euo pipefail
cd "$(dirname "$0")"

kunde="${1:-}"; beschreibung="${2:-}"
shift 2 2>/dev/null || true
von=""; erste=""; angebot=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --von) von="${2:-}"; shift 2 ;;
    --erste) erste="${2:-}"; shift 2 ;;
    --angebot) angebot=true; shift ;;
    *) echo "Unbekannte Option: $1"; exit 1 ;;
  esac
done

fehler() { echo "$1" >&2; exit 1; }
[[ -n "$kunde" && -n "$beschreibung" ]] || fehler 'Aufruf: ./neue-variante.sh <kunde> "<Beschreibung>" [--von website] [--erste "<Text>"] [--angebot]'
[[ "$kunde" =~ ^[a-z0-9-]+$ && "$kunde" != "muster" ]] || fehler "Ungültiger Kundenordner: $kunde"
[[ -f "$kunde/index.html" && -d "$kunde/website" ]] || fehler "Kundenordner '$kunde' gibt es nicht. Neue Kunden mit ./neuer-kunde.sh anlegen."
seite="$kunde/index.html"

# Bestandskunden (Zwischenseite ohne Vorschau-Knopf, siehe README "Bestandskunden")
if grep -q 'Der nächste Schritt für' "$seite" || ! grep -q -E '>(Vorschau|Variante 1) ansehen<' "$seite"; then
  fehler "$kunde ist als Bestandskunde angelegt (Zwischenseite ohne \"Vorschau ansehen\"). Varianten gibt es dort nicht; bitte mit Mamfred klären. Nichts geändert."
fi

# Nächste freie Nummer
n=2
while [[ -e "$kunde/website-$n" ]]; do n=$((n + 1)); done
ziel="website-$n"
vorher=$([[ $n -eq 2 ]] && echo "website" || echo "website-$((n - 1))")
grep -q "href=\"$vorher/\"" "$seite" || fehler "In $seite fehlt der Knopf für $vorher/. Bitte erst von Hand prüfen."

if [[ $n -eq 2 ]]; then
  [[ -n "$erste" ]] || fehler 'Erste zusätzliche Variante: bitte --erste "<Beschreibung Variante 1>" angeben (z. B. "Dunkles Design").'
fi

if $angebot; then
  [[ -f "$kunde/angebot.json" ]] || fehler "Kein $kunde/angebot.json zum Kopieren (--angebot weglassen oder erst angebot.json anlegen)."
fi

case $n in 2) wort=zwei ;; 3) wort=drei ;; 4) wort=vier ;; 5) wort=fünf ;; *) wort="$n" ;; esac

# 1. Ordner anlegen
if [[ -n "$von" ]]; then
  [[ -d "$kunde/$von" ]] || fehler "Startpunkt '$kunde/$von' gibt es nicht."
  cp -R "$kunde/$von" "$kunde/$ziel"
else
  cp -R muster/website "$kunde/$ziel"
  name=$(perl -ne 'print $1 if /<span class="name">([^<]+)<\/span>/' "$seite")
  [[ -n "$name" ]] && NAME="$name" perl -pi -e 's/Musterfirma/$ENV{NAME}/g' "$kunde/$ziel/index.html"
fi

# 2. Zwischenseite anpassen
export ZIEL="$ziel" VORHER="$vorher" N="$n" BESCHR="$beschreibung" ERSTE="$erste" WORT="$wort"
perl -0pi -e '
  my ($ziel, $vorher, $n, $b, $erste, $wort) = @ENV{qw(ZIEL VORHER N BESCHR ERSTE WORT)};
  # Variante 1 umbenennen (nur beim ersten Mal)
  if ($n == 2) {
    s{(href="website/">\s*<span>)Vorschau ansehen<small>[^<]*</small>}{${1}Variante 1 ansehen<small>$erste</small>}
      or warn "Hinweis: Knopf \"Vorschau ansehen\" nicht gefunden, Variante 1 bitte von Hand benennen.\n";
  }
  # Neuen Knopf einfügen: vor dem Angebot-Knopf (Fixpunkt), sonst hinter der vorigen Variante
  my $knopf = qq{<a class="knopf knopf-haupt" href="$ziel/">\n        <span>Variante $n ansehen<small>$b</small></span>\n        <span class="pfeil" aria-hidden="true">→</span>\n      </a>};
  s{^([ \t]*)(<a class="knopf[^"]*" href="angebot[^"]*/">)}{$1$knopf\n\n$1$2}m
    or s{(<a class="knopf knopf-haupt" href="\Q$vorher\E/">.*?</a>)}{$1\n\n      $knopf}s;
  # Einleitung und Kontakt-Knopf
  s{schon mal (?:eine Vorschau|\S+ Vorschauen) für}{schon mal $wort Vorschauen für}
    or warn "Hinweis: Einleitung nicht erkannt, Anzahl der Vorschauen bitte von Hand anpassen.\n";
  s{Mit Link zu deiner Vorschau<}{Mit Link zu deinen Vorschauen<};
' "$seite"

# 3. Optional eigenes Angebot
if $angebot; then
  cp "$kunde/angebot.json" "$kunde/angebot-$ziel.json"
fi

# 4. Angebots-Button prüfen
grep -q 'assets/info-button.js' "$kunde/$ziel/index.html" \
  || echo "Achtung: $kunde/$ziel/index.html bindet /assets/info-button.js noch nicht ein (vor </body> ergänzen)."

echo "Fertig: $kunde/$ziel/"
echo "- Vorschau-Dateien nach $kunde/$ziel/ legen, Pfade relativ halten"
$angebot && echo "- Angebot dieser Variante in $kunde/angebot-$ziel.json anpassen"
echo "- Zwischenseite prüfen: $seite"
echo "Links nach dem Merge:"
echo "  https://preview.click-capybara.com/$kunde/"
for v in "$kunde"/website "$kunde"/website-*; do
  [[ -d "$v" ]] && echo "  https://preview.click-capybara.com/$v/"
done
