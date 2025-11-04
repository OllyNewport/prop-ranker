// Build "November Offers" carousel from current mode (futures | forex)
(function () {
  const track = document.getElementById('offersTrack');
  if (!track) return;

  const prevBtn = document.getElementById('offerPrev');
  const nextBtn = document.getElementById('offerNext');

  let mode = (localStorage.getItem('mode') || 'futures').toLowerCase();
  if (mode === 'fx') mode = 'forex';
  let data = [];

  const promoPct = (p) => {
    if (!p) return 0;
    const m = String(p).match(/(\d+(\.\d+)?)\s*%/);
    return m ? Number(m[1]) : 0;
  };

  async function loadData() {
    const path = mode === 'forex' ? '../data/forex_firms.json' : '../data/firms.json';
    const res = await fetch(path);
    data = await res.json();
    render();
  }

  function pickTopOffers(list) {
    // sort by promo % desc, then rating desc, then reviews desc
    const a = [...list].sort((x, y) => {
      const p = promoPct(y.promo) - promoPct(x.promo);
      if (p !== 0) return p;
      const r = (y.rating || 0) - (x.rating || 0);
      if (r !== 0) return r;
      return (y.reviews || 0) - (x.reviews || 0);
    });
    return a.slice(0, 5);
  }

  const chip = (t) => `<span class="chip">${t}</span>`;
  const dollars = (n) => typeof n === 'number' ? '$' + n.toLocaleString() : (n || '');

  function render() {
    const list = pickTopOffers(data);

    track.innerHTML = list.map(f => {
      const promo = promoPct(f.promo);
      const initials = (f.name.match(/\b[A-Z]/g) || [f.name[0]]).slice(0,2).join('');

      return `
        <article class="offer-card">
          <div class="logo-badge">${initials}</div>
          <div>
            <p class="name">${f.name}</p>
            <p class="sub">${Number(f.rating||0).toFixed(1)} ★ • ${(f.reviews||0).toLocaleString()} reviews</p>
          </div>
          <div class="promo-chip">${promo ? `${promo}% OFF` : `Deal`}</div>

          <div class="meta">
            ${f.assets?.length ? chip(f.assets.join(' • ')) : ''}
            ${f.platforms?.length ? chip(f.platforms.join(' • ')) : ''}
            ${f.maxAllocation ? chip(dollars(f.maxAllocation)) : ''}
            ${f.country ? chip(f.country) : ''}
            <button class="btn use">Use Code</button>
          </div>
        </article>
      `;
    }).join('');
  }

  // arrows scroll by two cards
  function scrollByCards(dir = 1) {
    const card = track.querySelector('.offer-card');
    const w = card ? card.getBoundingClientRect().width : 300;
    track.scrollBy({ left: dir * (w + 12) * 2, behavior: 'smooth' });
  }
  prevBtn?.addEventListener('click', () => scrollByCards(-1));
  nextBtn?.addEventListener('click', () => scrollByCards(1));

  // respond to Futures/Forex toggle
  window.addEventListener('modechange', (e) => {
    mode = e.detail?.mode || 'futures';
    loadData();
  });

  loadData();
})();
