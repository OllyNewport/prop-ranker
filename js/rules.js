// Render rules for current mode (futures | forex)
(async function(){
  const listMount = document.getElementById('rulesList');
  const tocMount = document.getElementById('rulesToc');
  if (!listMount) return;

  let mode = (localStorage.getItem('mode') || 'futures').toLowerCase();
  if (mode === 'fx') mode = 'forex';
  let rules = [];

  async function loadData(){
    const path = mode === 'forex' ? '../data/rules_forex.json' : '../data/rules_futures.json';
    const res = await fetch(path);
    rules = await res.json();
    render();
  }

  function render(){
    // TOC
    tocMount.innerHTML = `<strong>Jump to:</strong> ` + rules.map(r => `<a href="#${r.id}">${r.name}</a>`).join(' ');

    // Sections
    listMount.innerHTML = rules.map(r => `
      <section id="${r.id}" class="firm-rules card">
        <h2>${r.name}</h2>
        <ul>${r.rules.map(x=>`<li>${x}</li>`).join('')}</ul>
      </section>
    `).join('') + `<p class="disclaimer">This page is an overview. Rules change—verify on the firm's official rulebook before trading.</p>`;
  }

  window.addEventListener('modechange', (e)=>{ mode = e.detail?.mode || 'futures'; loadData(); });

  await loadData();
})();
