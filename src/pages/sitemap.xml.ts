import type { APIRoute } from 'astro';
import { LANGS, ORIGIN, PAGES, pagePath } from '../lib/i18n';

export const GET: APIRoute = () => {
  const urls = PAGES.flatMap((pg) => {
    const links = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${ORIGIN}${pagePath(l, pg.slug)}"/>`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${pagePath(LANGS[0], pg.slug)}"/>`)
      .join('\n');
    return LANGS.map((l) => `  <url>\n    <loc>${ORIGIN}${pagePath(l, pg.slug)}</loc>\n${links}\n  </url>`);
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
