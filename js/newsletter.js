// Newsletter submit handler for the bottom CTA form
(function () {
  const form = document.querySelector('.nl-form');
  const emailEl = document.getElementById('nl-email');
  const hint = document.getElementById('nl-hint');
  if (!form || !emailEl) return;

  function show(msg, ok = true) {
    if (!hint) return;
    hint.textContent = msg;
    hint.style.color = ok ? "#b7ffc7" : "#ffb3c1";
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailEl.value.trim();

    if (!validEmail(email)) {
      show("Please enter a valid email address.", false);
      emailEl.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const prev = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Subscribing…"; }
    show("");

    try {
      const endpoint =
        (window.NEWSLETTER_FORM && window.NEWSLETTER_FORM.action) ||
        window.NEWSLETTER_ENDPOINT ||
        null;

      if (endpoint) {
        const method =
          (window.NEWSLETTER_FORM && window.NEWSLETTER_FORM.method) || "POST";

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: location.href,
            ts: new Date().toISOString()
          })
        });

        if (!res.ok) throw new Error("Request failed");
      } else {
        // Fallback demo mode: pretend success
        await new Promise(r => setTimeout(r, 600));
      }

      form.reset();
      show("Thanks! Please check your inbox to confirm.", true);
    } catch (err) {
      console.error(err);
      show("Something went wrong. Please try again.", false);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
    }
  });
})();
