const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Cabecera y menú ----------
const header = document.getElementById('site-header');
const navToggle = header.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
const desktopQuery = window.matchMedia('(min-width: 900px)');

// Sin JS el menú se ve siempre; solo se pliega en móvil cuando hay JS.
header.classList.add('has-js');
navToggle.hidden = false;

function setMenuOpen(open) {
  navToggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  header.classList.toggle('is-open', open);
}

navToggle.addEventListener('click', () => {
  setMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenuOpen(false);
    navToggle.focus();
  }
});

desktopQuery.addEventListener('change', () => setMenuOpen(false));

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// ---------- Scroll suave de los CTA "Pedir cita" ----------
document.querySelectorAll('[data-scroll]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });

    // Lleva el foco al primer enlace de la sección (el teléfono) sin
    // interrumpir la animación de scroll.
    const firstAction = target.querySelector('a[href^="tel:"], a, button');
    if (firstAction) firstAction.focus({ preventScroll: true });
  });
});

// ---------- Fade-in al hacer scroll ----------
const revealElements = document.querySelectorAll('[data-reveal]');

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      // Cada sección se anima una sola vez.
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => {
    element.classList.add('reveal');
    revealObserver.observe(element);
  });
}
