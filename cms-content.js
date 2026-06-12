/* ============================================================
   MyHistamate — încarcă textele editabile din content.json
   Designul rămâne în HTML; aici doar înlocuim textele.
   Convenții pentru editare în panou:
     **text**  -> cuvinte portocalii (coral)
     *text*    -> text înclinat (italic)
   ============================================================ */
(function () {
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function render(s) {
    s = esc(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<span class="coral">$1</span>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }
  function apply(data) {
    if (!data) return;
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var key = el.getAttribute('data-cms');
      if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== '') {
        el.innerHTML = render(data[key]);
      }
    });
  }
  fetch('content.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(apply)
    .catch(function () { /* dacă nu se încarcă, rămâne textul din pagină */ });
})();
