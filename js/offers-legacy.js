// Use the existing offers markup as a template and fill top 5 deals per mode
(function () {
  const list = document.getElementById('offersList');
  const titleEl = document.getElementById('offersTitle');
  if (!list || !titleEl) return;

  // --- Heading: set month (choose ONE of the two lines) ---
  titleEl.textContent = 'November Offers'; // fixed
  // titleEl.textContent = new Date().toLocaleString('en-GB', { month: 'long' }) + ' Offers'; // dynamic

  // find a template card (the first one marked with data-offer-template)
  const tpl = list.querySelector('[data-offer-template]');
  if (!tpl) return;

  let mode = (localStorage.getItem('mode') || 'futures').toLowerCase();
  if (mode === 'fx') mode = 'forex';

  // helpers
  const pct = (p) => {
    if (!p) return 0;
    const m = String(p).match(/(\d+(\.\d+)?)\s*%/);
    return m ? Number(m[1]) : 0;
  };
  const top5 = (arr) =>
    [...arr].sort((a, b) => {
      const p = pct(b.promo) - pct(a.promo);
      if (p) return p;
      const r = (b.rating || 0) - (a.rating || 0);
      if (r) return r;
      return (b.reviews || 0) - (a.reviews || 0);
    }).slice(0, 5);

  function initials(name) {
    const m = name.match(/\b[A-Z]/g);
    if (m && m.length) return m.slice(0, 2).join('');
    return (name?.[0] || '?').toUpperCase();
  }

  function fillCard(el, f) {
    // these selectors are the only requirement you added in HTML
    const name = el.querySelector('.js-offer-name');
    const promo = el.querySelector('.js-offer-promo');
    const rating = el.querySelector('.js-offer-rating');
    const reviews = el.querySelector('.js-offer-reviews');
    const badge = el.querySelector('.js-offer-badge');

    if (name) name.textContent = f.name || '';
    if (promo) promo.textContent = f.promo || (pct(f.promo) ? `${pct(f.promo)}% OFF` : 'Deal');
    if (rating) rating.textContent = (Number(f.rating || 0)).toFixed(1);
    if (reviews) reviews.textContent = (Number(f.reviews || 0)).toLocaleString();
    if (badge) badge.textContent = initials(f.name || '');
  }

  async function loadAndRender(which) {
    const path = which === 'forex' ? '../data/forex_firms.json' : '../data/firms.json';
    const res = await fetch(path);
    const data = await res.json();
    const picks = top5(data);

    // clear everything except the template
    Array.from(list.children).forEach((n) => {
      if (n !== tpl) n.remove();
    });

    // build 5 cards by cloning the exact template (keeps your classes/styles/structure)
    picks.forEach((f, i) => {
      const node = tpl.cloneNode(true);
      node.removeAttribute('data-offer-template'); // clones are real items
      fillCard(node, f);
      list.appendChild(node);
    });

    // keep the template hidden or at the end so it doesn't show
    tpl.style.display = 'none';
  }

  // react to Futures/Forex switch
  window.addEventListener('modechange', (e) => {
    mode = e.detail?.mode || 'futures';
    loadAndRender(mode);
  });

  loadAndRender(mode);
})();
