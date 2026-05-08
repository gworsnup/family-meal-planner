// Shared site behavior: header scroll state, year stamp, etc.
(function () {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    const header = document.querySelector('.site-header');
    if (header && !header.classList.contains('solid')) {
      const onScroll = () => {
        if (window.scrollY > 30) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });

    // newsletter no-op
    document.querySelectorAll('.newsletter-row').forEach(row => {
      const btn = row.querySelector('button');
      const input = row.querySelector('input');
      if (!btn || !input) return;
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (!input.value) { input.focus(); return; }
        input.value = '';
        input.placeholder = 'Thanks — we\'ll be in touch';
      });
    });
  });
})();
