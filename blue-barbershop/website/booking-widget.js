/*!
 * Booking Widget — drop-in Calendly-style booking for static sites.
 * Backend: Google Apps Script (see Code.gs).
 *
 * Usage:
 *   <div id="booking"></div>
 *   <script src="booking-widget.js"></script>
 *   <script>
 *     BookingWidget.init({
 *       el: '#booking',
 *       endpoint: 'https://script.google.com/macros/s/XXXX/exec', // or 'mock'
 *       lang: 'de',            // 'de' | 'en'
 *       accent: '#fcba01',     // brand color
 *       staff: [{ id: 'ahmed', name: 'Ahmed', photo: 'url' }]  // optional — adds a barber/staff step, photo optional (falls back to initial)
 *     });
 *   </script>
 */
(function (global) {
  'use strict';

  /* ───────── i18n ───────── */
  var I18N = {
    de: {
      chooseService: 'Was möchtest du buchen?',
      chooseStaff: 'Wer soll dich übernehmen?',
      noPreference: 'Keine Präferenz',
      chooseTime: 'Wähle Datum & Uhrzeit',
      yourDetails: 'Deine Kontaktdaten',
      minutes: 'Min.',
      loading: 'Lade Termine…',
      noSlots: 'An diesem Tag sind keine Termine frei.',
      pickDay: 'Bitte wähle einen Tag aus.',
      name: 'Name',
      email: 'E-Mail',
      phone: 'Telefon (optional)',
      note: 'Anmerkung (optional)',
      back: 'Zurück',
      book: 'Verbindlich buchen',
      booking: 'Wird gebucht…',
      done: 'Termin bestätigt!',
      doneText: 'Du erhältst gleich eine Bestätigung per E-Mail – inklusive Kalendereintrag für Apple, Google & Co.',
      again: 'Weiteren Termin buchen',
      errGeneric: 'Das hat leider nicht geklappt. Bitte versuche es erneut.',
      errTaken: 'Dieser Termin wurde gerade vergeben – bitte wähle einen anderen.',
      required: 'Bitte Name und eine gültige E-Mail angeben.',
      weekdays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
               'August', 'September', 'Oktober', 'November', 'Dezember'],
      at: 'um', oclock: 'Uhr'
    },
    en: {
      chooseService: 'What would you like to book?',
      chooseStaff: 'Who should take care of you?',
      noPreference: 'No preference',
      chooseTime: 'Pick a date & time',
      yourDetails: 'Your details',
      minutes: 'min',
      loading: 'Loading times…',
      noSlots: 'No free times on this day.',
      pickDay: 'Please pick a day.',
      name: 'Name',
      email: 'Email',
      phone: 'Phone (optional)',
      note: 'Note (optional)',
      back: 'Back',
      book: 'Confirm booking',
      booking: 'Booking…',
      done: 'Booking confirmed!',
      doneText: 'A confirmation email is on its way — including a calendar file for Apple, Google & more.',
      again: 'Book another appointment',
      errGeneric: 'Something went wrong. Please try again.',
      errTaken: 'That time was just taken — please pick another slot.',
      required: 'Please enter your name and a valid email.',
      weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
               'August', 'September', 'October', 'November', 'December'],
      at: 'at', oclock: ''
    }
  };

  /* ───────── styles (injected once) ───────── */
  var CSS = '' +
  '.cbw{--cbw-accent:#fcba01;--cbw-ink:#1d1d1f;--cbw-mut:#6e6e73;--cbw-line:#e5e5e8;' +
    '--cbw-bg:#fff;--cbw-soft:#f6f6f7;--cbw-radius:14px;' +
    'font-family:inherit;color:var(--cbw-ink);background:var(--cbw-bg);' +
    'border:1px solid var(--cbw-line);border-radius:var(--cbw-radius);' +
    'max-width:460px;padding:22px;box-sizing:border-box}' +
  '.cbw *,.cbw *:before,.cbw *:after{box-sizing:inherit}' +
  '.cbw-steps{display:flex;gap:6px;margin-bottom:18px}' +
  '.cbw-steps i{flex:1;height:3px;border-radius:2px;background:var(--cbw-line);transition:background .25s}' +
  '.cbw-steps i.on{background:var(--cbw-accent)}' +
  '.cbw h3{margin:0 0 14px;font-size:17px;font-weight:650;line-height:1.3}' +
  '.cbw-svc{display:flex;flex-direction:column;gap:8px}' +
  '.cbw-svc button{display:flex;justify-content:space-between;align-items:center;gap:10px;' +
    'padding:13px 15px;border:1.5px solid var(--cbw-line);border-radius:11px;background:var(--cbw-bg);' +
    'font:inherit;font-size:15px;cursor:pointer;text-align:left;color:var(--cbw-ink);transition:border-color .15s,background .15s}' +
  '.cbw-svc button:hover{border-color:var(--cbw-accent);background:var(--cbw-soft)}' +
  '.cbw-svc small{color:var(--cbw-mut);white-space:nowrap}' +
  '.cbw-svc-inner{display:flex;align-items:center;gap:11px;min-width:0}' +
  '.cbw-avatar{width:32px;height:32px;border-radius:50%;background:var(--cbw-accent);color:#fff;' +
    'font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;' +
    'flex-shrink:0;overflow:hidden}' +
  '.cbw-avatar.muted{background:var(--cbw-soft);color:var(--cbw-mut)}' +
  '.cbw-avatar img{width:100%;height:100%;object-fit:cover;display:block}' +
  '.cbw-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}' +
  '.cbw-cal-head b{font-size:14.5px}' +
  '.cbw-nav{border:none;background:var(--cbw-soft);border-radius:8px;width:30px;height:30px;' +
    'cursor:pointer;font-size:15px;color:var(--cbw-ink)}' +
  '.cbw-nav:disabled{opacity:.35;cursor:default}' +
  '.cbw-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:14px}' +
  '.cbw-grid span{font-size:11px;color:var(--cbw-mut);text-align:center;padding:4px 0}' +
  '.cbw-grid button{border:none;background:none;font:inherit;font-size:13.5px;padding:0;' +
    'aspect-ratio:1;border-radius:50%;cursor:pointer;color:var(--cbw-ink)}' +
  '.cbw-grid button:hover:not(:disabled){background:var(--cbw-soft)}' +
  '.cbw-grid button:disabled{color:var(--cbw-line);cursor:default}' +
  '.cbw-grid button.sel{background:var(--cbw-accent);font-weight:650}' +
  '.cbw-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:7px;' +
    'max-height:180px;overflow-y:auto;padding:2px}' +
  '.cbw-slots button{padding:9px 0;border:1.5px solid var(--cbw-line);border-radius:9px;' +
    'background:var(--cbw-bg);font:inherit;font-size:13.5px;cursor:pointer;color:var(--cbw-ink);transition:all .12s}' +
  '.cbw-slots button:hover{border-color:var(--cbw-accent)}' +
  '.cbw-slots button.sel{background:var(--cbw-accent);border-color:var(--cbw-accent);font-weight:650}' +
  '.cbw-hint{color:var(--cbw-mut);font-size:13.5px;padding:10px 2px}' +
  '.cbw-sum{background:var(--cbw-soft);border-radius:10px;padding:10px 13px;font-size:13.5px;margin-bottom:14px}' +
  '.cbw label{display:block;font-size:12.5px;color:var(--cbw-mut);margin:10px 0 4px}' +
  '.cbw input,.cbw textarea{width:100%;padding:10px 12px;border:1.5px solid var(--cbw-line);' +
    'border-radius:9px;font:inherit;font-size:14.5px;background:var(--cbw-bg);color:var(--cbw-ink)}' +
  '.cbw input:focus,.cbw textarea:focus{outline:none;border-color:var(--cbw-accent)}' +
  '.cbw-row{display:flex;gap:10px;margin-top:18px}' +
  '.cbw-btn{flex:1;padding:12px;border-radius:10px;font:inherit;font-size:15px;font-weight:600;' +
    'cursor:pointer;border:1.5px solid var(--cbw-line);background:var(--cbw-bg);color:var(--cbw-ink)}' +
  '.cbw-btn.pri{background:var(--cbw-accent);border-color:var(--cbw-accent)}' +
  '.cbw-btn:disabled{opacity:.55;cursor:default}' +
  '.cbw-err{color:#c0392b;font-size:13px;margin-top:10px}' +
  '.cbw-done{text-align:center;padding:14px 4px}' +
  '.cbw-done .ico{width:54px;height:54px;border-radius:50%;background:var(--cbw-accent);' +
    'display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:26px}' +
  '.cbw-done p{color:var(--cbw-mut);font-size:14px;line-height:1.5}' +
  '@media(prefers-reduced-motion:no-preference){.cbw-view{animation:cbwIn .18s ease}}' +
  '@keyframes cbwIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}';

  function injectCss() {
    if (document.getElementById('cbw-css')) return;
    var s = document.createElement('style');
    s.id = 'cbw-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ───────── helpers ───────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function avatarEl(person, muted) {
    var a = el('div', muted ? 'cbw-avatar muted' : 'cbw-avatar');
    if (person.photo) {
      var img = document.createElement('img');
      img.src = person.photo; img.alt = '';
      a.appendChild(img);
    } else {
      a.textContent = muted ? '–' : (person.name || '?').trim().charAt(0).toUpperCase();
    }
    return a;
  }
  function iso(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function niceDate(isoStr, lang) {
    var p = isoStr.split('-');
    return lang === 'de' ? p[2] + '.' + p[1] + '.' + p[0] : isoStr;
  }

  /* ───────── mock backend for demos ───────── */
  // Single source of truth for opening hours: 0=So … 6=Sa, [open, close] as whole hours, or null if closed.
  var WEEKLY_HOURS = { 0: null, 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [8, 17] };

  function mockApi(action, params) {
    return new Promise(function (res) {
      setTimeout(function () {
        if (action === 'config') {
          var hours = {};
          Object.keys(WEEKLY_HOURS).forEach(function (d) {
            var r = WEEKLY_HOURS[d];
            hours[d] = r ? [String(r[0]).padStart(2, '0') + ':00-' + String(r[1]).padStart(2, '0') + ':00'] : [];
          });
          res({
            businessName: 'Blue Barbershop',
            services: [
              { id: 'trocken',  name: 'Trockenhaarschnitt · 18 €',            duration: 30 },
              { id: 'bart-cut', name: 'Haare inkl. Bart · 31 €',               duration: 60 },
              { id: 'wsf',      name: 'Waschen, Schneiden & Föhnen · 21 €',    duration: 30 },
              { id: 'maschine', name: 'Komplett mit der Maschine · 15 €',      duration: 30 },
              { id: 'kontur',   name: 'Bartkontur mit dem Messer · 13 €',      duration: 30 }
            ],
            hours: hours,
            maxAdvanceDays: 60, minNoticeHours: 6
          });
        } else if (action === 'slots') {
          var day = new Date(params.date + 'T12:00:00').getDay();
          var range = WEEKLY_HOURS[day];
          if (!range) return res({ slots: [] }); // geschlossen
          var all = [];
          // last full-hour slot starts one hour before closing, so a 1h service still fits
          for (var h = range[0]; h < range[1]; h++) all.push(String(h).padStart(2, '0') + ':00');
          // pseudo-random availability per date, purely for demo realism
          var seed = params.date.split('-').join('') % 7;
          res({ slots: all.filter(function (_, i) { return (i + seed) % 3 !== 0; }) });
        } else {
          res({ ok: true });
        }
      }, 350);
    });
  }

  /* ───────── widget ───────── */
  function init(cfg) {
    injectCss();
    var root = typeof cfg.el === 'string' ? document.querySelector(cfg.el) : cfg.el;
    if (!root) { console.error('[BookingWidget] element not found:', cfg.el); return; }

    var lang = cfg.lang === 'en' ? 'en' : 'de';
    var t = I18N[lang];
    var mock = cfg.endpoint === 'mock';
    var hasStaff = !!(cfg.staff && cfg.staff.length);
    var totalSteps = hasStaff ? 4 : 3;

    var box = el('div', 'cbw');
    if (cfg.accent) box.style.setProperty('--cbw-accent', cfg.accent);
    root.appendChild(box);

    var state = {
      remote: null, service: null, staff: null, date: null, time: null,
      monthCursor: startOfMonth(new Date()), slots: null, loadingSlots: false,
      pendingService: null
    };

    function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }

    function api(action, params, body) {
      if (mock) return mockApi(action, params || {});
      if (body) {
        return fetch(cfg.endpoint, {
          method: 'POST', body: JSON.stringify(body),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow'
        }).then(function (r) { return r.json(); });
      }
      var q = Object.keys(params || {}).map(function (k) {
        return k + '=' + encodeURIComponent(params[k]);
      }).join('&');
      return fetch(cfg.endpoint + '?action=' + action + (q ? '&' + q : ''), { redirect: 'follow' })
        .then(function (r) { return r.json(); });
    }

    /* steps indicator */
    function steps(n) {
      var w = el('div', 'cbw-steps');
      for (var i = 1; i <= totalSteps; i++) w.appendChild(el('i', i <= n ? 'on' : ''));
      return w;
    }
    function view() {
      box.innerHTML = '';
      var v = el('div', 'cbw-view');
      box.appendChild(v);
      return v;
    }

    /* jump straight to the calendar with a given service pre-selected —
       used when someone clicks a massage in the price list above */
    function selectServiceById(id) {
      if (!state.remote) { state.pendingService = id; return; } // config not loaded yet
      var matches = state.remote.services.filter(function (s) { return s.id === id; });
      if (!matches.length) { renderServices(); return; } // no match → just show the normal list
      state.service = matches[0]; state.staff = null; state.date = null; state.time = null; state.slots = null;
      hasStaff ? renderStaff() : renderCalendar();
    }

    /* step 1: services */
    function renderServices() {
      var v = view();
      v.appendChild(steps(1));
      v.appendChild(el('h3', null, t.chooseService));
      var list = el('div', 'cbw-svc');
      state.remote.services.forEach(function (s) {
        var b = el('button');
        b.appendChild(el('span', null, s.name));
        b.appendChild(el('small', null, s.duration + ' ' + t.minutes));
        b.onclick = function () {
          state.service = s; state.staff = null; state.date = null; state.time = null; state.slots = null;
          hasStaff ? renderStaff() : renderCalendar();
        };
        list.appendChild(b);
      });
      v.appendChild(list);
    }

    /* step 2 (only when cfg.staff given): pick a barber, or no preference */
    function renderStaff() {
      var v = view();
      v.appendChild(steps(2));
      v.appendChild(el('h3', null, t.chooseStaff));
      var sum = summaryBar();
      if (sum) v.appendChild(sum);
      var list = el('div', 'cbw-svc');
      var none = el('button');
      var noneInner = el('div', 'cbw-svc-inner');
      noneInner.appendChild(avatarEl({ name: t.noPreference }, true));
      noneInner.appendChild(el('span', null, t.noPreference));
      none.appendChild(noneInner);
      none.onclick = function () { state.staff = null; renderCalendar(); };
      list.appendChild(none);
      cfg.staff.forEach(function (s) {
        var b = el('button');
        var inner = el('div', 'cbw-svc-inner');
        inner.appendChild(avatarEl(s));
        inner.appendChild(el('span', null, s.name));
        b.appendChild(inner);
        b.onclick = function () { state.staff = s; renderCalendar(); };
        list.appendChild(b);
      });
      v.appendChild(list);
      var row = el('div', 'cbw-row');
      var back = el('button', 'cbw-btn', t.back);
      back.onclick = renderServices;
      row.appendChild(back);
      v.appendChild(row);
    }

    /* persistent summary — grows as service/staff/date/time get picked, shown from step 2 onward */
    function summaryBar() {
      if (!state.service) return null;
      var parts = [state.service.name];
      if (state.staff) parts.push(state.staff.name);
      if (state.date) parts.push(niceDate(state.date, lang));
      if (state.time) parts.push(state.time + (lang === 'de' ? ' ' + t.oclock : ''));
      return el('div', 'cbw-sum', parts.join(' · '));
    }

    /* step 2: calendar + slots */
    function isDayOpen(d) {
      var hours = state.remote.hours || {};
      var wd = d.getDay();
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var max = new Date(today.getTime() + (state.remote.maxAdvanceDays || 60) * 864e5);
      return d >= today && d <= max && (hours[wd] || []).length > 0;
    }

    function renderCalendar() {
      var v = view();
      v.appendChild(steps(hasStaff ? 3 : 2));
      v.appendChild(el('h3', null, t.chooseTime));
      var sum = summaryBar();
      if (sum) v.appendChild(sum);

      var head = el('div', 'cbw-cal-head');
      var prev = el('button', 'cbw-nav', '‹');
      var next = el('button', 'cbw-nav', '›');
      var m = state.monthCursor;
      head.appendChild(prev);
      head.appendChild(el('b', null, t.months[m.getMonth()] + ' ' + m.getFullYear()));
      head.appendChild(next);
      v.appendChild(head);

      var thisMonth = startOfMonth(new Date());
      prev.disabled = m <= thisMonth;
      prev.onclick = function () { state.monthCursor = new Date(m.getFullYear(), m.getMonth() - 1, 1); renderCalendar(); };
      next.onclick = function () { state.monthCursor = new Date(m.getFullYear(), m.getMonth() + 1, 1); renderCalendar(); };

      var grid = el('div', 'cbw-grid');
      t.weekdays.forEach(function (w) { grid.appendChild(el('span', null, w)); });
      var firstDow = (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 6) % 7; // Mon-first
      for (var i = 0; i < firstDow; i++) grid.appendChild(el('span'));
      var days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= days; d++) {
        (function (d) {
          var date = new Date(m.getFullYear(), m.getMonth(), d);
          var b = el('button', null, String(d));
          b.disabled = !isDayOpen(date);
          if (state.date === iso(date)) b.classList.add('sel');
          b.onclick = function () { state.date = iso(date); state.time = null; loadSlots(); renderCalendar(); };
          grid.appendChild(b);
        })(d);
      }
      v.appendChild(grid);

      var area = el('div');
      if (!state.date) {
        area.appendChild(el('div', 'cbw-hint', t.pickDay));
      } else if (state.loadingSlots) {
        area.appendChild(el('div', 'cbw-hint', t.loading));
      } else if (state.slots && !state.slots.length) {
        area.appendChild(el('div', 'cbw-hint', t.noSlots));
      } else if (state.slots) {
        var slots = el('div', 'cbw-slots');
        state.slots.forEach(function (s) {
          var b = el('button', state.time === s ? 'sel' : '', s);
          b.onclick = function () { state.time = s; renderForm(); };
          slots.appendChild(b);
        });
        area.appendChild(slots);
      }
      v.appendChild(area);

      var row = el('div', 'cbw-row');
      var back = el('button', 'cbw-btn', t.back);
      back.onclick = hasStaff ? renderStaff : renderServices;
      row.appendChild(back);
      v.appendChild(row);
    }

    function loadSlots() {
      state.loadingSlots = true; state.slots = null;
      var forDate = state.date;
      api('slots', { date: forDate, service: state.service.id }).then(function (r) {
        if (state.date !== forDate) return; // stale
        state.loadingSlots = false;
        state.slots = r.slots || [];
        renderCalendar();
      }).catch(function () {
        state.loadingSlots = false; state.slots = [];
        renderCalendar();
      });
    }

    /* step 3: details form */
    function renderForm() {
      var v = view();
      v.appendChild(steps(hasStaff ? 4 : 3));
      v.appendChild(el('h3', null, t.yourDetails));
      var sum = summaryBar();
      if (sum) v.appendChild(sum);

      function field(labelText, tag, type, name) {
        v.appendChild(el('label', null, labelText));
        var i = el(tag);
        if (type) i.type = type;
        i.name = name;
        v.appendChild(i);
        return i;
      }
      var fName = field(t.name, 'input', 'text', 'name');
      var fMail = field(t.email, 'input', 'email', 'email');
      var fPhone = field(t.phone, 'input', 'tel', 'phone');
      var fNote = field(t.note, 'textarea', null, 'note');
      fNote.rows = 2;

      var err = el('div', 'cbw-err');
      v.appendChild(err);

      var row = el('div', 'cbw-row');
      var back = el('button', 'cbw-btn', t.back);
      back.onclick = renderCalendar;
      var submit = el('button', 'cbw-btn pri', t.book);
      row.appendChild(back);
      row.appendChild(submit);
      v.appendChild(row);

      submit.onclick = function () {
        err.textContent = '';
        var name = fName.value.trim(), email = fMail.value.trim();
        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          err.textContent = t.required; return;
        }
        submit.disabled = back.disabled = true;
        submit.textContent = t.booking;
        api(null, null, {
          service: state.service.id, staff: state.staff ? state.staff.id : null,
          date: state.date, time: state.time,
          name: name, email: email,
          phone: fPhone.value.trim(), note: fNote.value.trim(), lang: lang
        }).then(function (r) {
          if (r && r.ok) return renderDone();
          submit.disabled = back.disabled = false;
          submit.textContent = t.book;
          err.textContent = r && r.error === 'slot_taken' ? t.errTaken : t.errGeneric;
          if (r && r.error === 'slot_taken') { state.time = null; loadSlots(); }
        }).catch(function () {
          submit.disabled = back.disabled = false;
          submit.textContent = t.book;
          err.textContent = t.errGeneric;
        });
      };
    }

    /* done */
    function renderDone() {
      var v = view();
      var d = el('div', 'cbw-done');
      d.appendChild(el('div', 'ico', '✓'));
      d.appendChild(el('h3', null, t.done));
      d.appendChild(el('p', null, t.doneText));
      var again = el('button', 'cbw-btn', t.again);
      again.style.marginTop = '16px';
      again.onclick = function () {
        state.service = state.staff = state.date = state.time = state.slots = null;
        renderServices();
      };
      d.appendChild(again);
      v.appendChild(d);
    }

    /* boot */
    box.appendChild(el('div', 'cbw-hint', t.loading));
    api('config', {}).then(function (r) {
      state.remote = r;
      if (state.pendingService) {
        var id = state.pendingService; state.pendingService = null;
        selectServiceById(id);
      } else {
        renderServices();
      }
    }).catch(function () {
      box.innerHTML = '';
      box.appendChild(el('div', 'cbw-err', t.errGeneric));
    });

    return { selectService: selectServiceById };
  }

  global.BookingWidget = { init: init };
})(window);
