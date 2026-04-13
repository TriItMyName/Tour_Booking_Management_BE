// Inject shared header markup into pages that want to reuse menu header
// Usage: add <div id="sharedHeaderMount"></div> and include this script.

(function () {
  function setActiveNavLink() {
    const header = document.querySelector('header');
    if (!header) return;

    const current = (window.location.pathname.split('/').pop() || '').toLowerCase();
    const navLinks = Array.from(header.querySelectorAll('.navbar > a[href]'));

    for (const a of navLinks) a.classList.remove('active');

    // Match by filename (ignore hash links like #Lienhe)
    const match = navLinks.find((a) => {
      const href = String(a.getAttribute('href') || '');
      if (!href || href.startsWith('#')) return false;
      const file = href.split('/').pop().split('?')[0].toLowerCase();
      return file && file === current;
    });

    if (match) match.classList.add('active');
  }

  async function inject() {
    const mount = document.getElementById('sharedHeaderMount');
    if (!mount) return;

    try {
      const res = await fetch('partials/sharedHeader.html', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      mount.innerHTML = html;

      setActiveNavLink();

      document.dispatchEvent(new CustomEvent('sharedHeader:loaded'));
    } catch (e) {
      // Fail open: page can still render without header
      console.error('Failed to load shared header', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
