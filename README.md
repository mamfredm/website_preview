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

## Aufbau

| Pfad | Zweck |
|---|---|
| `/<kunde>/` | Zwischenseite: Vorschau ansehen oder Kontakt speichern |
| `/<kunde>/website/` | Die eigentliche Vorschau |
| `/` | Allgemeine Seite (Kontakt + click-capybara.com) |
| `404.html` | Für unbekannte oder gelöschte Vorschauen |
| `kontakt.vcf` | Kontaktkarte für alle Seiten |
| `assets/style.css` | Gemeinsames Design aller Zwischenseiten |
| `_headers` | noindex für alles + Dateityp der Kontaktkarte |

## Vorschau offline nehmen

Ordner löschen. Wer den Tag danach antippt, landet auf der 404-Seite mit
Kontaktmöglichkeit statt auf einer Fehlermeldung.

## Wichtig

- **Keine `robots.txt` mit `Disallow` anlegen.** Sonst kann Google das noindex nicht lesen.
- Kürzel nur aus Kleinbuchstaben, Ziffern und Bindestrichen (`ae` statt `ä`).
- Pfade in den Vorschauen relativ halten (`css/style.css`, nicht `/css/style.css`).
- Telefonnummer später in `kontakt.vcf` ergänzen: `TEL;TYPE=WORK,VOICE:+49...`
