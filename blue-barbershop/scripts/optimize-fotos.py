#!/usr/bin/env python3
"""
Pixel & Rank Bild-Pipeline für die Blue-Barbershop-Vorschau.

Erzeugt aus den Original-Fotos des Planity-Profils (Kundenuploads) lokal
gehostete, responsive WebP- und AVIF-Sätze unter blue-barbershop/assets/img/.

Regeln (siehe scripts/README.md):
  - Breiten pro Bild aus BREITEN; nie hochskaliert (Obergrenze = Quellbreite).
  - WebP  quality 78, method 6
  - AVIF  quality 55 (Pillow/libavif)
  - Zuschnitt (Crop) passiert VOR dem Skalieren, damit die Kacheln im Layout
    (4:3, 3:2, 1:1) ohne CSS-Verrenkung sitzen.
  - Jede Datei < 150 KB, sonst bricht das Script ab.

Aufruf (aus dem Repo-Root):
    python3 blue-barbershop/scripts/optimize-fotos.py            # alles
    python3 blue-barbershop/scripts/optimize-fotos.py --force    # neu kodieren

Originale werden nach blue-barbershop/.cache-fotos/ geladen (nicht im Repo,
siehe .gitignore). Sie bleiben im Planity-Profil des Kunden abrufbar; die
Download-URLs stehen unten als Quelle jedes Bildes.
"""
import argparse
import os
import sys
import urllib.request

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

HIER = os.path.dirname(os.path.abspath(__file__))
KUNDE = os.path.dirname(HIER)                       # blue-barbershop/
REPO = os.path.dirname(KUNDE)
CACHE = os.path.join(KUNDE, ".cache-fotos")
ZIEL = os.path.join(KUNDE, "assets", "img")

PLANITY = "https://mms.cdn.global.prodsharedsvc.planityapp.com/planity/image/upload/w_2400,q_auto,f_auto/"
PLANITY_STAFF = ("https://mms.cdn.global.prodsharedsvc.planityapp.com/planity/image/upload/"
                 "businesses/-OTfeFEaSi2JcdB-I3B9/calendars/")

WEBP_Q = 78
AVIF_Q = 55
MAX_KB = 150

# ziel                Quelle (Planity-Foto)                             Crop (l,o,r,u) oder None          Breiten
FOTOS = [
    # ── Salon-Impressionen ────────────────────────────────────────────────
    dict(id="foto09", quelle=PLANITY + "fg1inmre1kzqtq2eijgr",
         ziel="salon/hero-bartschnitt", crop=(0, 780, 2400, 2380),
         breiten=[480, 960, 1440],
         verwendung="dunkle Variante: Hero-Hintergrund (Bartpflege am Arbeitsplatz)"),
    dict(id="foto02", quelle=PLANITY + "akbnr3136kfytcq0qzpq",
         ziel="salon/interieur", crop=None,
         breiten=[480, 960, 1440],
         verwendung="helle Variante: Bild in der Hero-Teaserkarte (Salon-Panorama)"),
    dict(id="foto01", quelle=PLANITY + "qr1o8m4vsqcpockl8wlr",
         ziel="salon/team-vor-ort", crop=(0, 60, 2400, 1410),
         breiten=[480, 960, 1440],
         verwendung="helle Variante: Teamband über den Team-Karten (Ahmed, Saher, Ali)"),
    dict(id="foto05", quelle=PLANITY + "lq70ckzr6hcgvyfkdlco",
         ziel="salon/stuhl-schwarzweiss", crop=(0, 700, 2400, 2500),
         breiten=[480, 960],
         verwendung="dunkle Variante: Studio-Galerie (Barberstuhl, s/w)"),
    dict(id="foto11", quelle=PLANITY + "qvbnazruoa0gxl3h6mqb",
         ziel="salon/rasiermesser", crop=(0, 760, 2400, 2560),
         breiten=[480, 960],
         verwendung="dunkle Variante: Studio-Galerie (Nassrasur mit dem Messer)"),
    dict(id="foto07", quelle=PLANITY + "n4jzze59m15hyxftcdvp",
         ziel="salon/fade-nacken", crop=(0, 944, 2400, 2744),
         breiten=[480, 960],
         verwendung="helle Variante: Studio-Galerie (Fade am Hinterkopf)"),
    dict(id="foto08", quelle=PLANITY + "wffhxzcdpcuqn0fsup3z",
         ziel="salon/kopfstuetze", crop=None,
         breiten=[480, 960],
         verwendung="helle Variante: Studio-Galerie (Kunde entspannt auf der Kopfstütze)"),
    # ── Team (Kundenuploads im Planity-Kalender) ──────────────────────────
    dict(id="ahmed", quelle=PLANITY_STAFF + "023a3bdb-b6e9-46e1-84a6-3fd65a8c4a5f_kcmrbd",
         ziel="team/ahmed", crop=None, breiten=[128, 208, 312],
         verwendung="beide Varianten: Porträt Ahmed in der Team-Karte"),
    dict(id="saher", quelle=PLANITY_STAFF + "c096d9f8-6637-4af8-b5fe-f7cbda1290ec_uwrl5m",
         ziel="team/saher", crop=(316, 0, 3355, 3039), breiten=[128, 208, 312],
         verwendung="beide Varianten: Porträt Saher in der Team-Karte"),
    dict(id="ali", quelle=PLANITY_STAFF + "c1f3683e-2b1c-4110-a9a9-23bea00697be_szphkq",
         ziel="team/ali", crop=(40, 10, 300, 270), breiten=[128, 208, 250],
         verwendung="beide Varianten: Porträt Ali in der Team-Karte (enges Crop, "
                   "weil das Original nur 511x640 px liefert und im Rahmen ein Kunde sitzt)"),
]


