# MyHistamate — Audit complet site (3 iulie 2026)

*Fișier intern, nu se publică. Continuarea lui `AUDIT-SITE.md` (20 iunie) — majoritatea punctelor de acolo sunt REZOLVATE (vezi §7).*

> **UPDATE 3 iulie (aceeași zi):** Pachetul de reparații a fost implementat. REZOLVATE din cod:
> B1 (sitemap per domeniu: `sitemap.xml` = .com, `sitemap-ro.xml` + `robots-ro.txt` servite pe .ro prin redirect de domeniu), B2 (feed-uri), B3 (bug ghilimele — 7 articole aveau descrierea efectiv trunchiată; reparat + ghilimele tipografice), B4 (og:url/og:image absolut/Twitter cards peste tot), B5 (404.html bilingv), B6 (edge function: 301, query string păstrat, carve-out pagini auth, mapare despre↔about), B7 (CSP unic cu sursele pt /admin — DE VERIFICAT în browser după deploy), B8+B9 (config ghiduri curățat; panou: colecție EN + Ghid 4; cms-content.js pe paginile de blog), B10 (lang pe formulare RO, link limbă meniu mobil RO, footer-uri unificate, inLanguage consecvent), §3.3 (succes real la newsletter/waitlist).
> CONSTRUITE: `despre.html` + `en/about.html` (+ Person/ProfilePage schema, byline cu link + timp de citire pe toate articolele), Organization + WebSite JSON-LD pe homepage-uri, `llms.txt`, x-default → EN peste tot, fonturi self-hosted pe paginile auth + noindex.
> RĂMASE (blocate pe Cătălina): Brevo, GSC pentru .ro + retrimitere sitemap-uri, decizie slug-uri EN, decizie mini-tool alimente, test /admin în browser.
>
> **Verificat LIVE după deploy (toate OK):** `/`→301 `/en/`, query string păstrat la redirect, `.com/feed.xml`→`/en/feed.xml`, `despre.html`↔`en/about.html` mapate pe ambele domenii, paginile auth răspund 200 pe .com, sitemap-ul .ro nu mai conține loc-uri .com, 404 real + branduit, `/admin` are un singur header CSP cu unpkg, JSON-LD RO reparat, H2-uri-întrebare live.
>
> ## TODO pentru sesiunea următoare
>
> **Pot face singură (fără nimic de la owner), în ordinea impactului:**
> 1. **Restructurare AEO pe restul de 19 articole** (paragraf „Pe scurt" sus + H2-uri formulate ca întrebări). Amânat ca owner să valideze mostra pe `galeata-histamina` + `histamina-continut-vs-eliberare`. Cel mai valoros rămas.
> 2. **Pagină-pilon** „Ghid complet: intoleranța la histamină" care leagă toate cele 21 articole (cluster tematic SEO/AEO).
> 3. **BreadcrumbList schema** pe articole (Acasă › Blog › Articol) — rich results.
> 4. **Extindere FAQ** cu întrebări despre AFECȚIUNE (ce pot mânca, cât durează o criză, ce e DAO) — de confirmat tonul cu owner înainte.
>
> **Blocat pe owner (cel mai bun ROI acum — NU codul):**
> - **GSC**: verificare proprietate **myhistamate.ro** (separată de .com) + Bing → retrimis ambele sitemap-uri. Fără asta, site-ul rămâne neindexat.
> - **Brevo**: cont + cheie API (variabilă de mediu Netlify) → conectez formularele + double opt-in + welcome email cu ghidurile.
> - Decizii: slug-uri EN în engleză (recomand DA — fac 301-urile), mini-tool alimente pe site, reCAPTCHA invizibil (din Netlify), test vizual `/admin`, poză+bio nouă pt Despre.

Acoperire: tot codul din `Myhistamate web\site` (52 pagini HTML, main.js, cms-content.js, netlify.toml, edge function, funcții Netlify, admin) + site-ul LIVE (.com și .ro) + indexare/competiție + SEO/AEO/GEO.

Legendă: 🔴 critic/important · 🟡 mediu · 🟢 minor

---

## 1. BUG-URI

### 🔴 B1. Sitemap cross-domain — Google îl ignoră parțial
Ambele domenii servesc ACELAȘI sitemap care amestecă URL-uri `.ro` și `.com`. Google ignoră URL-urile de pe alt host decât cel al sitemap-ului dacă ambele proprietăți nu sunt verificate în Search Console (Bing e și mai strict). În plus, `robots.txt` de pe **.ro** trimite la sitemap-ul de pe **.com**.
**Fix:** două sitemap-uri, fiecare doar cu URL-urile domeniului lui (păstrând adnotările hreflang `xhtml:link`, care sunt corecte); `robots.txt` pe .ro → sitemap .ro.

### 🔴 B2. Feed-uri RSS încurcate între domenii
- `myhistamate.com/feed.xml` servește feed-ul ROMÂNESC, cu self-URL `myhistamate.ro/feed.xml` și limba `ro-RO` → conținut duplicat cross-domain. Fix: redirect `.com/feed.xml` → `/en/feed.xml`.
- `en/feed.xml:5` — link-ul canalului e `https://myhistamate.com/blog.html` (fără `/en/`); merge doar prin 302. Fix: `/en/blog.html`.

### 🔴 B3. JSON-LD trunchiat pe articolele RO (bug de ghilimele)
Pe articolele RO, `description` din schema BlogPosting se taie la prima ghilimea românească „ (ex. `somn-stres-histamina.html`: descrierea se oprește la `mănânc „perfect"`). Generatorul de schema nu escapează ghilimelele. Pe EN s-a ocolit cu `&quot;` (parsează, dar entitatea apare literal — corect e `\"`). **De auditat toate cele 21 articole RO.**

### 🔴 B4. og:image relativ pe homepage-uri → share fără imagine
`index.html:14`, `en/index.html:14`, `blog.html:12` au `og:image` cu cale RELATIVĂ. Facebook/WhatsApp/LinkedIn cer URL absolut → share-ul homepage-ului apare FĂRĂ imagine. Articolele (toate 42) sunt corecte. Lipsesc peste tot: `og:url` și tag-urile Twitter Card (`summary_large_image`).

### 🔴 B5. Pagina 404 = default Netlify (nebranduită, engleză)
Nu există `404.html`, deși `netlify.toml:41-45` chiar face redirect spre `/404.html` pentru `/guides-gated/*`. Orice link mort → pagina urâtă Netlify. Fix: `404.html` + `en/404.html` branduite, cu navigare.

### 🟡 B6. Edge function (domain-lang.js) — 3 probleme
1. **Pierde query string-ul** la redirect (`:21-29` — doar `origin + pathname`): `myhistamate.com/blog.html?cat=retete` aterizează pe `/en/blog.html` fără filtru; un viitor link Supabase PKCE `?code=` sau UTM ar fi tăiat. Fix: + `url.search`.
2. **Paginile auth există doar la root** (`reset-password.html`, `cont-confirmat.html`, `email-confirmat.html`, fără copii `/en/`): pe .com, varianta cu `.html` → redirect spre `/en/...` → 404. Linkurile FĂRĂ extensie configurate în Supabase (`/cont-confirmat` etc.) NU se potrivesc regulii `isPage` (`:11`), deci trec și funcționează azi — dar e fragil. Fix: carve-out explicit în funcție (ca `/admin`) + ideal copii `/en/`.
3. **302 în loc de 301** peste tot, inclusiv `/` → `/en/` — 301 consolidează semnalele SEO pentru o mapare permanentă.

### 🟡 B7. Panoul /admin probabil BLOCAT de CSP dublu
`netlify.toml` definește CSP de două ori: strict pe `/*` (:21) și permisiv pe `/admin/*` (:28). Netlify aplică AMBELE headere pe /admin, iar browserul impune intersecția → scriptul Decap de pe unpkg (`admin/index.html:10`) e blocat. Headerele au fost adăugate DUPĂ ce panoul mergea (19 iunie), deci panoul e probabil stricat de atunci. **De verificat în browser**; fix: scoate /admin din CSP-ul strict sau o singură politică ce include unpkg + api.netlify.com + github.

### 🟡 B8. Capcană în config-ul ghidurilor (content.json + admin)
`content.json:27-37` încă indică `guide_*_pdf` spre `/assets/ghiduri/*.pdf` — fișiere ȘTERSE (mutate în `/guides-gated`). `admin/config.yml:52-58` le expune ca widget de UPLOAD cu `media_folder: assets` → dacă urci un ghid nou din panou: (a) devine PUBLIC în /assets (ocolește email-gate-ul) și (b) tot nu e servit, pentru că maparea reală e hardcodată în `download-guide.mjs:8-23`. Fix: șterge cheile `guide_*_pdf` din content.json + config.yml + codul mort `data-pdf` din cms-content.js.

### 🟡 B9. Panoul admin desincronizat de conținut
- NU există colecție pentru `en/content.json` → homepage-ul EN nu se poate edita din panou deloc (drift RO/EN garantat).
- Lipsesc câmpuri pentru `guide_4_title/text`, `guide_all_pdf`.
- `blog.html` + `en/blog.html` au marcaje `data-cms` dar NU încarcă `cms-content.js` → editările din panou (newsletter/app) rămân vechi pe paginile de blog.

### 🟢 B10. Mărunte
- Articolele EN nu au `hreflang="x-default"` (RO au) — inconsecvent.
- Formularele RO nu au câmpul ascuns `lang` pe care EN îl au → Netlify Forms poate pierde valoarea.
- Meniul mobil RO nu are link de schimbat limba (EN are).
- Footer-ul articolelor de blog nu are link FAQ (template vechi).
- `inLanguage` inconsecvent în schema (`"en"` vs `"ro-RO"`).

---

## 2. SECURITATE — per total OK

✅ Fără secrete în repo (cheia Supabase din reset-password e cea *publishable*, publică prin design; token-ul Cloudflare beacon idem). ✅ XSS prevenit corect în cms-content.js și blog search. ✅ Headere bune (HSTS, XFO, X-CTO, Referrer-Policy, Permissions-Policy, CSP). ✅ /admin protejat real prin GitHub OAuth (comentariul din netlify.toml zice greșit „Netlify Identity", dar protecția există). ✅ reset-password: token doar în fragment, scrubat din URL, trimis doar ca Bearer.

De notat (nu urgente):
- 🟡 `download-guide.mjs:33` acceptă orice email valid sintactic, fără rate-limit → oricine poate trage PDF-urile cu curl fără să fie lead real + boții pot arde cota Netlify Forms (100/lună). Honeypot-ul e singura protecție anti-spam pe toate formularele.
- 🟢 `likes.mjs` — increment ne-atomic + fără protecție → contorul e umflabil trivial. Acceptabil la scara actuală.
- 🟢 `script-src 'unsafe-inline'` e cerut doar de scriptul inline din blog.html — mutabil în main.js.
- 🟢 Cele 3 pagini auth încarcă Google Fonts din CDN (restul site-ului e self-hosted) — inconsecvență GDPR/perf.
- 🟢 reset-password gestionează doar implicit flow (`#access_token`); dacă app-ul trece vreodată pe PKCE (`?code=`), pagina + B6.1 îl strică.

---

## 3. PUNCTE SLABE FUNCȚIONALE

1. 🔴 **Niciun email nu pleacă spre abonați** (fără Brevo/ESP) — cel mai mare gol. Adresele zac în Netlify Forms; fără backup, fără double opt-in, fără welcome email cu ghidurile.
2. 🔴 **Consimțământ GDPR moale la ghiduri**: modalul spune „te adaug și pe listă" fără checkbox separat pentru newsletter. La pornirea Brevo: checkbox + double opt-in.
3. 🟡 **Succes „optimist" la newsletter + waitlist** (`main.js:15-22, 226-234`): mesajul de succes apare chiar dacă POST-ul pică. (Fluxul de ghiduri a fost reparat corect — cu stări de așteptare/eroare; astea două nu.)
4. 🟡 **Lead-ul de la ghid e fire-and-forget** (`main.js:276`): PDF-ul se livrează chiar dacă salvarea emailului a picat silențios; funcția însăși nu stochează nimic. Fix: funcția să logheze/salveze emailul (Brevo/Blobs) ca backup.
5. 🟢 Fără „timp de citire" pe articole (singurul item vechi nefăcut din wishlist).

---

## 4. SEO / AEO / GEO (verificat LIVE, 3 iulie)

### Ce e deja BINE (neobișnuit de bine pentru un proiect solo)
canonical-uri corecte per domeniu pe toate paginile · hreflang reciproc complet (ro/en/x-default) · BlogPosting JSON-LD pe toate articolele (autor, publisher, date, imagine absolută) · **FAQPage JSON-LD pe ambele FAQ-uri** (9 Q&A — cel mai bun activ AEO) · robots.txt curat · 404 întoarce HTTP 404 real · RSS valid ambele limbi · alt text pe coperți · lazy loading · a11y labels + skip links.

### 🔴 Problema #1: site-ul pare NEINDEXAT
Căutarea exactă `"myhistamate"` nu întoarce NIMIC de pe site (niciun domeniu). Pentru un query de brand, asta înseamnă indexare aproape zero / autoritate zero. **Prima acțiune: Search Console pentru AMBELE domenii + Bing Webmaster, sitemap-uri corectate trimise, raport Coverage verificat.** (GSC fusese verificat pe 20 iunie doar pentru .com, înainte de strategia pe două domenii.)

### 🔴 Golul de entitate / E-E-A-T
- **Zero JSON-LD pe homepage-uri** — lipsesc `Organization` (nume, logo, founder Cătălina, sameAs) + `WebSite`. Ăsta e ancorajul pe care AI-urile (ChatGPT, Perplexity, AI Overviews) îl folosesc ca să înțeleagă „ce e MyHistamate".
- **NU există pagină Despre** (`/despre`, `/en/about` → 404). Experiența la persoana 1 a Cătălinei e EXACT semnalul „Experience" din E-E-A-T pe un subiect YMYL — dar nu are pagină dedicată, byline vizibil pe articole, sau `Person` schema cu `author.url`.
- **Fără `llms.txt`** pe niciun domeniu — câștig ieftin pe static.

### 🟡 Decizii strategice de luat
- **x-default arată spre .ro** → tot traficul global nematchat e trimis la varianta română. Căutările despre histamină sunt covârșitor EN/DE. Recomandare: x-default → `/en/`.
- **Slug-urile EN sunt în română** (`/en/blog/somn-stres-histamina.html`, `/en/jurnal.html`) → zero cuvinte-cheie EN în URL. Acum, cât nu e nimic indexat, migrarea cu 301 costă zero. Mai târziu costă.

### 🟡 Conținutul nu e „answer-shaped" (AEO/GEO)
- Articolele au 2 H2-uri narative; AI-urile citează pasaje definiționale autonome. De adăugat (păstrând vocea): paragraf-definiție de 40-60 cuvinte sus, H2-uri formulate ca întrebări, bloc „Pe scurt / Key points".
- FAQ-ul e despre site/app, nu despre AFECȚIUNE — Q&A-urile cu volum AEO sunt cele despre simptome, DAO, alimente, teste.
- **Linking intern slab**: corpul articolelor leagă doar spre ancore de homepage — zero linkuri articol→articol în text (blocul „articole similare" există, dar clusterele tematice lipsesc).

### Competiție (snapshot 3 iulie)
- **RO:** `intoleranta-histamina.online` = #1 pe „intoleranta la histamina aplicatie", are deja app pe Play + comunitate Facebook → rivalul direct. Restul rezultatelor RO = domenii medicale mari (Regina Maria, Sanador, Catena, Synevo) care dețin query-urile de afecțiune; query-ul de APP e câștigabil.
- **EN:** Food Intolerances (Baliza), Histamine Intolerance App (histamine-intolerance.net — competitor feature-for-feature), Ask Ingrid, Fig, All I Can Eat; autorități de conținut: healinghistamine.com, histaminebalance.com, mastcellaction.org.

---

## 5. PLAN RECOMANDAT (prioritizat)

**P0 — instalații & indexare (săptămâna asta, toate triviale):** [Claude, cod]
1. Sitemap per domeniu + robots.txt .ro corectat → retrimise în GSC. [+ Cătălina: verificare GSC ambele domenii + Bing]
2. Redirect `/`→`/en/` din 302 în 301 (și restul redirecturilor de limbă).
3. og:image absolut + og:url + Twitter cards pe homepage-uri/blog index.
4. Fix feed-uri (B2) + bug ghilimele JSON-LD RO (B3).
5. 404.html branduit (RO+EN).
6. Edge function: păstrează query string + carve-out pagini auth.
7. Curățenie config ghiduri (B8) + verificare/fix /admin CSP (B7).

**P1 — entitate & email (următoarele 2 săptămâni):**
8. Pagină Despre/About + Organization + WebSite + Person schema + byline pe articole. [Claude + poză/bio de la Cătălina]
9. **Brevo**: conectare formulare, double opt-in, welcome email cu ghidurile, backup lead-uri. [Cătălina: cont + cheie API]
10. llms.txt ambele domenii; decizie x-default → /en/; migrare slug-uri EN cu 301.
11. Fix succes optimist newsletter/waitlist + checkbox consimțământ.

**P2 — conținut AEO (continuu):**
12. Restructurare articole (definiție sus, H2-uri întrebare, key points) + FAQ extins cu Q&A despre HIT + linking intern în corp.
13. Timp de citire; admin sync (colecție EN, câmpuri lipsă).

---

## 6. IDEI FUNCȚIONALITĂȚI NOI (site)

1. **Mini-căutare de alimente pe site** (semafor: sigur/atenție/evită, subset SIGHI) — query-urile „e X ok cu histamina?" sunt exact ce caută lumea; magnet AEO + teaser natural pentru app. ⚠️ De cântărit cu decizia „secret competitiv" — dar lista de alimente e commodity (SIGHI e publică); diferențiatorul app-ului e jurnalul+AI, nu lista.
2. **Curs pe email „Primele 7 zile după diagnostic"** (automatizare Brevo) — transformă lead-urile pasive în relație; conținutul există deja în ghiduri.
3. **Upgrade waitlist**: poziționare „early access + preț de lansare" + număr afișat; opțional referral simplu.
4. **Pagină-pilon „Ghid complet intoleranța la histamină"** care leagă toate cele 21 articole (cluster tematic — SEO + AEO).
5. **Breadcrumbs + BreadcrumbList schema** pe blog.
6. La lansarea app-ului: pagina /app cu capturi reale, prețuri, linkuri store + `MobileApplication` schema; revizuit decizia de descriere vagă (la lansare, vagul costă conversie).

---

## 7. STATUS AUDIT-SITE.md (20 iunie) — pe scurt

REZOLVATE: email-gate real (PDF-uri în /guides-gated + funcție), search + related + filtre blog, headere securitate, og:image per articol, lazy loading, JSON-LD articole, a11y, canonical-uri, analytics (Cloudflare beacon, în main.js:306-313), fonturi self-hosted, RSS, share, feedback, FAQ, jurnal printabil, date firmă SRL.
RĂMASE DESCHISE: **Brevo** (cel mai mare), spam/reCAPTCHA, backup adrese + double opt-in, timp de citire, succes optimist pe newsletter/waitlist (parțial — ghidurile-s reparate).
REGRESIE INTRODUSĂ: headerele CSP au stricat probabil /admin (B7).

---

## 8. CE TREBUIE DE LA CĂTĂLINA (blocaje)

1. **Brevo**: cont gratuit + listă + cheie API (pusă DOAR ca variabilă de mediu în Netlify, nu în repo).
2. **Search Console**: verificarea domeniului **.ro** (proprietate separată; .com era verificat din 20 iunie) + Bing Webmaster Tools; apoi screenshot Coverage după retrimiterea sitemap-urilor.
3. **Decizie x-default** → recomand `/en/` (piața globală).
4. **Decizie slug-uri EN în engleză** → recomand DA, acum (301-urile le fac eu).
5. **Decizie mini-tool alimente pe site** (vs secretul competitiv).
6. **Poză + 3-4 fraze bio** pentru pagina Despre.
7. **Test /admin în browser** (sau acces să-l verific eu) — confirmă B7.
