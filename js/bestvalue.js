// Best Value calculator that switches dataset by mode (futures | forex)
(async function () {
  const mount = document.getElementById('bvTable');
  if (!mount) return;

  // Controls
  const ids = ["wRating","wReviews","wPromo","wAlloc","wYears","wPlats"];
  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const wValSpans = {};
  document.querySelectorAll('.w-val').forEach(s => wValSpans[s.dataset.k] = s);
  const btnEqual = document.getElementById('equalize');
  const btnReset = document.getElementById('reset');

  let mode = (localStorage.getItem('mode') || 'futures').toLowerCase();
  if (mode === 'fx') mode = 'forex';
  let firms = [];

  async function loadData() {
    const path = mode === 'forex' ? '../data/forex_firms.json' : '../data/firms.json';
    const res = await fetch(path);
    firms = await res.json();
    base = normalizeMetrics(firms);
    render();
  }

  // Helpers
  const promoPct = (p) => {
    if (!p) return 0;
    const m = String(p).match(/(\d+(\.\d+)?)\s*%/);
    return m ? Number(m[1]) : 0;
  };
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function normalizeMetrics(list) {
    const maxAlloc = Math.max(...list.map(f => f.maxAllocation || 0), 1);
    const maxYears = Math.max(...list.map(f => f.years || 0), 1);
    const maxPlats = Math.max(...list.map(f => (f.platforms?.length || 0)), 1);
    const maxReviews = Math.max(...list.map(f => f.reviews || 0), 1);

    return list.map(f => ({
      ...f,
      _rating: clamp01(((f.rating || 0) - 3.5) / (5 - 3.5)),
      _reviews: clamp01(Math.log10((f.reviews || 0) + 1) / Math.log10(maxReviews + 1)),
      _promo: clamp01(promoPct(f.promo) / 100),
      _alloc: clamp01((f.maxAllocation || 0) / maxAlloc),
      _years: clamp01((f.years || 0) / maxYears),
      _plats: clamp01((f.platforms?.length || 0) / maxPlats)
    }));
  }

  let base = [];

  function weights() {
    const raw = {
      rating: Number(el.wRating.value),
      reviews: Number(el.wReviews.value),
      promo: Number(el.wPromo.value),
      alloc: Number(el.wAlloc.value),
      years: Number(el.wYears.value),
      plats: Number(el.wPlats.value)
    };
    const sum = Object.values(raw).reduce((a,b)=>a+b,0) || 1;
    const w = Object.fromEntries(Object.entries(raw).map(([k,v])=>[k, v/sum]));
    // % labels
    wValSpans.wRating.textContent = Math.round(w.rating*100);
    wValSpans.wReviews.textContent = Math.round(w.reviews*100);
    wValSpans.wPromo.textContent = Math.round(w.promo*100);
    wValSpans.wAlloc.textContent = Math.round(w.alloc*100);
    wValSpans.wYears.textContent = Math.round(w.years*100);
    wValSpans.wPlats.textContent = Math.round(w.plats*100);
    return w;
  }

  function scoreFirm(f, w) {
    const s = (
      w.rating * f._rating +
      w.reviews * f._reviews +
      w.promo * f._promo +
      w.alloc  * f._alloc +
      w.years  * f._years +
      w.plats  * f._plats
    );
    return Math.round(s * 1000) / 10; // 0..100 with 0.1 precision
  }

  function dollars(n){ return typeof n === 'number' ? '$'+n.toLocaleString() : (n||''); }
  const chip = (t,alt=false)=>`<span class="chip${alt?' alt':''}">${t}</span>`;

  function render(){
    const w = weights();
    const list = base.map(f => ({...f, _score: scoreFirm(f, w)}))
                     .sort((a,b)=>b._score - a._score);

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
        <div class="th actions">VALUE</div>
      </div>`;

    const rows = list.map(f => `
      <div class="table-row">
        <div class="td firm"><span class="firm-name">${f.name}</span></div>
        <div class="td rank">
          <span class="score">${Number(f.rating||0).toFixed(1)}</span>
          <span class="reviews">(${(f.reviews||0).toLocaleString()})</span>
        </div>
        <div class="td country"><span class="flag">${f.country||''}</span></div>
        <div class="td years">${f.years ?? ''}</div>
        <div class="td assets">${(f.assets||[]).map(a=>chip(a)).join('')}</div>
        <div class="td platforms">${(f.platforms||[]).map(p=>chip(p,true)).join('')}</div>
        <div class="td allocation">${dollars(f.maxAllocation)}</div>
        <div class="td promo">${f.promo ? `<span class="promo-pill soft">${f.promo}</span>` : ''}</div>
        <div class="td actions"><span class="value-badge">${f._score.toFixed(1)}</span></div>
      </div>`).join('');

    mount.innerHTML = header + rows;
  }

  // controls
  ids.forEach(id => el[id]?.addEventListener('input', render));
  document.getElementById('equalize')?.addEventListener('click', ()=>{
    ids.forEach(id => el[id].value = 100/ids.length);
    render();
  });
  document.getElementById('reset')?.addEventListener('click', ()=>{
    el.wRating.value=25; el.wReviews.value=20; el.wPromo.value=20; el.wAlloc.value=20; el.wYears.value=10; el.wPlats.value=5; render();
  });

  // react to mode changes from header
  window.addEventListener('modechange', (e)=>{
    mode = (e.detail?.mode || 'futures');
    loadData();
  });

  await loadData();
})();
