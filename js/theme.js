(function () {
  const THEME_KEY = 'fpr-theme';
  const root = document.documentElement;
  const switcher = document.getElementById('themeSwitch');

  // Apply saved theme
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'fx') {
    root.classList.add('theme-fx');
    setActive('fx');
  } else {
    root.classList.remove('theme-fx');
    setActive('futures');
  }

  // Switcher wiring
  if (switcher) {
    switcher.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-theme]');
      if (!btn) return;
      const mode = btn.dataset.theme;
      if (mode === 'fx') root.classList.add('theme-fx');
      else root.classList.remove('theme-fx');
      localStorage.setItem(THEME_KEY, mode);
      setActive(mode);
    });
  }

  function setActive(mode){
    if (!switcher) return;
    switcher.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    const btn = switcher.querySelector(`button[data-theme="${mode}"]`);
    if (btn) btn.classList.add('active');
  }
})();
