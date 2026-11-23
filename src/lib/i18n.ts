import rootPkg from '../../package.json';

export interface LangDef {
  code: string;
  path: string;
  og: string;
  name: string;
  slugPrefix: string; // '' for en, 'tr' for tr, etc.
}

export const ORIGIN = 'https://getcoinio.me';
export const REPO = 'https://github.com/getcoinio/coinio';

export const LANGS: LangDef[] = [
  { code: 'en', path: '/', og: 'en_US', name: 'English', slugPrefix: '' },
  { code: 'tr', path: '/tr/', og: 'tr_TR', name: 'Türkçe', slugPrefix: 'tr' },
  { code: 'de', path: '/de/', og: 'de_DE', name: 'Deutsch', slugPrefix: 'de' },
  { code: 'fr', path: '/fr/', og: 'fr_FR', name: 'Français', slugPrefix: 'fr' },
  { code: 'es', path: '/es/', og: 'es_ES', name: 'Español', slugPrefix: 'es' },
  { code: 'pt-BR', path: '/pt-br/', og: 'pt_BR', name: 'Português (Brasil)', slugPrefix: 'pt-br' },
  { code: 'zh-CN', path: '/zh/', og: 'zh_CN', name: '简体中文', slugPrefix: 'zh' },
  { code: 'ja', path: '/ja/', og: 'ja_JP', name: '日本語', slugPrefix: 'ja' },
];

export type PageSlug =
  | ''
  | 'wallos-alternative'
  | 'self-hosted-subscription-trackers'
  | 'free-subscription-tracker'
  | 'firefly-iii-subscription-tracker'
  | 'subscription-tracker-vs-spreadsheet'
  | 'privacy'
  | 'terms';

export interface PageDef {
  slug: PageSlug;
  faq: string[];
  faqPrefix: string;
  items?: { name: string; url: string }[];
}

export const PAGES: PageDef[] = [
  {
    slug: '',
    faq: ['hosted', 'free', 'needs', 'data', 'https', 'updates', 'privacy', 'firefly', 'family', 'passkey', 'import', 'languages', 'mcp', 'iphone', 'sheet'],
    faqPrefix: 'faq',
  },
  {
    slug: 'wallos-alternative',
    faq: ['better', 'import', 'both', 'notify', 'free'],
    faqPrefix: 'pfaq',
  },
  {
    slug: 'self-hosted-subscription-trackers',
    faq: ['best', 'free', 'database', 'ai', 'checked'],
    faqPrefix: 'pfaq',
    items: [
      { name: 'Wallos', url: 'https://github.com/ellite/Wallos' },
      { name: 'SubTrackr', url: 'https://github.com/bscott/subtrackr' },
      { name: 'Renewlet', url: 'https://github.com/zhiyingzzhou/renewlet' },
      { name: 'Zublo', url: 'https://github.com/danielalves96/zublo' },
      { name: 'Coinio', url: REPO },
    ],
  },
  {
    slug: 'free-subscription-tracker',
    faq: ['catch', 'limits', 'bank', 'export', 'selfhost'],
    faqPrefix: 'pfaq',
  },
  {
    slug: 'firefly-iii-subscription-tracker',
    faq: ['how', 'duplicates', 'delete', 'hosted', 'recurrences'],
    faqPrefix: 'pfaq',
  },
  {
    slug: 'subscription-tracker-vs-spreadsheet',
    faq: ['switch', 'import', 'export', 'currency', 'free'],
    faqPrefix: 'pfaq',
  },
  { slug: 'privacy', faq: [], faqPrefix: 'pfaq' },
  { slug: 'terms', faq: [], faqPrefix: 'pfaq' },
];

export const BACKUP_CODE = `<pre><code>docker run --rm -v coinio-data:/data -v "$PWD":/backup alpine \\
  tar czf /backup/coinio-backup.tgz -C /data .</code></pre>`;

export const APP_VERSION: string = rootPkg.version;

const allJson = import.meta.glob<{ default: Record<string, string> }>('../i18n/**/*.json', { eager: true });

function readJson(relPath: string, lang: LangDef): Record<string, string> {
  const mod = allJson[`../i18n/${relPath}`];
  if (!mod) throw new Error(`Missing i18n file: ${relPath}`);
  const raw = mod.default;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.replaceAll('{{base}}', lang.path)]));
}

const baseCatalogs: Record<string, Record<string, string>> = Object.fromEntries(
  LANGS.map((l) => [l.code, readJson(`${l.code}.json`, l)]),
);

const pageCatalogs: Record<string, Record<string, Record<string, string>>> = Object.fromEntries(
  PAGES.filter((p) => p.slug).map((p) => [
    p.slug,
    Object.fromEntries(LANGS.map((l) => [l.code, readJson(`pages/${p.slug}/${l.code}.json`, l)])),
  ]),
);

function assertKeys(label: string, ref: Record<string, string>, cur: Record<string, string>) {
  const missing = Object.keys(ref).filter((k) => !(k in cur));
  if (missing.length) throw new Error(`Missing i18n keys in ${label}: ${missing.join(', ')}`);
}

// Validate parity on module load so `astro build` fails immediately on any missing key.
for (const l of LANGS) {
  if (l.code !== 'en') assertKeys(`base/${l.code}`, baseCatalogs.en, baseCatalogs[l.code]);
  for (const p of PAGES) {
    if (p.slug && l.code !== 'en') {
      assertKeys(`pages/${p.slug}/${l.code}`, pageCatalogs[p.slug].en, pageCatalogs[p.slug][l.code]);
    }
  }
}

export function getMessages(lang: LangDef, slug: PageSlug): Record<string, string> {
  const base = baseCatalogs[lang.code];
  if (!slug) return base;
  return { ...base, ...pageCatalogs[slug][lang.code] };
}

export function getBaseMessages(lang: LangDef): Record<string, string> {
  return baseCatalogs[lang.code];
}

export function pagePath(lang: LangDef, slug: PageSlug): string {
  return lang.path + (slug ? `${slug}/` : '');
}

export function langByPrefix(prefix: string | undefined): LangDef {
  if (!prefix) return LANGS[0];
  const hit = LANGS.find((l) => l.slugPrefix === prefix);
  if (!hit) throw new Error(`Unknown lang prefix: ${prefix}`);
  return hit;
}

export function getLangStaticPaths() {
  return LANGS.map((l) => ({ params: { lang: l.slugPrefix || undefined }, props: { lang: l } }));
}

export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
