// Top Five page: picks top 5 from current mode dataset (futures | forex)
(async function () {
  const table = document.querySelector('.top5-table');
  if (!table) return;

  let mode = (localStorage.getItem('mode') || 'futures').toLowerCase();
  if (mode === 'fx') mode = 'forex';
  let firms = [];

  async function loadData() {
    const path = mode === 'forex' ? '../data/forex_firms.json' : '../data/firms.json';
    const res = await fetch(path);
    firms = await res.json();
    render();
  }

  // rank by rating then reviews
  function topFive(list){
    const c = [...list].sort((a,b)=>{
      const r = (b.rating||0) - (a.rating||0);
      if (r) return r;
      return (b.reviews||0) - (a.reviews||0);
    }).slice(0,5);
    return c;
  }

  const chip = (t,alt=false)=>`<span class="chip${alt?' alt':''}">${t}</span>`;
  const dollars = n=> typeof n==='number' ? '$'+n.toLocaleString() : (n||'');

  function makeDetail(f) {
    // Auto-build details using core fields so it works for both modes
    return `
      <div class="detail-card">
        <div class="detail-col">
          <h4>Rules</h4>
          <p>Evaluation with a profit target and risk controls (e.g., trailing drawdown / daily loss). News/overnight policies vary by instrument and platform.</p>
        </div>
        <div class="detail-col">
          <h4>Reputation</h4>
          <p>Rating ${Number(f.rating||0).toFixed(1)} from ${(f.reviews||0).toLocaleString()} reviews. Operating ${f.years ?? '?'} years in ${f.country || '—'}.</p>
        </div>
        <div class="detail-col">
          <h4>Features</h4>
          <p>Assets: ${(f.assets||[]).join(', ') || '—'}. Platforms: ${(f.platforms||[]).join(', ') || '—'}. Max allocation ${dollars(f.maxAllocation)}. Promo: ${f.promo || '—'}.</p>
        </div>
      </div>`;
  }

  function render(){
    const rows = topFive(firms).map((f,i)=>`
      <div class="row data" data-target="d${i+1}">
        <div class="col idx">${i+1}</div>
        <div class="col firm">${f.name}</div>
        <div class="col country">${f.country||''}</div>
        <div class="col assets">${(f.assets||[]).map(a=>chip(a)).join('')}</div>
        <div class="col platforms">${(f.platforms||[]).map(p=>chip(p,true)).join('')}</div>
        <div class="col alloc">${dollars(f.maxAllocation)}</div>
        <div class="col rating">${Number(f.rating||0).toFixed(1)} ★</div>
        <div class="col action"><button class="btn pill open" aria-expanded="false" aria-controls="d${i+1}">View</button></div>
      </div>
      <div id="d${i+1}" class="row detail">${makeDetail(f)}</div>
    `).join('');

    const header = `
      <div class="row head">
        <div class="col idx">#</div>
        <div class="col firm">Firm</div>
        <div class="col country">Country</div>
        <div class="col assets">Assets</div>
        <div class="col platforms">Platforms</div>
        <div class="col alloc">Max Allocation</div>
        <div class="col rating">Rating</div>
        <div class="col action">Action</div>
      </div>`;

    table.innerHTML = header + rows;

    // Wire expanders
    document.querySelectorAll('.top5-table .row.data').forEach(row=>{
      const id = row.getAttribute('data-target');
      const panel = document.getElementById(id);
      const btn = row.querySelector('.btn.pill.open');
      const toggle = ()=>{
        const isOpen = panel.classList.contains('open');
        document.querySelectorAll('.top5-table .row.detail.open').forEach(el=>{
          el.classList.remove('open');
          const b = el.previousElementSibling?.querySelector('.btn.pill.open');
          b?.setAttribute('aria-expanded','false');
        });
        panel.classList.toggle('open', !isOpen);
        btn?.setAttribute('aria-expanded', String(!isOpen));
        if (!isOpen) panel.scrollIntoView({behavior:'smooth', block:'start'});
      };
      row.addEventListener('click', e=>{
        if ((e.target instanceof HTMLElement) && e.target.closest('button,a')) return;
        toggle();
      });
      btn?.addEventListener('click', e=>{ e.stopPropagation(); toggle(); });
    });
  }

  // react to mode toggle
  window.addEventListener('modechange',(e)=>{ mode = e.detail?.mode || 'futures'; loadData(); });

  await loadData();
})();
