// Inject shared header, wire newsletter modal, theme switch, and persist "mode"
(async function () {
  const mount = document.getElementById('headerMount');
  if (!mount) return;

  // 1) Load header HTML
  const headerHTML = await fetch('../components/header.html').then(r => r.text());
  mount.innerHTML = headerHTML;



  // 3) Active nav highlight
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.main-nav a, nav .main-nav a, nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (!href) return;
    // Basic match; treat root/index as Home
    const isIndex = page === '' || page === 'index' || page === 'index.html';
    const isHomeLink = href.endsWith('index.html') || href === './' || href === '#';
    if ((isIndex && isHomeLink) || href.includes(page)) {
      a.classList.add('active');
    }
  });

  // 4) Theme / MODE switch (Futures vs Forex)
  const html = document.documentElement;
  const switchWrap = document.getElementById('themeSwitch');
  const btns = switchWrap ? Array.from(switchWrap.querySelectorAll('button[data-theme]')) : [];

  // Restore saved mode
  const savedMode = localStorage.getItem('mode') || 'futures';
  applyMode(savedMode, false);

  btns.forEach(b => {
    b.addEventListener('click', () => applyMode(b.dataset.theme, true));
  });

  function applyMode(mode, announce) {
    // UI active states
    btns.forEach(b => b.classList.toggle('active', b.dataset.theme === mode));

    // Theme class + persistence
    if (mode === 'fx' || mode === 'forex') {
      html.classList.add('theme-fx');
      localStorage.setItem('mode', 'forex');
      mode = 'forex';
    } else {
      html.classList.remove('theme-fx');
      localStorage.setItem('mode', 'futures');
      mode = 'futures';
    }

    // Notify listeners (table.js / offers / etc.)
    if (announce) {
      window.dispatchEvent(new CustomEvent('modechange', { detail: { mode } }));
    }
  }

  // 5) Newsletter modal wiring
  const modal = document.getElementById('newsletterModal');
  const openBtn = document.getElementById('openNewsletter');
  const closeBtn = document.getElementById('closeNewsletter');
  const form = document.getElementById('newsletterForm');
  const email = document.getElementById('nlEmail');
  const emailError = document.getElementById('emailError');
  const consent = document.getElementById('nlConsent');
  const consentError = document.getElementById('consentError');
  const success = document.getElementById('nlSuccess');
  const fail = document.getElementById('nlFail');

  function openModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    email?.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') closeModal(); });

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!success || !fail) return;

    success.hidden = true; fail.hidden = true;

    let ok = true;
    if (!validEmail(email?.value.trim() || '')) { if (emailError) emailError.hidden = false; ok = false; } else if (emailError) emailError.hidden = true;
    if (consent && !consent.checked) { if (consentError) consentError.hidden = false; ok = false; } else if (consentError) consentError.hidden = true;
    if (!ok) return;

    const endpoint = window.NEWSLETTER_ENDPOINT || null;
    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: document.getElementById('nlName')?.value || '',
            email: (email?.value || '').trim(),
            consent: !!(consent?.checked),
            source: location.href,
            ts: new Date().toISOString()
          })
        });
        if (!res.ok) throw new Error('Bad response');
      } else {
        console.info('[Newsletter] No endpoint configured. Simulating success.');
        // small delay to mimic network
        await new Promise(r => setTimeout(r, 300));
      }
      success.hidden = false; fail.hidden = true; form.reset();
      setTimeout(closeModal, 1200);
    } catch (err) {
      console.error(err);
      success.hidden = true; fail.hidden = false;
    }
  });
})();