def hole(foto):
    """Original in den Cache laden (die Quelle ist ein CDN-Bild des Kundenprofils)."""
    pfad = os.path.join(CACHE, foto["id"] + ".jpg")
    if not os.path.exists(pfad) or os.path.getsize(pfad) < 5000:
        print(f"  lade {foto['id']} …")
        req = urllib.request.Request(foto["quelle"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r, open(pfad, "wb") as f:
            f.write(r.read())
    return pfad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="vorhandene Varianten überschreiben")
    args = ap.parse_args()

    os.makedirs(CACHE, exist_ok=True)
    verstoesse = []
    zeilen = []

    for foto in FOTOS:
        print(f"==> {foto['ziel']}")
        bild = Image.open(hole(foto))
        if bild.mode != "RGB":
            bild = bild.convert("RGB")
        if foto["crop"]:
            bild = bild.crop(foto["crop"])
        quelle_breite = bild.width
        max_w = 0

        for w in foto["breiten"]:
            w = min(w, quelle_breite)
            max_w = max(max_w, w)
            h = round(bild.height * w / bild.width)
            skaliert = bild if w == quelle_breite else bild.resize((w, h), Image.LANCZOS)

            for fmt, endung, kwargs in (
                ("WEBP", "webp", dict(quality=WEBP_Q, method=6)),
                ("AVIF", "avif", dict(quality=AVIF_Q, speed=4)),
            ):
                out = os.path.join(ZIEL, foto["ziel"] + f"-{w}w.{endung}")
                os.makedirs(os.path.dirname(out), exist_ok=True)
                if os.path.exists(out) and not args.force:
                    print(f"  - {w}w {endung}: vorhanden")
                else:
                    skaliert.save(out, format=fmt, **kwargs)
                    print(f"  - {w}w {endung}: kodiert")
                kb = os.path.getsize(out) / 1024
                if kb >= MAX_KB:
                    verstoesse.append(f"{out} = {kb:.0f} KB")
                if w == max_w and endung == "webp":
                    zeilen.append((foto["ziel"], f"{w}x{h}", f"{kb:.0f} KB"))

    print("\nGrößte WebP-Variante pro Bild:")
    for z, mass, kb in zeilen:
        print(f"  {z:<34} {mass:<10} {kb}")

    if verstoesse:
        print("\nFEHLER: Budget von 150 KB verletzt:", file=sys.stderr)
        for v in verstoesse:
            print("  " + v, file=sys.stderr)
        return 1
    print("\nOK – alle Varianten unter 150 KB.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
