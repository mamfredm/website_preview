/*!
 * Click-Capybara Angebotsseite
 * Rendert /<kunde>/angebot/ aus der daten.json im selben Ordner.
 * Gruppen-Typen: "fest" (immer dabei), "wahl" (genau eine Option), "option" (an/aus).
 * Rabatte gelten, wenn alle IDs in "wenn" ausgewählt sind.
 */
(function () {
  'use strict';
  var main = document.getElementById('angebot');
  if (!main) return;

  var eur = function (n) {
    return n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  fetch(main.getAttribute('data-daten') || 'daten.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(baue)
    .catch(function () {
      main.insertAdjacentHTML('beforeend', '<p class="einleitung" style="margin-top:40px">Das Angebot konnte nicht geladen werden. Schreib mir gern an hello@click-capybara.com.</p>');
    });

  function baue(d) {
    var auswahl = {}; // gruppe-id -> option-id | true/false
    var start = (d.empfehlung && d.empfehlung.auswahl) || {};
    d.gruppen.forEach(function (g) {
      if (g.typ === 'fest') auswahl[g.id] = g.optionen[0].id;
      else if (g.typ === 'wahl') auswahl[g.id] = start[g.id] || g.optionen[0].id;
      else auswahl[g.id] = start[g.id] !== undefined ? !!start[g.id] : false;
    });

    var html = '';
    html += '<section class="a-kopf">' +
      '<p class="vorzeile">Angebot · gültig bis ' + esc(d.gueltigBis) + '</p>' +
      '<h1>' + esc(d.titel) + ' <span class="name">für ' + esc(d.kurzname) + '</span></h1>' +
      '<p class="einleitung">' + esc(d.einleitung) + '</p>' +
      '</section>';

    if (d.empfehlung) {
      html += '<aside class="a-empfehlung"><p class="a-label">' + esc(d.empfehlung.titel) + '</p>' +
        '<p>' + esc(d.empfehlung.text) + '</p>' +
        '<button type="button" class="a-mini" data-empfehlung>Empfehlung auswählen</button></aside>';
    }

    d.gruppen.forEach(function (g) {
      html += '<section class="a-gruppe" data-gruppe="' + esc(g.id) + '">';
      if (g.typ !== 'fest' || d.gruppen.length > 1) html += '<h2>' + esc(g.titel) + '</h2>';
      g.optionen.forEach(function (o) {
        var input = '';
        if (g.typ === 'wahl') input = '<input type="radio" name="' + esc(g.id) + '" value="' + esc(o.id) + '">';
        else if (g.typ === 'option') input = '<input type="checkbox" name="' + esc(g.id) + '" value="' + esc(o.id) + '">';
        else input = '<span class="a-fest" aria-hidden="true">✓</span>';

        html += '<div class="a-karte' + (o.empfohlen ? ' empfohlen' : '') + '" data-option="' + esc(o.id) + '">' +
          '<label class="a-kopfzeile">' + input +
            '<span class="a-name">' + esc(o.name) +
              (o.empfohlen ? ' <em class="a-badge">Empfohlen</em>' : '') +
              (g.typ === 'fest' ? ' <em class="a-badge leise">Immer dabei</em>' : '') +
              '<small>' + esc(o.beschreibung) + '</small></span>' +
            '<span class="a-preis"><s>' + eur(o.regulaer) + '</s><b>' + eur(o.preis) + '</b></span>' +
          '</label>';
        if (o.vorteile) html += '<ul class="a-liste plus">' + o.vorteile.map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('') + '</ul>';
        if (o.nachteile) html += '<ul class="a-liste minus">' + o.nachteile.map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('') + '</ul>';
        if (o.aufwand) {
          html += '<details class="a-aufwand"><summary>Welche Arbeit steckt drin?</summary><table>' +
            o.aufwand.map(function (a) {
              return '<tr><td><b>' + esc(a[0]) + '</b><span>' + esc(a[1]) + '</span></td><td>' + esc(a[2]) + '</td></tr>';
            }).join('') + '</table><p class="a-klein">' + (o.angebot ? 'Angebot ' + esc(o.angebot) + ' · ' : '') + 'Regulär ' + eur(o.regulaer) + ', ' + esc(d.rabattName || 'Rabatt') + ' ' + eur(o.regulaer - o.preis) + '</p></details>';
        }
        html += '</div>';
      });
      html += '</section>';

      if (g.id === 'formular' && d.vergleich) html += vergleich(d.vergleich);
      if (g.id === 'cloudflare' && d.ablauf) html += ablauf(d.ablauf);
    });

    html += '<section class="a-summe" aria-live="polite"></section>';

    if (d.hinweise) {
      html += '<details class="a-hinweise"><summary>Hinweise zum Angebot</summary><ul>' +
        d.hinweise.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></details>';
    }
    if (d.fussnote) html += '<p class="a-klein a-fuss">' + esc(d.fussnote) + '</p>';

    main.insertAdjacentHTML('beforeend', html);

    // Eingaben vorbelegen und verdrahten
    function setzeEingaben() {
      main.querySelectorAll('input').forEach(function (i) {
        var g = i.name;
        i.checked = i.type === 'radio' ? auswahl[g] === i.value : !!auswahl[g];
        i.closest('.a-karte').classList.toggle('aktiv', i.checked);
      });
      main.querySelectorAll('.a-fest').forEach(function (f) { f.closest('.a-karte').classList.add('aktiv'); });
    }
    main.addEventListener('change', function (e) {
      var i = e.target;
      if (i.tagName !== 'INPUT') return;
      auswahl[i.name] = i.type === 'radio' ? i.value : i.checked;
      setzeEingaben(); rechne();
    });
    var knopf = main.querySelector('[data-empfehlung]');
    if (knopf) knopf.addEventListener('click', function () {
      Object.keys(start).forEach(function (k) { auswahl[k] = start[k]; });
      setzeEingaben(); rechne();
      main.querySelector('.a-summe').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    function gewaehlt() {
      var liste = [];
      d.gruppen.forEach(function (g) {
        g.optionen.forEach(function (o) {
          var an = g.typ === 'option' ? !!auswahl[g.id] : auswahl[g.id] === o.id;
          if (an) liste.push(o);
        });
      });
      return liste;
    }

    function rechne() {
      var posten = gewaehlt();
      var ids = posten.map(function (o) { return o.id; });
      var regulaer = 0, preis = 0;
      posten.forEach(function (o) { regulaer += o.regulaer; preis += o.preis; });
      var rabatte = (d.rabatte || []).filter(function (r) {
        return r.wenn.every(function (id) { return ids.indexOf(id) !== -1; });
      });
      rabatte.forEach(function (r) { preis -= r.betrag; });
      var nummern = [];
      posten.forEach(function (o) { if (o.angebot && nummern.indexOf(o.angebot) === -1) nummern.push(o.angebot); });
      var empfohlen = Object.keys(start).every(function (k) { return auswahl[k] === start[k]; });

      var zeilen = posten.map(function (o) {
        return '<tr><td>' + esc(o.name) + '</td><td>' + eur(o.preis) + '</td></tr>';
      }).join('') + rabatte.map(function (r) {
        return '<tr class="rabatt"><td>' + esc(r.name) + '<small>' + esc(r.beschreibung) + '</small></td><td>−' + eur(r.betrag) + '</td></tr>';
      }).join('');

      var betreff = 'Angebot ' + nummern.join(' + ') + ' annehmen';
      var text = 'Hallo Max,\n\nwir nehmen folgendes Angebot an:\n\n' +
        posten.map(function (o) { return '- ' + o.name + (o.angebot ? ' (' + o.angebot + ')' : '') + ': ' + eur(o.preis); }).join('\n') +
        rabatte.map(function (r) { return '\n- ' + r.name + ': −' + eur(r.betrag); }).join('') +
        '\n\nGesamt: ' + eur(preis) + '\n\nViele Grüße';
      var mail = 'mailto:' + d.email + '?subject=' + encodeURIComponent(betreff) + '&body=' + encodeURIComponent(text);
      var frage = 'mailto:' + d.email + '?subject=' + encodeURIComponent('Frage zum Angebot ' + nummern.join(' + '));

      main.querySelector('.a-summe').innerHTML =
        '<p class="a-label">' + (empfohlen ? 'Eure Auswahl · entspricht meiner Empfehlung' : 'Eure Auswahl') + '</p>' +
        '<table class="a-posten">' + zeilen + '</table>' +
        '<div class="a-gesamt"><span>Euer Preis<small>regulär ' + eur(regulaer) + ' · ihr spart ' + eur(regulaer - preis) + '</small></span><b>' + eur(preis) + '</b></div>' +
        '<a class="knopf knopf-haupt" href="' + mail + '"><span>Angebot annehmen<small>Öffnet eine fertige Mail an mich</small></span><span class="pfeil" aria-hidden="true">→</span></a>' +
        '<a class="knopf knopf-neben" href="' + frage + '"><span>Erst eine Frage stellen<small>' + esc(d.email) + '</small></span><span class="pfeil" aria-hidden="true">?</span></a>';
    }

    setzeEingaben(); rechne();
  }

  function vergleich(v) {
    return '<details class="a-vergleich"><summary>' + esc(v.titel) + '</summary><div class="a-scroll"><table>' +
      '<thead><tr>' + v.spalten.map(function (s, i) { return '<th' + (i === 1 ? ' class="hervor"' : '') + '>' + esc(s) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      v.zeilen.map(function (z) {
        return '<tr>' + z.map(function (c, i) { return (i === 0 ? '<th>' : '<td' + (i === 1 ? ' class="hervor"' : '') + '>') + esc(c) + (i === 0 ? '</th>' : '</td>'); }).join('') + '</tr>';
      }).join('') + '</tbody></table></div></details>';
  }

  function ablauf(a) {
    return '<section class="a-ablauf"><h2>' + esc(a.titel) + '</h2><p class="einleitung">' + esc(a.einleitung) + '</p><ol>' +
      a.schritte.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></li>'; }).join('') +
      '</ol></section>';
  }
})();
