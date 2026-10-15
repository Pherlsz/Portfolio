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

export default defineConfig(() => {
  const expressDev = process.env.PORTFOLIO_EXPRESS === '1';
  return {
    plugins: [react(), tailwindcss(), jsonLd(), ...(expressDev ? [] : [cloudflare()])],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
