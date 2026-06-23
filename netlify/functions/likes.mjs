// Likes pe articole — contor public, persistent (Netlify Blobs).
//   GET  /.netlify/functions/likes?slug=/blog/x   -> { slug, count }
//   POST /.netlify/functions/likes?slug=/blog/x   -> incrementează, { slug, count }
import { getStore } from '@netlify/blobs';

const HEADERS = { 'content-type': 'application/json', 'cache-control': 'no-store' };

export default async (req) => {
  const url = new URL(req.url);
  let slug = (url.searchParams.get('slug') || '').trim();
  // acceptă doar slug-uri de articol, normalizate (fără host, fără .html)
  slug = slug.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '').replace(/\.html$/, '').replace(/\/$/, '');
  if (!/^\/(en\/)?blog\/[a-z0-9-]+$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'invalid slug' }), { status: 400, headers: HEADERS });
  }

  const store = getStore('article-likes');

  if (req.method === 'POST') {
    const cur = parseInt((await store.get(slug)) || '0', 10) || 0;
    const next = cur + 1;
    await store.set(slug, String(next));
    return new Response(JSON.stringify({ slug, count: next }), { headers: HEADERS });
  }

  const count = parseInt((await store.get(slug)) || '0', 10) || 0;
  return new Response(JSON.stringify({ slug, count }), { headers: HEADERS });
};
