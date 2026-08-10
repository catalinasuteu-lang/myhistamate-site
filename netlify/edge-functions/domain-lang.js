// Domain-based language routing for MyHistamate.
//   myhistamate.com  -> English  (English pages live under /en/)
//   myhistamate.ro   -> Romanian (Romanian pages live at the root)
// Assets (css/js/json/images/pdf/xml/txt) are shared and never redirected.
export default async (request) => {
  const url = new URL(request.url);
  const host = (request.headers.get("host") || "").toLowerCase();
  const p = url.pathname;

  // Only touch real page routes — never assets or data files.
  const isPage = p === "/" || p.endsWith("/") || p.endsWith(".html") || p === "/en";
  if (!isPage) return;
  if (p.startsWith("/admin")) return; // CMS panel stays as-is

  // Supabase auth landing pages (mobile app email links) exist only at the
  // root and must be reachable on BOTH domains — never language-redirected.
  const authPages = ["/reset-password", "/cont-confirmat", "/email-confirmat"];
  if (authPages.some((a) => p === a || p === a + ".html")) return;

  const onCom = host === "myhistamate.com" || host === "www.myhistamate.com";
  const onRo = host === "myhistamate.ro" || host === "www.myhistamate.ro";
  if (!onCom && !onRo) return; // deploy previews / *.netlify.app: leave untouched

  // Permanent language mapping -> 301, and keep query string (filters, UTM, auth codes).
  const go = (path) => Response.redirect(url.origin + path + url.search, 301);

  // Pages whose RO/EN filenames differ (everything else maps 1:1 by path).
  // ⚠️ Orice pagină EN redenumită TREBUIE trecută aici, altfel .com/<nume-ro>.html
  // trimite 301 către un /en/<nume-ro>.html inexistent → 404. (Exact asta s-a
  // întâmplat pe 10 aug, la redenumirea politicii aplicației.)
  const renamed = {
    "/despre.html": "/en/about.html",
    "/confidentialitate.html": "/en/privacy.html",
    "/confidentialitate-aplicatie.html": "/en/app-privacy.html",
    "/termeni.html": "/en/terms.html",
    "/jurnal.html": "/en/symptom-journal.html",
  }; // RO path -> EN path

  if (onCom) {
    // English domain: route Romanian paths to their /en/ equivalent.
    if (p === "/en") return go("/en/");
    if (!p.startsWith("/en/")) {
      if (renamed[p]) return go(renamed[p]);
      return go("/en" + (p === "/" ? "/" : p));
    }
  } else if (onRo) {
    // Romanian domain: route English paths back to Romanian.
    if (p === "/en" || p === "/en/") return go("/");
    if (p.startsWith("/en/")) {
      const roPath = Object.keys(renamed).find((k) => renamed[k] === p);
      if (roPath) return go(roPath);
      return go(p.slice(3)); // strip leading "/en"
    }
  }
  // otherwise serve normally
};
