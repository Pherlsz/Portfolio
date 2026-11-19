import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import { z } from 'zod';
import { parseMarkdownCollection, type ContentDocument } from './src/content/collections.ts';
import { visibleSections } from './src/content/sections.ts';
import { generateIndexableHomeHtml, generateJsonLdSchema } from './src/data/machineDocuments.ts';
import {
  DEFAULT_PORTFOLIO_DATA,
  SITE_ORIGIN,
  plainText
} from './src/data/portfolioData.ts';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function readMarkdownDir(dirPath: string): Promise<ContentDocument[]> {
  try {
    const entries = await fs.readdir(dirPath);
    const rawMap: Record<string, string> = {};
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue;
      rawMap[entry] = await fs.readFile(path.join(dirPath, entry), 'utf8');
    }
    return parseMarkdownCollection(rawMap);
  } catch {
    return [];
  }
}

function contentSchemaGuard(): Plugin {
  const RoleSchema = z.object({
    title: z.string().min(1),
    start: z.string().regex(/^\d{4}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}$/)
  });
  const ExperienceSchema = z.object({
    id: z.string().min(1),
    company: z.string().min(1),
    location: z.string().min(1),
    summary: z.string().min(1),
    roles: z.array(RoleSchema).min(1),
    highlights: z.array(z.object({ metric: z.string().optional(), text: z.string().min(1) })).min(1),
    stack: z.array(z.string().min(1))
  });
  const ProjectSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    kicker: z.string().min(1),
    kind: z.enum(['app', 'library', 'case-study', 'portfolio-version']),
    tagline: z.string().min(1),
    stack: z.array(z.string().min(1))
  });
  const CertificateSchema = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    issuer: z.string().min(1),
    platform: z.string().min(1),
    code: z.string().min(1),
    description: z.string().min(1),
    issuedAt: z.string().min(1)
  });

  let validated = false;

  return {
    name: 'portfolio-content-schema-guard',
    async buildStart() {
      if (validated) return;
      validated = true;

      const root = import.meta.dirname;
      const readJson = async (rel: string) =>
        JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));

      z.object({
        siteOrigin: z.string().url(),
        updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        profile: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          linkedin: z.string().url(),
          github: z.string().url()
        })
      }).parse(await readJson('content/profile.json'));

      z.array(ExperienceSchema).min(1).parse(await readJson('content/experiences.json'));
      z.array(ProjectSchema).min(1).parse(await readJson('content/projects.json'));
      z.array(CertificateSchema).parse(await readJson('content/certificates.json'));

      await readMarkdownDir(path.join(root, 'content/studies'));
      await readMarkdownDir(path.join(root, 'content/articles'));
    }
  };
}

interface PrerenderRoute {
  route: string;
  title: string;
  description: string;
  bodyHtml: string;
}

