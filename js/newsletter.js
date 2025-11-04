// Newsletter submit handler
(function () {
  const form = document.getElementById('newsletterForm');
  const emailEl = document.getElementById('nl-email');
  const hint = document.getElementById('nl-hint');
  if (!form || !emailEl) return;

  // OPTIONAL: set one of these to wire a real backend
  // 1) Formspree endpoint (easiest)
  // window.NEWSLETTER_FORM = { action: "https://formspree.io/f/XXXXYYYY", method: "POST" };

  // 2) Your own endpoint/serverless function (Node/Express or Vercel)
  // window.NEWSLETTER_FORM = { action: "/api/newsletter", method: "POST" };

  function show(msg, ok = true) {
    hint.textContent = msg;
    hint.style.color = ok ? "#b7ffc7" : "#ffb3c1";
  }

  function validEmail(v){
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

    // Visual feedback
    const btn = form.querySelector('button[type="submit"]');
    const prev = btn.textContent;
    btn.disabled = true; btn.textContent = "Subscribing…"; show("");

    try {
      if (window.NEWSLETTER_FORM?.action) {
        // Real submit to Formspree / your backend
        const res = await fetch(window.NEWSLETTER_FORM.action, {
          method: window.NEWSLETTER_FORM.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error("Request failed");
      } else {
        // Demo fallback: pretend success (no network)
        await new Promise(r => setTimeout(r, 600));
      }

      form.reset();
      show("Thanks! Please check your inbox to confirm.", true);
    } catch (err) {
      console.error(err);
      show("Something went wrong. Please try again.", false);
    } finally {
      btn.disabled = false; btn.textContent = prev;
    }
  });
})();
