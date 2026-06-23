/* ============================================================
   MyHistamate — landing interactions
   - sticky header, mobile menu, scroll reveal
   - email validation + Netlify Forms submission (AJAX)
   - download modal (email-gate for the PDF guides)
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  /* Send a form to Netlify Forms via AJAX (works once deployed on Netlify).
     We show success optimistically so the UX is identical locally, where
     there is no Netlify backend — the POST simply no-ops on error. */
  function submitToNetlify(form) {
    const data = new URLSearchParams(new FormData(form)).toString();
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data,
    }).catch(() => { /* offline / local preview — ignore */ });
  }

  /* "Citește în continuare" — articole din aceeași categorie, la finalul unui articol.
     Sursa de adevăr e chiar blog.html (sau /en/blog.html): listează deja fiecare
     articol cu data-cat, copertă, titlu și descriere, așa că nu ținem nimic în sync
     aici. Adăugăm un articol nou în blog.html și apare automat și ca „related". */
  function relatedArticles() {
    const path = location.pathname;
    if (!/\/blog\/[^/]+\.html$/.test(path)) return;        // doar pagini de articol
    const wrap = $('.article-wrap'); if (!wrap) return;
    const isEN = path.indexOf('/en/') === 0;
    const listUrl = isEN ? '/en/blog.html' : '/blog.html';
    const strip = (h) => (h || '').replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '');
    fetch(listUrl).then((r) => r.text()).then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const cards = $$('.post-card', doc);
      if (!cards.length) return;
      const current = cards.find((c) => strip(c.getAttribute('href')) === path);
      const cat = current && current.getAttribute('data-cat');
      const others = cards.filter((c) => strip(c.getAttribute('href')) !== path);
      const same = others.filter((c) => c.getAttribute('data-cat') === cat);
      const picks = same.concat(others.filter((c) => !same.includes(c))).slice(0, 3);
      if (!picks.length) return;
      const section = document.createElement('section');
      section.className = 'related-posts';
      const head = document.createElement('div');
      head.className = 'related-head';
      head.innerHTML = '<p class="eyebrow"></p><h2></h2>';
      head.querySelector('.eyebrow').textContent = isEN ? 'More to read' : 'Mai multe';
      head.querySelector('h2').textContent = isEN ? 'Keep reading' : 'Citește în continuare';
      const grid = document.createElement('div');
      grid.className = 'blog-grid';
      picks.forEach((c) => {
        const a = c.cloneNode(true);
        a.classList.remove('reveal'); a.classList.add('in');
        grid.appendChild(a);
      });
      section.appendChild(head);
      section.appendChild(grid);
      const end = $('.article-end', wrap);
      if (end) wrap.insertBefore(section, end); else wrap.appendChild(section);
    }).catch(() => { /* offline / fetch blocat — ignoră */ });
  }

  function init() {
    relatedArticles();

    /* header shadow on scroll */
    const header = $('#header');
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* mobile menu */
    const toggle = $('#navToggle');
    const menu = $('#mobileMenu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });
      $$('#mobileMenu a').forEach((a) => a.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    /* scroll reveal (scroll-position based — robust across environments) */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = $$('.reveal');
    if (reduced) {
      reveals.forEach((el) => el.classList.add('in'));
    } else {
      const checkReveals = () => {
        const trigger = window.innerHeight * 0.92;
        let remaining = false;
        reveals.forEach((el) => {
          if (el.classList.contains('in')) return;
          if (el.getBoundingClientRect().top < trigger) el.classList.add('in');
          else remaining = true;
        });
        return remaining;
      };
      checkReveals();
      const onReveal = () => { if (!checkReveals()) window.removeEventListener('scroll', onReveal); };
      window.addEventListener('scroll', onReveal, { passive: true });
      window.addEventListener('resize', onReveal, { passive: true });
      setTimeout(() => {
        const frozen = reveals.some((el) => el.classList.contains('in') && parseFloat(getComputedStyle(el).opacity) < 0.95);
        if (frozen) document.documentElement.classList.add('reveal-instant');
      }, 1400);
    }

    /* email forms (newsletter + waitlist) */
    function wireForm(formSel, inputSel, successSel) {
      const form = $(formSel); if (!form) return;
      const input = $(inputSel), success = $(successSel), field = input.closest('.field');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isEmail(input.value)) { field.classList.add('invalid'); input.focus(); return; }
        field.classList.remove('invalid');
        submitToNetlify(form);
        field.style.display = 'none';
        const note = form.querySelector('.nl-note'); if (note) note.style.display = 'none';
        success.hidden = false;
      });
      input.addEventListener('input', () => field.classList.remove('invalid'));
    }
    wireForm('#nlForm', '#nlEmail', '#nlSuccess');
    wireForm('#appForm', '#appEmail', '#appSuccess');

    /* download modal */
    const modal = $('#dlModal');
    if (modal) {
    const dlTitle = $('#dlTitle');
    const dlGuide = $('#dlGuide');
    const dlForm = $('#dlForm');
    const dlField = $('#dlForm .field');
    const dlSuccess = $('#dlSuccess');
    const dlInput = $('#dlEmail');
    const dlDownload = $('#dlDownload');
    let currentPdf = '';

    function openModal(btn) {
      const title = btn.dataset.title;
      currentPdf = btn.dataset.pdf || '';
      dlTitle.textContent = title;
      dlGuide.value = title;
      dlField.style.display = '';
      dlField.classList.remove('invalid');
      dlSuccess.hidden = true;
      dlDownload.hidden = true;
      dlInput.value = '';
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      setTimeout(() => dlInput.focus(), 80);
    }
    function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }

    $$('.res-dl').forEach((b) => b.addEventListener('click', () => openModal(b)));
    $('#dlClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

    dlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!isEmail(dlInput.value)) { dlField.classList.add('invalid'); dlInput.focus(); return; }
      submitToNetlify(dlForm);
      dlField.style.display = 'none';
      if (currentPdf) {
        dlSuccess.textContent = 'Gata! Apasă mai jos ca să deschizi ghidul. 📨';
        dlDownload.href = currentPdf;
        dlDownload.setAttribute('download', 'MyHistamate - ' + (dlGuide.value || 'Ghid') + '.pdf');
        dlDownload.hidden = false;
      } else {
        dlSuccess.textContent = 'Gata! Ți-am notat emailul — îți trimit ghidul foarte curând. 💛';
        dlDownload.hidden = true;
      }
      dlSuccess.hidden = false;
    });
    dlInput.addEventListener('input', () => dlField.classList.remove('invalid'));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Cloudflare Web Analytics — privacy-first, cookieless (loads on every page) */
(function () {
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', '{"token": "86d134dd1e9b4bf98fa3b24adc03822d"}');
  document.head.appendChild(s);
})();