function applyRouteMeta(
  templateHtml: string,
  entry: PrerenderRoute
): string {
  const canonical = `${SITE_ORIGIN}${entry.route === '/' ? '/' : entry.route}`;
  const safeTitle = escapeHtml(entry.title);
  const safeDesc = escapeHtml(entry.description);
  const safeCanonical = escapeHtml(canonical);

  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${safeCanonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${safeCanonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>\s*<script/,
    `<div id="root">${entry.bodyHtml}</div>\n    <script`
  );
  return html;
}

function htmlHead(): Plugin {
  let outDir = '';

  return {
    name: 'portfolio-html-head',
    configResolved(config) {
      if (config.build?.outDir) {
        outDir = path.resolve(config.root, config.build.outDir);
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const marker = '<!--indexable-shell-->';
        if (!html.includes(marker)) {
          throw new Error('index.html está sem o marcador <!--indexable-shell-->.');
        }
        const font = Object.keys(ctx.bundle ?? {}).find((file) =>
          file.includes('archivo-latin-wdth-normal')
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
    },
    async closeBundle() {
      const clientDir = outDir.endsWith('client')
        ? outDir
        : path.resolve(import.meta.dirname, 'dist/client');
      const indexPath = path.join(clientDir, 'index.html');
      let baseHtml: string;
      try {
        baseHtml = await fs.readFile(indexPath, 'utf8');
      } catch {
        return;
      }

      const studies = await readMarkdownDir(path.join(import.meta.dirname, 'content/studies'));
      const articles = await readMarkdownDir(path.join(import.meta.dirname, 'content/articles'));
      const activeSections = visibleSections({
        projects: DEFAULT_PORTFOLIO_DATA.projects.length,
        experiences: DEFAULT_PORTFOLIO_DATA.experiences.length,
        studies: studies.length,
        certificates: DEFAULT_PORTFOLIO_DATA.certificates.length,
        articles: articles.length
      });

      const { profile, projects, experiences, certificates } = DEFAULT_PORTFOLIO_DATA;
      const routes: PrerenderRoute[] = [];

      for (const section of activeSections) {
        if (section.id === 'projects') {
          routes.push({
            route: '/projetos',
            title: `Projetos · ${profile.name}`,
            description: 'Galeria de projetos em React, TypeScript, Go e engenharia de IA por Pedro Henrique Lopes.',
            bodyHtml: `<main class="seo-only"><h1>Projetos de ${escapeHtml(profile.name)}</h1><ul>${projects
              .map(
                (p) =>
                  `<li><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.tagline)}</p></li>`
              )
              .join('')}</ul></main>`
          });

          for (const project of projects) {
            routes.push({
              route: `/projetos/${project.id}`,
              title: `${project.name} · Projetos · ${profile.name}`,
              description: project.tagline,
              bodyHtml: `<main class="seo-only"><h1>${escapeHtml(project.name)}</h1><p>${escapeHtml(project.tagline)}</p><p>Stack: ${escapeHtml(project.stack.join(', '))}</p></main>`
            });
          }
        }

        if (section.id === 'experience') {
          routes.push({
            route: '/experiencia',
            title: `Experiência e Currículo · ${profile.name}`,
            description: plainText(profile.summary),
            bodyHtml: `<main class="seo-only"><h1>Experiência de ${escapeHtml(profile.name)}</h1><p>${escapeHtml(plainText(profile.summary))}</p><ul>${experiences
              .map(
                (e) =>
                  `<li><h2>${escapeHtml(e.company)}</h2><p>${escapeHtml(e.summary)}</p></li>`
              )
              .join('')}</ul></main>`
          });
        }

        if (section.id === 'studies') {
          routes.push({
            route: '/estudos',
            title: `Estudos e Certificados · ${profile.name}`,
            description: 'Estudos técnicos de performance frontend, Go, arquitetura de IA e carteira de certificações.',
            bodyHtml: `<main class="seo-only"><h1>Estudos de ${escapeHtml(profile.name)}</h1><ul>${studies
              .map(
                (s) =>
                  `<li><h2>${escapeHtml(s.title)}</h2><p>${escapeHtml(s.summary)}</p></li>`
              )
              .join('')}</ul></main>`
          });

          if (certificates.length > 0) {
            routes.push({
              route: '/estudos/certificados',
              title: `Certificados · ${profile.name}`,
              description: 'Carteira de certificações verificáveis de Pedro Henrique Lopes.',
              bodyHtml: `<main class="seo-only"><h1>Certificados de ${escapeHtml(profile.name)}</h1><ul>${certificates
                .map(
                  (c) =>
                    `<li><h2>${escapeHtml(c.title)}</h2><p>${escapeHtml(c.issuer)} (${escapeHtml(c.issuedAt)}) - ${escapeHtml(c.description)}</p></li>`
                )
                .join('')}</ul></main>`
            });
          }

          for (const study of studies) {
            routes.push({
              route: `/estudos/${study.slug}`,
              title: `${study.title} · Estudos · ${profile.name}`,
              description: study.summary,
              bodyHtml: `<main class="seo-only"><article><h1>${escapeHtml(study.title)}</h1><p>${escapeHtml(study.summary)}</p></article></main>`
            });
          }
        }

        if (section.id === 'articles') {
          routes.push({
            route: '/artigos',
            title: `Artigos · ${profile.name}`,
            description: 'Artigos técnicos sobre Design Systems acessíveis, React, TypeScript e arquitetura frontend.',
            bodyHtml: `<main class="seo-only"><h1>Artigos de ${escapeHtml(profile.name)}</h1><ul>${articles
              .map(
                (a) =>
                  `<li><h2>${escapeHtml(a.title)}</h2><p>${escapeHtml(a.summary)}</p></li>`
              )
              .join('')}</ul></main>`
          });

          for (const article of articles) {
            routes.push({
              route: `/artigos/${article.slug}`,
              title: `${article.title} · Artigos · ${profile.name}`,
              description: article.summary,
              bodyHtml: `<main class="seo-only"><article><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.summary)}</p></article></main>`
            });
          }
        }

        if (section.id === 'ai') {
          routes.push({
            route: '/ai',
            title: `AI e Arquivos · ${profile.name}`,
            description: 'Endpoints para agentes de IA e recrutadores: /llms.txt, /cv.json, /cv.md, /sitemap.xml e POST /api/contact.',
            bodyHtml: `<main class="seo-only"><h1>AI e Arquivos de ${escapeHtml(profile.name)}</h1><p>Acesse /llms.txt, /cv.json, /cv.md, /sitemap.xml, /robots.txt e POST /api/contact.</p></main>`
          });
        }
      }

      for (const entry of routes) {
        const targetDir = path.join(clientDir, entry.route.replace(/^\//, ''));
        await fs.mkdir(targetDir, { recursive: true });
        await fs.writeFile(path.join(targetDir, 'index.html'), applyRouteMeta(baseHtml, entry), 'utf8');
      }
    }
  };
}

function serveMarkdownUtf8(): Plugin {
  const docPath = path.resolve(import.meta.dirname, 'docs/decisoes.md');
  let outDir = '';

  return {
    name: 'portfolio-markdown-utf8',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    configureServer(server) {
      server.middlewares.use('/docs/decisoes.md', async (_req, res, next) => {
        try {
          const body = await fs.readFile(docPath, 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.end(body);
        } catch {
          next();
        }
      });
    },
    async closeBundle() {
      if (!outDir || !outDir.endsWith('client')) return;
      try {
        const body = await fs.readFile(docPath, 'utf8');
        const target = path.join(outDir, 'docs');
        await fs.mkdir(target, { recursive: true });
        await fs.writeFile(path.join(target, 'decisoes.md'), body, 'utf8');
      } catch {
        // Ignore if docs/decisoes.md does not exist
      }
    }
  };
}

export default defineConfig({
  plugins: [contentSchemaGuard(), serveMarkdownUtf8(), react(), tailwindcss(), htmlHead(), cloudflare()],
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
    host: '::',
    port: 3000
  }
});
