import type { APIRoute } from 'astro';
import { getBaseMessages, LANGS } from '../lib/i18n';

export const GET: APIRoute = () => {
  const langs = Object.fromEntries(
    LANGS.map((l) => {
      const t = getBaseMessages(l);
      return [l.code, { path: l.path, text: t['lang.suggest'], go: t['lang.suggestGo'], dismiss: t['lang.dismiss'] }];
    }),
  );
  return new Response(`${JSON.stringify(langs, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
