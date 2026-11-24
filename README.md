# Coinio Website

Marketing website and live browser demo for [Coinio](https://github.com/getcoinio/coinio), served at [getcoinio.me](https://getcoinio.me).

[![License: MIT](https://img.shields.io/badge/license-MIT-4f5bd5.svg)](LICENSE)

[Live site](https://getcoinio.me) · [Live demo](https://getcoinio.me/demo/) · [Documentation](https://docs.getcoinio.me) · [Free hosted app](https://app.getcoinio.me/signup)

![Coinio: every subscription, one calm page](public/assets/og.png)

## What is in this repo

- **8-language static site** built with Astro 5 (`en`, `tr`, `de`, `fr`, `es`, `pt-BR`, `zh-CN`, `ja`), localized SEO metadata, JSON-LD structured data, and `sitemap.xml`.
- **Comparison and landing pages** for Wallos alternatives, self-hosted subscription trackers, spreadsheets, Firefly III integration, and the free hosted tier.
- **Interactive browser demo** at `/demo/` (pre-built from `getcoinio/coinio` via `pnpm build:demo` and embedded on the landing page with theme/language sync).
- **One-line install script** served at [`getcoinio.me/install`](public/install.sh) (alias for `public/install.sh` via `public/_redirects`).
- **Machine-readable index** at [`public/llms.txt`](public/llms.txt) and strict Cloudflare Pages security/cache headers in [`public/_headers`](public/_headers).

## Project structure

```text
src/
  components/   Astro UI sections (Hero, LiveDemo, FeaturesGrid, Install, FAQ, Footer…)
  i18n/         Translations for main pages and comparison subpages in 8 locales
  layouts/      BaseLayout with hreflang alternates, Open Graph and JSON-LD
  lib/          i18n helpers, language definitions, version constant
  pages/        Localized static routes, 404, langs.json, sitemap.xml
  scripts/      Client interactions (tabs, copy buttons, theme switch, lazy demo loader)
  styles/       Global stylesheet
public/
  assets/       OG image, favicons, responsive dashboard WebP posters
  demo/         Pre-built browser-only Coinio demo SPA
  install.sh    Docker + optional Cloudflare Tunnel installer
  _headers      Cloudflare Pages CSP and immutable cache headers
  _redirects    /install -> /install.sh
```

## Development

Requires Node.js 22 and pnpm 12.

```sh
pnpm install
pnpm dev      # http://localhost:4663
pnpm build    # static output in dist/
pnpm preview  # preview dist/ on http://localhost:4663
```

## Deployment

Deployed to Cloudflare Pages (`coinio-site`) as a static site from `dist/`.

## Related repositories

- [`getcoinio/coinio`](https://github.com/getcoinio/coinio) — Core self-hosted app, API, MCP server and Docker image
- [`getcoinio/docs`](https://github.com/getcoinio/docs) — Documentation (`docs.getcoinio.me`)

## License

[MIT](LICENSE) © 2026 Yakup Emre Yerli
