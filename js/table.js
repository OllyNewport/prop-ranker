// public/js/table.js
(function () {
  const mount = document.querySelector('#firmTable');
  if (!mount) return;

  const searchInput = document.getElementById('firmSearch');
  const btnPopular = document.getElementById('btnPopular');
  const btnAll = document.getElementById('btnAll');

  let mode = (localStorage.getItem('mode') || 'futures').toLowerCase(); // 'futures' | 'forex'
  if (mode === 'fx') mode = 'forex';

  let original = []; // current dataset in original order
  let currentView = 'popular';
  let query = '';

  // ---- data loading
  async function loadData(whichMode) {
    const path = whichMode === 'forex' ? '../data/forex_firms.json' : '../data/firms.json';
    const res = await fetch(path);
    original = (await res.json()).map((f, i) => ({ ...f, _idx: i }));
    render();
  }

  // ---- helpers
  function sortPopular(arr) {
    const a = [...arr];
    a.sort((x, y) => {
      const r = (y.rating || 0) - (x.rating || 0);
      if (r !== 0) return r;
      const rev = (y.reviews || 0) - (x.reviews || 0);
      if (rev !== 0) return rev;
      return String(x.name).localeCompare(String(y.name));
    });
    return a;
  }

  const header = `
    <div class="table-header">
      <div class="th firm">FIRM</div>
      <div class="th rank">RANK / REVIEWS</div>
      <div class="th country">COUNTRY</div>
      <div class="th years">YEARS IN OPERATION</div>
      <div class="th assets">ASSETS</div>
      <div class="th platforms">PLATFORMS</div>
      <div class="th allocation">MAX ALLOCATIONS</div>
      <div class="th promo">PROMO</div>
      <div class="th actions">ACTIONS</div>
    </div>`;

  const chip = (t, alt = false) => `<span class="chip${alt ? ' alt' : ''}">${t}</span>`;
  const dollars = n => (typeof n === 'number' ? '$' + n.toLocaleString() : (n || ''));

  function filterByQuery(list) {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(f =>
      [
        f.name, f.country,
        ...(f.assets || []), ...(f.platforms || [])
      ].join(' ').toLowerCase().includes(q)
    );
  }

  function makeRows(list) {
    return list.map(f => `
      <div class="table-row">
        <div class="td firm"><span class="firm-name">${f.name}</span></div>
        <div class="td rank">
          <span class="score">${Number(f.rating || 0).toFixed(1)}</span>
          <span class="reviews">(${Number(f.reviews || 0).toLocaleString()})</span>
        </div>
        <div class="td country"><span class="flag">${f.country || ''}</span></div>
        <div class="td years">${f.years ?? ''}</div>
        <div class="td assets">${(f.assets || []).map(a => chip(a)).join('')}</div>
        <div class="td platforms">${(f.platforms || []).map(p => chip(p, true)).join('')}</div>
        <div class="td allocation">${dollars(f.maxAllocation)}</div>
        <div class="td promo">${f.promo ? `<span class="promo-pill soft">${f.promo}</span>` : ''}</div>
        <div class="td actions"><a class="btn firm-btn" href="#!" rel="sponsored noopener">Firm</a></div>
      </div>
    `).join('');
  }

  function render() {
    let list = currentView === 'popular' ? sortPopular(original) : [...original].sort((a,b)=>a._idx - b._idx);
    list = filterByQuery(list);
    mount.innerHTML = header + makeRows(list);
    if (searchInput) searchInput.value = query;
    // ensure pills reflect current view
    btnPopular?.classList.toggle('pill-on', currentView === 'popular');
    btnAll?.classList.toggle('pill-on', currentView === 'all');
  }

  // ---- wire up controls
  btnPopular?.addEventListener('click', () => { currentView = 'popular'; render(); });
  btnAll?.addEventListener('click', () => { currentView = 'all'; render(); });

  searchInput?.addEventListener('input', () => {
    query = searchInput.value || '';
    render();
  });

  // ---- listen for mode change from header
  window.addEventListener('modechange', (e) => {
    mode = e.detail?.mode || 'futures';
    loadData(mode);
  });

  // initial
  loadData(mode);
})();
