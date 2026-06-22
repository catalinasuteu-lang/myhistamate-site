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

  const onCom = host.endsWith("myhistamate.com");
  const onRo = host.endsWith("myhistamate.ro");
  if (!onCom && !onRo) return; // deploy previews / *.netlify.app: leave untouched

  if (onCom) {
    // English domain: route Romanian paths to their /en/ equivalent.
    if (p === "/en") return Response.redirect(url.origin + "/en/", 302);
    if (!p.startsWith("/en/")) {
      return Response.redirect(url.origin + "/en" + (p === "/" ? "/" : p), 302);
    }
  } else if (onRo) {
    // Romanian domain: route English paths back to Romanian.
    if (p === "/en" || p === "/en/") return Response.redirect(url.origin + "/", 302);
    if (p.startsWith("/en/")) {
      return Response.redirect(url.origin + p.slice(3), 302); // strip leading "/en"
    }
  }
  // otherwise serve normally
};
