import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { generateIndexableHomeHtml } from './src/data/machineDocuments.ts';
import { DEFAULT_PORTFOLIO_DATA, generateJsonLdSchema } from './src/data/portfolioData.ts';

function htmlHead(): Plugin {
  return {
    name: 'portfolio-html-head',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const marker = '<!--indexable-shell-->';
        if (!html.includes(marker)) {
          throw new Error('index.html está sem o marcador <!--indexable-shell-->.');
        }
        // shortcut: preload body face not Archivo, add a /cv preload if that route's LCP suffers
        const font = Object.keys(ctx.bundle ?? {}).find((file) =>
          file.includes('atkinson-hyperlegible-next-latin-wght-normal')
        );
        const tags: HtmlTagDescriptor[] = [
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: JSON.stringify(generateJsonLdSchema(DEFAULT_PORTFOLIO_DATA)),
            injectTo: 'head'
          }
        ];
        if (font) {
          tags.unshift({
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${font}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: 'anonymous'
            },
            injectTo: 'head'
          });
        }
        return {
          html: html.replace(marker, generateIndexableHomeHtml(DEFAULT_PORTFOLIO_DATA)),
          tags
        };
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), htmlHead(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.')
    }
  },
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    cssCodeSplit: true
  },
  server: {
    port: 3000
  }
});
