# Fotos der Blue-Barbershop-Vorschau

Alle Fotos in `blue-barbershop/assets/img/` sind echte Bilder aus dem
**Planity-Profil des Kunden** (`https://www.planity.com/blue-barbershop-40479-dusseldorf`,
Kundenuploads, von Mamfred freigegeben). Sie werden **lokal selbst gehostet** –
kein Request zu `mms.cdn...planityapp.com` oder `res.cloudinary.com` im
ausgelieferten HTML (DSGVO, und Planity kann CDN-Pfade jederzeit ändern).

Beide Varianten (`website/` dunkel, `website-2/` hell) teilen sich diesen Ordner
und referenzieren ihn relativ (`../assets/img/...`).

## Neu erzeugen

```bash
python3 blue-barbershop/scripts/optimize-fotos.py          # nur fehlende Varianten
python3 blue-barbershop/scripts/optimize-fotos.py --force  # alles neu kodieren
```

Das Script lädt die Originale einmalig nach `blue-barbershop/.cache-fotos/`
(gitignored, ~7 MB) und schreibt daraus die WebP-/AVIF-Sätze.

## Standard

| Punkt | Wert |
|---|---|
| Formate | WebP (Fallback) + AVIF, je Bild ein `<picture>` |
| Breiten | 480 / 960 / 1440 px für große Bilder, 480 / 960 für Galerie-Kacheln |
| Team-Porträts | 128 / 208 / 312 px (Anzeige 96–104 px) |
| WebP | `quality=78`, `method=6` |
| AVIF | `quality=55` (Pillow/libavif) |
| Budget | jede Datei < 150 KB, sonst bricht das Script ab |
| Markup | `width`/`height` immer gesetzt, `loading="lazy"` + `decoding="async"`, LCP-Bild (`fetchpriority="high"`) eager |
| Zuschnitt | vor dem Skalieren im Script (`crop`), damit die Kachel-Verhältnisse (4:3, 16:9, 1:1) passen |

## Welche Quelle wofür

Die Tabelle steht als `FOTOS`-Liste oben im Script (Quelle, Crop, Breiten,
Verwendung). Kurzfassung:

- **dunkle Variante**: Hero-Hintergrund = Bartpflege am Arbeitsplatz (Foto 9),
  Studio-Galerie = Salon-Panorama (2), Barberstuhl s/w (5), Nassrasur (11)
- **helle Variante**: Teaser-Karte im Hero = Salon-Panorama (2), Teamband =
  die drei Barber (1), Studio-Galerie = Fade im Nacken (7), Kunde auf der
  Kopfstütze (8)
- **beide**: Team-Avatare Ahmed, Saher, Ali aus den Planity-Kalender-Uploads

## Bewusst nicht verwendet

- **Logo-Grafik** (Foto 3): reines Logo auf weißem Grund, kein Foto – im Layout
  wäre es ein leuchtender Kasten im dunklen Design.
- **Bart mit Clips im Gegenlicht** (Foto 10): Marken-Schriftzug steht durch die
  Spiegelung auf dem Kopf, als Hero unbrauchbar.
- **Originale werden nicht committet**: 2400 px × 14 Bilder ≈ 7 MB wären für ein
  Vorschau-Repo unnötig; die Quellen bleiben über die URLs im Script abrufbar.

## Rechte

Fotos stammen aus dem eigenen Planity-Profil des Kunden. **Vor Live-Schaltung**
bestätigen lassen, dass die Nutzungsrechte beim Kunden liegen; für die
Team-Porträts idealerweise das Einverständnis der abgebildeten Personen
einholen (Ahmed, Saher, Ali).
