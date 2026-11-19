/*!
 * Click-Capybara Info-Button für Website-Vorschauen
 * Einbinden in der Vorschau (website/index.html), vor </body>:
 *   <script src="/assets/info-button.js" defer></script>
 * Inhalt kommt aus /<kunde>/angebot.json.
 * Läuft nur auf preview.click-capybara.com, *.pages.dev und localhost –
 * auf der späteren Live-Domain des Kunden passiert nichts.
 */
(function () {
  'use strict';
  var host = location.hostname;
  var erlaubt = host === 'preview.click-capybara.com' || /\.pages\.dev$/.test(host) ||
                host === 'localhost' || host === '127.0.0.1';
  if (!erlaubt) return;

  var kunde = location.pathname.split('/').filter(Boolean)[0];
  if (!kunde) return;

  fetch('/' + kunde + '/angebot.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (a) { baue(a); })
    .catch(function () { /* kein Angebot hinterlegt → kein Button */ });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function baue(a) {
    // Schrift einmal im Dokument registrieren (Shadow DOM kann @font-face nicht selbst)
    var f = document.createElement('style');
    f.textContent = '@font-face{font-family:"CC Space Grotesk";src:url("/assets/fonts/space-grotesk-latin.woff") format("woff");font-weight:300 700;font-display:swap}';
    document.head.appendChild(f);

    var host = document.createElement('div');
    host.setAttribute('data-cc-info', '');
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: 'open' });

    var punkte = (a.loesungen || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
    var preise = (a.preise || []).map(function (p) {
      return '<li class="preis' + (p.optional ? ' opt' : '') + '">' +
        '<div class="pz"><span class="pn">' + esc(p.name) + (p.optional ? ' <em>optional</em>' : '') + '</span>' +
        '<span class="pb">' + esc(p.preis) + '</span></div>' +
        (p.hinweis ? '<div class="ph">' + esc(p.hinweis) + '</div>' : '') + '</li>';
    }).join('');
    var betreff = encodeURIComponent('Website für ' + (a.kunde || 'mein Unternehmen'));

    root.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      '.w{position:fixed;left:18px;bottom:18px;z-index:2147483000;font-family:"CC Space Grotesk",system-ui,-apple-system,sans-serif;color:#f4f0e6;-webkit-font-smoothing:antialiased}' +
      '.knopf{display:flex;align-items:center;gap:10px;background:#fcba01;color:#12110d;border:0;border-radius:999px;' +
        'padding:8px 18px 8px 8px;font-family:inherit;font-weight:700;font-size:15px;line-height:1;cursor:pointer;' +
        'box-shadow:0 10px 30px -8px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.08)}' +
      '.knopf:hover{transform:translateY(-1px)}' +
      '.knopf:focus-visible,.p a:focus-visible,.zu:focus-visible{outline:3px solid #fff;outline-offset:3px}' +
      '.logo{width:34px;height:34px;border-radius:50%;background:#12110d;display:grid;place-items:center}' +
      '.logo img{width:26px;height:26px;display:block}' +
      '.p{position:absolute;left:0;bottom:62px;width:min(380px,calc(100vw - 36px));max-height:min(78vh,640px);overflow:auto;' +
        'background:#12110d;border:1px solid #2c2a22;border-radius:18px;padding:22px 20px 18px;' +
        'box-shadow:0 24px 60px -12px rgba(0,0,0,.7)}' +
      '.p[hidden]{display:none}' +
      '.kopf{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:4px}' +
      '.vz{color:#fcba01;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}' +
      'h2{font-size:21px;line-height:1.2;font-weight:700;margin:6px 0 14px;outline:none}' +
      '.zu{background:#1f1d17;border:0;color:#f4f0e6;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;flex:none}' +
      'h3{font-size:13px;color:#b9b3a3;font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin:16px 0 8px}' +
      'ul{list-style:none}' +
      '.lo li{position:relative;padding:5px 0 5px 24px;font-size:14.5px;line-height:1.45}' +
      '.lo li::before{content:"";position:absolute;left:2px;top:11px;width:12px;height:7px;border-left:2.5px solid #fcba01;border-bottom:2.5px solid #fcba01;transform:rotate(-45deg)}' +
      '.preis{padding:10px 0;border-top:1px solid #2c2a22}' +
      '.pz{display:flex;justify-content:space-between;gap:12px;align-items:baseline}' +
      '.pn{font-size:14.5px;font-weight:600}' +
      '.pn em{font-style:normal;font-weight:500;font-size:11.5px;color:#12110d;background:#b9b3a3;border-radius:99px;padding:1px 7px;margin-left:4px;vertical-align:1px}' +
      '.pb{font-size:16px;font-weight:700;color:#fcba01;white-space:nowrap}' +
      '.ph{font-size:12.5px;color:#b9b3a3;margin-top:2px}' +
      '.fuss{font-size:12px;color:#b9b3a3;margin-top:10px;line-height:1.45}' +
      '.cta{display:flex;flex-direction:column;gap:8px;margin-top:16px}' +
      '.cta a{display:block;text-align:center;text-decoration:none;border-radius:12px;padding:12px;font-weight:700;font-size:15px}' +
      '.a1{background:#fcba01;color:#12110d}' +
      '.a2{background:#1f1d17;color:#f4f0e6;border:1px solid #2c2a22}' +
      '.mehr{display:block;text-align:center;margin-top:10px;font-size:13px;color:#b9b3a3}' +
      '@media (max-width:480px){.w{left:12px;bottom:12px}.p{bottom:58px}}' +
      '@media (prefers-reduced-motion:reduce){.knopf:hover{transform:none}}' +
      '</style>' +
      '<div class="w">' +
        '<div class="p" id="p" role="dialog" aria-labelledby="t" hidden>' +
          '<div class="kopf"><div class="vz">' + esc(a.vorzeile || 'Dein Angebot') + '</div>' +
          '<button class="zu" type="button" aria-label="Schließen">×</button></div>' +
          '<h2 id="t" tabindex="-1">' + esc(a.titel || ('Für ' + a.kunde)) + '</h2>' +
          (punkte ? '<h3>Das steckt drin</h3><ul class="lo">' + punkte + '</ul>' : '') +
          (preise ? '<h3>Preise</h3><ul>' + preise + '</ul>' : '') +
          '<p class="fuss">' + esc(a.fussnote || 'Alle Preise zzgl. gesetzlicher Umsatzsteuer, soweit sie anfällt.') + '</p>' +
          '<div class="cta">' +
            '<a class="a1" href="mailto:hello@click-capybara.com?subject=' + betreff + '">Max schreiben</a>' +
            '<a class="a2" href="/' + encodeURIComponent(kunde) + '/kontakt.vcf">Kontakt speichern</a>' +
          '</div>' +
          '<a class="mehr" href="https://click-capybara.com/preise" target="_blank" rel="noopener">Alle Preise auf click-capybara.com<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"> (neuer Tab)</span></a>' +
        '</div>' +
        '<button class="knopf" type="button" aria-expanded="false" aria-controls="p">' +
          '<span class="logo" aria-hidden="true"><img src="/assets/logo.svg" alt=""></span>' +
          '<span>' + esc(a.button || 'Angebot & Preise') + '</span>' +
        '</button>' +
      '</div>';

    var knopf = root.querySelector('.knopf'), panel = root.querySelector('.p');
    function setze(auf) {
      panel.hidden = !auf;
      knopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
      if (auf) root.getElementById('t').focus(); else knopf.focus();
    }
    knopf.addEventListener('click', function () { setze(panel.hidden); });
    root.querySelector('.zu').addEventListener('click', function () { setze(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setze(false); });
  }
})();
