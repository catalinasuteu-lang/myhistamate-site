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

  function init() {
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
        dlDownload.setAttribute('download', '');
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
