const mb = document.getElementById('mb');
const mm = document.getElementById('mm');
if (mb) {
  mb.onclick = () => mm.classList.toggle('hidden');
}

const overlay = document.getElementById('scrollOverlay');
if (overlay) {
  const update = () => {
    const p = Math.min(window.scrollY / window.innerHeight, 1);
    overlay.style.opacity = 0.4 + (0.52 * p);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* Material: header lifts into its frosted state once the page scrolls. */
(function () {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const update = () => header.classList.toggle('header-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* Orchestration: hero dashboard tiles stagger in on first paint.
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
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { panel.classList.add('cascade-in'); });
  });
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
