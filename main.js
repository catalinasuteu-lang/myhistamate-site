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
    if (!/\/blog\/[^/]+$/.test(path)) return;              // doar pagini de articol (cu sau fără .html)
    const wrap = $('.article-wrap'); if (!wrap) return;
    const isEN = path.indexOf('/en/') === 0;
    const listUrl = isEN ? '/en/blog.html' : '/blog.html';
    /* normalizează adresa (scoate host, query/hash, .html și / final) ca potrivirea
       să meargă și pe Netlify, unde linkurile sunt „pretty" (fără .html) */
    const norm = (h) => (h || '').replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '').replace(/\.html$/, '').replace(/\/$/, '');
    const here = norm(path);
    fetch(listUrl).then((r) => r.text()).then((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const cards = $$('.post-card', doc);
      if (!cards.length) return;
      const current = cards.find((c) => norm(c.getAttribute('href')) === here);
      const cat = current && current.getAttribute('data-cat');
      const others = cards.filter((c) => norm(c.getAttribute('href')) !== here);
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

  /* Share + feedback la finalul articolului (injectate, ca și „related").
     Feedback-ul se salvează în Netlify Forms (formular static „article-feedback"
     declarat în blog.html ca Netlify să-l înregistreze). */
  function articleEngagement() {
    const path = location.pathname;
    if (!/\/blog\/[^/]+$/.test(path)) return;
    const wrap = $('.article-wrap'); if (!wrap) return;
    if ($('.article-engage', wrap)) return;
    const isEN = path.indexOf('/en/') === 0;
    const url = location.href.split('#')[0];
    const t = {
      q: isEN ? 'Was this article helpful?' : 'Ți-a fost util articolul?',
      yes: isEN ? 'Yes' : 'Da', no: isEN ? 'No' : 'Nu',
      thanks: isEN ? 'Thanks for your feedback! 💛' : 'Mulțumesc pentru feedback! 💛',
      share: isEN ? 'Share:' : 'Distribuie:',
      copy: isEN ? 'Copy link' : 'Copiază linkul',
      copied: isEN ? 'Link copied!' : 'Link copiat!',
    };

    const sec = document.createElement('div');
    sec.className = 'article-engage';

    const fb = document.createElement('div');
    fb.className = 'article-feedback';
    const q = document.createElement('span'); q.className = 'fb-q'; q.textContent = t.q;
    const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'fb-btn'; yes.textContent = '👍 ' + t.yes;
    const no = document.createElement('button'); no.type = 'button'; no.className = 'fb-btn'; no.textContent = '👎 ' + t.no;
    fb.appendChild(q); fb.appendChild(yes); fb.appendChild(no);

    function vote(val) {
      const body = new URLSearchParams({ 'form-name': 'article-feedback', article: path, useful: val }).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }).catch(() => {});
      const thanks = document.createElement('span'); thanks.className = 'fb-thanks'; thanks.textContent = t.thanks;
      fb.replaceChildren(thanks);
    }
    yes.addEventListener('click', () => vote('da'));
    no.addEventListener('click', () => vote('nu'));

    const sh = document.createElement('div');
    sh.className = 'article-share';
    const lbl = document.createElement('span'); lbl.className = 'sh-label'; lbl.textContent = t.share;
    const wa = document.createElement('a'); wa.className = 'sh-btn'; wa.target = '_blank'; wa.rel = 'noopener';
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(document.title + ' ' + url); wa.textContent = 'WhatsApp';
    const fbk = document.createElement('a'); fbk.className = 'sh-btn'; fbk.target = '_blank'; fbk.rel = 'noopener';
    fbk.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url); fbk.textContent = 'Facebook';
    const cp = document.createElement('button'); cp.type = 'button'; cp.className = 'sh-btn'; cp.textContent = t.copy;
    cp.addEventListener('click', () => {
      const done = () => { cp.textContent = t.copied; setTimeout(() => { cp.textContent = t.copy; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(done); else done();
    });
    sh.appendChild(lbl); sh.appendChild(wa); sh.appendChild(fbk); sh.appendChild(cp);

    sec.appendChild(fb); sec.appendChild(sh);
    const end = $('.article-end', wrap);
    if (end) wrap.insertBefore(sec, end); else wrap.appendChild(sec);
  }

  /* Like public pe articol — contor persistent via Netlify Function (/.netlify/functions/likes).
     Dacă funcția nu e disponibilă (ex. preview local), nu afișează nimic. */
  function articleLikes() {
    const path = location.pathname;
    if (!/\/blog\/[^/]+$/.test(path)) return;
    const wrap = $('.article-wrap'); if (!wrap) return;
    const isEN = path.indexOf('/en/') === 0;
    const slug = path.replace(/[?#].*$/, '').replace(/\.html$/, '').replace(/\/$/, '');
    const key = 'liked:' + slug;
    const label = isEN ? 'Like' : 'Îmi place';
    const ep = '/.netlify/functions/likes?slug=' + encodeURIComponent(slug);

    fetch(ep).then((r) => (r.ok ? r.json() : Promise.reject())).then((data) => {
      let count = (data && typeof data.count === 'number') ? data.count : 0;
      let liked = localStorage.getItem(key) === '1';
      const box = document.createElement('div');
      box.className = 'article-likes';
      const btn = document.createElement('button');
      btn.type = 'button';
      const render = () => {
        btn.className = 'like-btn' + (liked ? ' is-liked' : '');
        btn.disabled = liked;
        btn.innerHTML = '';
        const h = document.createElement('span'); h.className = 'like-heart'; h.textContent = liked ? '❤️' : '🤍';
        const l = document.createElement('span'); l.className = 'like-label'; l.textContent = label;
        const c = document.createElement('span'); c.className = 'like-count'; c.textContent = count;
        btn.append(h, l, c);
      };
      render();
      btn.addEventListener('click', () => {
        if (liked) return;
        liked = true; count += 1; localStorage.setItem(key, '1'); render();
        fetch(ep, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
          if (d && typeof d.count === 'number') { count = d.count; render(); }
        }).catch(() => {});
      });
      box.appendChild(btn);
      const engage = $('.article-engage', wrap);
      if (engage) engage.insertBefore(box, engage.firstChild);
      else { const end = $('.article-end', wrap); if (end) wrap.insertBefore(box, end); else wrap.appendChild(box); }
    }).catch(() => { /* funcție indisponibilă — nu afișez butonul */ });
  }

  function init() {
    relatedArticles();
    articleEngagement();
    articleLikes();

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
