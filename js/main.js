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

/* Number ticker: counts a value up on first paint (tabular digits keep it steady). */
(function () {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  els.forEach(function (el) {
    const target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    const dur = 900;
    const ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    let start;
    function step(now) {
      if (start === undefined) start = now;
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * ease(p)).toLocaleString('es-CO');
      if (p < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 420);
  });
})();

/* 3D tilt: subtle pointer-driven depth on the hero dashboard (fine pointers only). */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const panel = document.querySelector('[data-hero-panel]');
  if (!panel) return;
  const card = panel.firstElementChild;
  if (!card) return;

  const MAX = 2.5;
  panel.style.perspective = '1200px';
  let tx = 0, ty = 0, cx = 0, cy = 0, running = false;

  function loop() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    card.style.transform = 'rotateX(' + cx.toFixed(2) + 'deg) rotateY(' + cy.toFixed(2) + 'deg)';
    if (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02) {
      requestAnimationFrame(loop);
    } else {
      cx = tx; cy = ty;
      card.style.transform = 'rotateX(' + cx.toFixed(2) + 'deg) rotateY(' + cy.toFixed(2) + 'deg)';
      card.style.willChange = '';
      running = false;
    }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

  panel.addEventListener('mousemove', function (e) {
    const r = panel.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tx = -py * MAX;
    ty = px * MAX;
    card.style.willChange = 'transform';
    kick();
  });
  panel.addEventListener('mouseleave', function () {
    tx = 0; ty = 0;
    kick();
  });
})();
