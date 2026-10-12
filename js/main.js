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

/* Scroll reveal — progressive enhancement.
   Content stays visible if JS is off or reduced motion is requested. */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll('section > div.relative, section > div.mx-auto');
  if (!targets.length) return;

  targets.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', Math.min(i, 6) * 45 + 'ms');
  });

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