lucide.createIcons();

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