// Compact ticker: top 5 offers by current mode (futures | forex)
(function () {
  const rail = document.getElementById('offersRailInner');
  if (!rail) return;

  const prevBtn = document.getElementById('offerPrev');
  const nextBtn = document.getElementById('offerNext');

  let mode = (localStorage.getItem('mode') || 'futures').toLowerCase();
  if (mode === 'fx') mode = 'forex';
  let data = [];

  const pct = (p)=> {
    if (!p) return 0;
    const m = String(p).match(/(\d+(\.\d+)?)\s*%/);
    return m ? Number(m[1]) : 0;
  };

  async function load() {
    const path = mode === 'forex' ? '../data/forex_firms.json' : '../data/firms.json';
    const res = await fetch(path);
    data = await res.json();
    render();
  }

  function top5(list){
    // promo% desc → rating desc → reviews desc
    return [...list].sort((a,b)=>{
      const p = pct(b.promo) - pct(a.promo); if (p) return p;
      const r = (b.rating||0) - (a.rating||0); if (r) return r;
      return (b.reviews||0) - (a.reviews||0);
    }).slice(0,5);
  }

  function initials(name){
    const m = name.match(/\b[A-Z]/g);
    if (m && m.length) return m.slice(0,2).join('');
    return (name?.[0] || '?').toUpperCase();
  }

  function itemHTML(f){
    const promo = pct(f.promo);
    const revs = (f.reviews||0).toLocaleString();
    return `
      <div class="offer-pill">
        <div class="init">${initials(f.name)}</div>
        <div class="txt">
          <div class="name">${f.name}</div>
          <div class="sub">${Number(f.rating||0).toFixed(1)} ★ • ${revs} reviews</div>
        </div>
        <div class="promo">${promo ? `${promo}%` : `Deal`}</div>
        <button class="use">Use Code</button>
      </div>
    `;
  }

  function render(){
    const list = top5(data);
    rail.innerHTML = list.map(itemHTML).join('');
  }

  // arrows: scroll by ~2 pills
  function scrollByPills(dir=1){
    const pill = rail.querySelector('.offer-pill');
    const w = pill ? pill.getBoundingClientRect().width : 280;
    rail.scrollBy({ left: dir * (w + 8) * 2, behavior:'smooth' });
  }
  prevBtn?.addEventListener('click', ()=>scrollByPills(-1));
  nextBtn?.addEventListener('click', ()=>scrollByPills(1));

  // respond to mode toggle
  window.addEventListener('modechange', (e)=>{ mode = e.detail?.mode || 'futures'; load(); });

  load();
})();
