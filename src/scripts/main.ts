// Install tabs, hero mode switcher, copy buttons, theme switch, live demo, nav border on scroll, language hint.
const T = document.body.dataset;
const LANG = document.documentElement.lang;

for (const box of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
  const tablist = box.querySelector('[role="tablist"]');
  if (!tablist) continue;
  const tabs = [...tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const select = (tab: HTMLButtonElement) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panelId = t.getAttribute('aria-controls');
      if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panel.hidden = !on;
      }
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const step = ({ ArrowRight: 1, ArrowLeft: -1 } as Record<string, number>)[e.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  if (box.hasAttribute('data-mode-switcher')) {
    const syncHash = () => {
      if (location.hash === '#install') {
        const selfTab = document.getElementById('m-self') as HTMLButtonElement | null;
        selfTab?.click();
      }
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

for (const btn of document.querySelectorAll<HTMLButtonElement>('.copy')) {
  const label = btn.querySelector('span');
  if (!label) continue;
  const original = label.textContent ?? '';
  const originalAria = btn.getAttribute('aria-label') ?? '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  btn.addEventListener('click', async () => {
    const codeEl = btn.parentElement?.querySelector('code');
    const text = btn.dataset.copy ?? codeEl?.textContent?.trim() ?? '';
    const ok = await copyText(text);
    label.textContent = (ok ? T.copied : T.copyFallback) ?? '';
    btn.classList.toggle('is-done', ok);
    btn.setAttribute('aria-label', (ok ? T.copied : T.copyFailed) ?? '');
    clearTimeout(timer);
    timer = setTimeout(() => {
      label.textContent = original;
      btn.classList.remove('is-done');
      btn.setAttribute('aria-label', originalAria);
    }, 1800);
  });
}

// Theme: dark or light, remembered per visitor; the demo and its poster follow along.
const root = document.documentElement;
const themeBtn = document.querySelector<HTMLButtonElement>('.theme-btn');
const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const currentTheme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

function applyTheme(theme: string, remember: boolean) {
  root.dataset.theme = theme;
  if (themeMeta) themeMeta.content = theme === 'light' ? '#f8f8fb' : '#07080c';
  if (themeBtn) themeBtn.setAttribute('aria-label', (theme === 'light' ? T.toDark : T.toLight) ?? '');
  if (remember) {
    try {
      localStorage.setItem('coinio-site-theme', theme);
    } catch {
      /* storage blocked */
    }
  }
  syncDemoTheme();
}

themeBtn?.addEventListener('click', () => applyTheme(currentTheme() === 'light' ? 'dark' : 'light', true));
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('coinio-site-theme');
  } catch {
    /* storage blocked */
  }
  if (!stored) applyTheme(e.matches ? 'light' : 'dark', false);
});

// Live demo
const frame = document.querySelector<HTMLIFrameElement>('.demo-view iframe');
const win = document.querySelector<HTMLElement>('.demo-win');
const appTheme = () => (currentTheme() === 'light' ? 'paper' : 'night');
const demoUrl = () => `/demo/?theme=${currentTheme()}&lang=${LANG}`;

function syncDemoTheme() {
  for (const a of document.querySelectorAll<HTMLAnchorElement>('[data-demo-link]')) a.href = demoUrl();
  for (const img of document.querySelectorAll<HTMLImageElement>('.demo-poster img')) {
    img.classList.toggle('is-on', img.dataset.theme === currentTheme());
  }
  if (frame?.src) frame.contentWindow?.postMessage({ type: 'coinio:theme', theme: appTheme() }, location.origin);
}
syncDemoTheme();

const desktop = window.matchMedia('(min-width: 768px)');
function loadDemo() {
  if (frame && !frame.src && desktop.matches && frame.dataset.src) {
    frame.src = demoUrl();
  }
}
if (frame) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadDemo();
        if (frame.src) io.disconnect();
      }
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(frame);
  desktop.addEventListener('change', loadDemo);
}

let lastFocus: HTMLElement | null = null;
function openDemo() {
  loadDemo();
  lastFocus = document.activeElement as HTMLElement | null;
  win?.classList.add('is-expanded');
  root.classList.add('is-demo-open');
  win?.querySelector<HTMLElement>('.win-close')?.focus();
}
function closeDemo() {
  if (!win?.classList.contains('is-expanded')) return;
  win.classList.remove('is-expanded');
  root.classList.remove('is-demo-open');
  lastFocus?.focus?.();
}
for (const b of document.querySelectorAll('[data-demo-expand]')) b.addEventListener('click', openDemo);
for (const b of document.querySelectorAll('[data-demo-close]')) b.addEventListener('click', closeDemo);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDemo();
});
window.addEventListener('message', (e) => {
  if (e.origin === location.origin && e.data?.type === 'coinio:escape') closeDemo();
});

const nav = document.querySelector('.nav');
const onScroll = () => nav?.classList.toggle('is-stuck', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Language menu
const langMenu = document.querySelector<HTMLDetailsElement>('details.lang');
if (langMenu) {
  document.addEventListener('click', (e) => {
    if (langMenu.open && !langMenu.contains(e.target as Node)) langMenu.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && langMenu.open) {
      langMenu.open = false;
      langMenu.querySelector('summary')?.focus();
    }
  });
}

// Language hint
const HINT_KEY = 'coinio-site-lang-hint';
function preferredLang(codes: string[]): string | null {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const t = String(tag).toLowerCase();
    const base = t.split('-')[0];
    const hit = codes.find((c) => c.toLowerCase() === t) ?? codes.find((c) => c.split('-')[0] === base);
    if (hit) return hit;
  }
  return null;
}
async function langHint() {
  try {
    if (localStorage.getItem(HINT_KEY)) return;
  } catch {
    /* storage blocked */
  }
  const base = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase().split('-')[0];
  if (!base || base === LANG.toLowerCase().split('-')[0]) return;
  const res = await fetch('/langs.json');
  if (!res.ok) return;
  const langs = (await res.json()) as Record<string, { path: string; text: string; go: string; dismiss: string }>;
  const want = preferredLang(Object.keys(langs));
  if (!want || want === LANG) return;
  const l = langs[want];
  const bar = document.createElement('div');
  bar.className = 'lang-hint';
  bar.lang = want;
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', l.go);
  const text = document.createElement('span');
  text.textContent = l.text;
  const go = document.createElement('a');
  const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${want}"]`);
  go.href = alt ? new URL(alt.href).pathname : l.path;
  go.hreflang = want;
  go.textContent = l.go;
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', l.dismiss);
  close.title = l.dismiss;
  close.textContent = '×';
  close.addEventListener('click', () => {
    bar.remove();
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* storage blocked */
    }
  });
  bar.append(text, go, close);
  document.body.append(bar);
}
langHint().catch(() => {});
