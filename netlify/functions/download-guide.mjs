// Gate real pentru ghidurile PDF: livrează fișierul DOAR după ce primește un email.
// PDF-urile stau în /guides-gated (acces HTTP direct blocat în netlify.toml) și sunt
// incluse în bundle-ul funcției (included_files). Răspunsul e streamuit (fișierul mare).
import { createReadStream, existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';

const FILES = {
  ro: {
    guide_1_pdf: { file: 'ghid-restaurant.pdf', name: 'Ghidul restaurantului cu HIT' },
    guide_2_pdf: { file: 'ghid-prima-saptamana.pdf', name: 'Prima saptamana dupa diagnostic' },
    guide_3_pdf: { file: 'ghid-galeata.pdf', name: 'Galeata de histamina' },
    guide_all_pdf: { file: 'myhistamate-toate-ghidurile.pdf', name: 'Toate ghidurile' },
  },
  en: {
    guide_1_pdf: { file: 'en/guide-restaurant.pdf', name: 'The HIT restaurant guide' },
    guide_2_pdf: { file: 'en/guide-first-week.pdf', name: 'Your first week after diagnosis' },
    guide_3_pdf: { file: 'en/guide-bucket.pdf', name: 'The histamine bucket' },
    guide_all_pdf: { file: 'en/myhistamate-all-guides.pdf', name: 'All the guides' },
  },
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
const json = (obj, status) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  let body = {};
  try { body = await req.json(); } catch { /* ignore */ }

  if (!isEmail(body.email)) return json({ error: 'email invalid' }, 400);
  const lang = body.lang === 'en' ? 'en' : 'ro';
  const entry = FILES[lang][body.key];
  if (!entry) return json({ error: 'guide necunoscut' }, 404);

  const fp = path.join(process.cwd(), 'guides-gated', entry.file);
  if (!existsSync(fp)) return json({ error: 'fisier lipsa' }, 404);

  const stream = Readable.toWeb(createReadStream(fp));
  return new Response(stream, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="MyHistamate - ${entry.name}.pdf"`,
      'cache-control': 'no-store',
    },
  });
};
