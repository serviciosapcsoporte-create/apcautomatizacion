const mb = document.getElementById('mb');
const mm = document.getElementById('mm');
if (mb) {
  mb.onclick = () => mm.classList.toggle('hidden');
}

/* Material: header lifts into its frosted state once the page scrolls. */
(function () {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const update = () => header.classList.toggle('header-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* Orchestration: dashboard showcase tiles stagger in when the panel scrolls
   into view (it now lives in its own section below the hero).
   Progressive enhancement — without JS they are simply visible. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const panel = document.querySelector('[data-hero-panel]');
  if (!panel) return;
  const tiles = panel.querySelectorAll('.grid > *');
  if (!tiles.length) return;
  tiles.forEach(function (el, i) {
    el.classList.add('cascade-item');
    el.style.setProperty('--cascade-delay', 140 + i * 55 + 'ms');
  });
  const start = function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { panel.classList.add('cascade-in'); });
    });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { start(); io.disconnect(); }
      });
    }, { threshold: 0.15 });
    io.observe(panel);
  } else {
    start();
  }
})();

/* Reveal + Stagger: each section reveals its own items as a cascade.
   Content stays visible if JS is off or reduced motion is requested. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const sections = document.querySelectorAll('section:not(#hero) > div.mx-auto');
  if (!sections.length) return;

  const targets = [];
  sections.forEach(function (sec) {
    const group = [];
    sec.querySelectorAll(':scope > *').forEach(function (child) {
      if (child.classList.contains('grid')) {
        Array.prototype.forEach.call(child.children, function (gc) { group.push(gc); });
      } else {
        group.push(child);
      }
    });
    group.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', Math.min(i, 7) * 60 + 'ms');
      targets.push(el);
    });
  });
  if (!targets.length) return;

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();

/* Panel demo: tabs switch between the three dashboard views (Ventas · Inventario · Gerencia). */
(function () {
  const tabs = Array.prototype.slice.call(document.querySelectorAll('.panel-tab'));
  const panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  if (!tabs.length || !panels.length) return;

  const activate = function (name) {
    tabs.forEach(function (tab) {
      const on = tab.getAttribute('data-tab') === name;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.classList.toggle('text-white', on);
      tab.classList.toggle('bg-[#111A2E]', on);
      tab.classList.toggle('text-slate-400', !on);
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-panel') !== name;
    });
  };

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { activate(tab.getAttribute('data-tab')); });
  });

  /* Reserve the height of the tallest view so switching tabs never shifts
     the page (the views differ in height by design, not by accident). */
  const frame = panels[0].parentElement;
  if (frame) {
    let queued = false;
    const reserve = function () {
      queued = false;
      const state = panels.map(function (p) { return p.hidden; });
      panels.forEach(function (p) { p.hidden = false; });
      const chrome = frame.offsetHeight - panels.reduce(function (sum, p) {
        return sum + p.offsetHeight;
      }, 0);
      const tallest = panels.reduce(function (max, p) {
        return Math.max(max, p.offsetHeight);
      }, 0);
      panels.forEach(function (p, i) { p.hidden = state[i]; });
      frame.style.minHeight = chrome + tallest + 'px';
    };
    const schedule = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(reserve);
    };
    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
  }
})();
