# Click-Capybara · Website-Vorschauen

Läuft als Cloudflare-Pages-Projekt unter **preview.click-capybara.com**.
Nichts hier wird von Google indexiert (Regel in `_headers`).

## Neuer Kunde

```bash
./neuer-kunde.sh baeckerei-schmitz "Bäckerei Schmitz"
```

1. Vorschau-Website nach `baeckerei-schmitz/website/` legen.
2. Committen und pushen. Cloudflare veröffentlicht automatisch.
3. NFC-Tag beschreiben mit `https://preview.click-capybara.com/baeckerei-schmitz`

Ohne Terminal geht es auch: Ordner `muster` kopieren, umbenennen und
in `index.html` das Wort „Musterfirma“ durch den Kundennamen ersetzen.
Danach `./kontaktkarten.sh` ausführen (oder in der `kontakt.vcf` des neuen
Ordners `/muster/` durch `/<kunde>/` ersetzen).

## Zwei (oder mehr) Varianten für einen Kunden

Alle Varianten liegen im selben Kundenordner, damit der Kunde nur **einen** Link
(und einen NFC-Tag) bekommt:

```
blue-barbershop/
├── index.html                  Zwischenseite mit je einem Knopf pro Variante
├── website/                    Variante 1
├── website-2/                  Variante 2
├── angebot.json                Angebot für Variante 1 (und Fallback)
└── angebot-website-2.json      optional: eigenes Angebot für Variante 2
```

1. Zweite Vorschau nach `<kunde>/website-2/` legen (Pfade relativ halten).
2. In `<kunde>/index.html` den auskommentierten Knopf „Variante 2 ansehen“ aus der
   Vorlage `muster/index.html` übernehmen und die Texte anpassen
   („zwei Vorschauen“, kurze Beschreibung pro Variante).
3. Soll Variante 2 ein anderes Angebot zeigen: `angebot-website-2.json` anlegen.
   Fehlt die Datei, zeigt der Button das normale `angebot.json`.

Keinen zweiten Kundenordner (`kunde2`) anlegen. Alte Adressen, die schon verteilt
wurden, in `_redirects` auf den neuen Ort umleiten.

## Angebotsseite (`/<kunde>/angebot/`)

Interaktives Angebot statt nur PDF: Bausteine auswählen, Preis rechnet live mit,
pro Baustein aufklappbar, welche Arbeit drinsteckt. „Angebot annehmen“ öffnet eine
fertige Mail mit Auswahl und Gesamtpreis.

- Seite: `<kunde>/angebot/index.html` (von `tun-sein-ergotherapie/angebot/` kopieren)
- Inhalt: `<kunde>/angebot/daten.json`, Darstellung: `assets/angebot-seite.js` + `.css`
- Gruppen-Typen: `fest` (immer dabei), `wahl` (genau eine Option), `option` (an/aus)
- `empfohlen: true` markiert Optionen, `empfehlung.auswahl` ist die Vorauswahl
- `rabatte[].wenn`: Rabatt gilt, wenn alle genannten Options-IDs gewählt sind
- Verbindlich bleibt das PDF-Angebot mit Angebotsnummer; die Seite erklärt es.
- Für fremde Kunden einen schwer zu erratenden Ordnernamen nehmen (z. B. `angebot-7k3f/`),
  da jeder mit dem Link die Preise sieht.

## Kontaktkarten

`./kontaktkarten.sh` erzeugt alle Karten neu: die allgemeine `kontakt.vcf`
und pro Kunde eine eigene mit dem Link „Deine Website-Vorschau“.
Das Bild ist `assets/kontakt-foto.jpg` (quadratisch, JPEG, ca. 256×256).
Telefonnummer, Foto oder Titel ändern: oben im Skript anpassen bzw. Bild
ersetzen und das Skript einmal ausführen.

## Angebots-Button („Angebot & Preise“)

Schwebender Button unten links in der Vorschau. Beim Antippen öffnet sich ein
Panel mit den maßgeschneiderten Punkten und Preisen aus `/<kunde>/angebot.json`.

- **Inhalt pflegen:** `angebot.json` im Kundenordner bearbeiten
  (`loesungen` = Liste, `preise` = Name, Preis, Hinweis, optional `"optional": true`).
- **Einbinden:** In `website/index.html` vor `</body>`:
  `<script src="/assets/info-button.js" defer></script>`
  (in der Vorlage `muster` schon drin).
- **Ausblenden:** `angebot.json` löschen, dann erscheint kein Button.
- Läuft nur auf `preview.click-capybara.com` und Testadressen. Auf der späteren
  Live-Domain des Kunden bleibt er unsichtbar, auch wenn die Zeile drinbleibt.

## Vorschau-Übersicht (Testadressen)

Auf den Cloudflare-Testadressen (`<branch>.website-preview-4pv.pages.dev`) zeigt die
Startseite oben eine Liste aller Kundenseiten, im Branch geänderte zuerst. So führt
auch der Link aus der Cloudflare-Mail mit einem Klick zur richtigen Kundenseite.
Die Liste erzeugt `build.sh` beim Deploy. Dafür in Cloudflare unter
Settings → Build → Build command: `bash build.sh` eintragen.
Auf `preview.click-capybara.com` (main) entsteht keine Liste.

## Aufbau

| Pfad | Zweck |
|---|---|
| `/<kunde>/` | Zwischenseite: Vorschau ansehen oder Kontakt speichern |
| `/<kunde>/website/` | Die eigentliche Vorschau |
| `/<kunde>/website-2/` | Optional: zweite Variante |
| `_redirects` | Weiterleitungen für umgezogene Vorschau-Adressen |
| `/` | Allgemeine Seite (Kontakt + click-capybara.com) |
| `404.html` | Für unbekannte oder gelöschte Vorschauen |
| `kontakt.vcf` | Allgemeine Kontaktkarte (Startseite, 404) |
| `/<kunde>/kontakt.vcf` | Kontaktkarte mit Link zur Vorschau des Kunden |
| `kontaktkarten.sh` | Erzeugt alle Kontaktkarten neu |
| `/<kunde>/angebot.json` | Inhalt des Angebots-Buttons |
| `assets/info-button.js` | Angebots-Button für alle Vorschauen |
| `assets/style.css` | Gemeinsames Design aller Zwischenseiten |
| `_headers` | noindex für alles + Dateityp der Kontaktkarte |

## Vorschau offline nehmen

Ordner löschen. Wer den Tag danach antippt, landet auf der 404-Seite mit
Kontaktmöglichkeit statt auf einer Fehlermeldung.

## Wichtig

- **Keine `robots.txt` mit `Disallow` anlegen.** Sonst kann Google das noindex nicht lesen.
- Kürzel nur aus Kleinbuchstaben, Ziffern und Bindestrichen (`ae` statt `ä`).
- Pfade in den Vorschauen relativ halten (`css/style.css`, nicht `/css/style.css`).
- Telefonnummer später oben in `kontaktkarten.sh` eintragen und das Skript ausführen.
