// Shared header + footer rendering, plus product UI mock components
(function () {
  const NAV = [
    { label: 'Features', href: 'features.html', key: 'features' },
    { label: 'Pricing', href: 'pricing.html', key: 'pricing' },
    { label: 'Blog', href: 'blog.html', key: 'blog' },
    { label: 'About', href: 'about.html', key: 'about' },
    { label: 'Contact', href: 'contact.html', key: 'contact' },
  ];

  function renderHeader(opts = {}) {
    const active = opts.active || '';
    const onDark = opts.onDark ? ' on-dark' : '';
    const solid = opts.solid ? ' solid' : '';
    const mountId = opts.mountId || 'site-header';
    const el = document.getElementById(mountId);
    if (!el) return;
    el.outerHTML = `
      <header class="site-header${onDark}${solid}" id="${mountId}">
        <a class="logo" href="index.html" aria-label="FamilyTable home">
          <img class="logo-mark" src="assets/logo.png" alt="FamilyTable">
        </a>
        <nav class="nav" aria-label="Primary">
          ${NAV.map(n => `<a class="nav-link hide-mobile${active===n.key?' active':''}" href="${n.href}">${n.label}</a>`).join('')}
          <a class="btn btn-primary nav-cta" href="https://app.familytable.me/">Log in</a>
        </nav>
      </header>`;
  }

  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.outerHTML = `
      <footer class="site-footer" id="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a class="logo" href="index.html"><img class="logo-mark" src="assets/logo.png" alt="FamilyTable"></a>
              <p>The shared meal-planning platform for households who'd rather spend dinner at the table than in front of the fridge.</p>
            </div>
            <div class="footer-col">
              <h5>Product</h5>
              <ul>
                <li><a href="features.html">Features</a></li>
                <li><a href="pricing.html">Pricing</a></li>
                <li><a href="features.html#recipes">Recipe library</a></li>
                <li><a href="features.html#planner">Meal planner</a></li>
                <li><a href="features.html#shopping">Shopping list</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h5>Company</h5>
              <ul>
                <li><a href="about.html">About</a></li>
                <li><a href="blog.html">Blog</a></li>
                <li><a href="contact.html">Contact</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press kit</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h5>The weekly menu</h5>
              <p style="color:var(--muted); font-size:14.5px; line-height:1.55; margin:0 0 16px; max-width:300px;">One short note every Sunday: meal plan ideas, shortcuts, and what families are cooking.</p>
              <form class="newsletter-row" onsubmit="return false">
                <input type="email" placeholder="you@yourtable.com" aria-label="Email">
                <button type="submit" aria-label="Subscribe">→</button>
              </form>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© <span data-year></span> FamilyTable. Made for families.</span>
            <span class="legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </span>
          </div>
        </div>
      </footer>`;
  }

  // expose
  window.FT = window.FT || {};
  window.FT.renderHeader = renderHeader;
  window.FT.renderFooter = renderFooter;
})();
