import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://getcoinio.me',
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'always',
  },
});
