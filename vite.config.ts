import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { DEFAULT_PORTFOLIO_DATA, generateJsonLdSchema } from './src/data/portfolioData.ts';

// Injeta o Schema.org no HTML estático para buscadores que não executam JavaScript.
function jsonLd(): Plugin {
  return {
    name: 'portfolio-json-ld',
    transformIndexHtml: () => [
      {
        tag: 'script',
        attrs: { type: 'application/ld+json' },
        children: JSON.stringify(generateJsonLdSchema(DEFAULT_PORTFOLIO_DATA)),
        injectTo: 'head'
      }
    ]
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), jsonLd(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.')
    }
  },
  server: {
    port: 3000
  }
});
