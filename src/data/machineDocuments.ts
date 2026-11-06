import {
  availabilityLine,
  CONTACT_API,
  experienceSpan,
  featuredProjectPrimaryUrl,
  formatPeriod,
  formatRoleTimeline,
  plainText,
  PROFILE_UPDATED,
  SITE_ORIGIN,
  skillNames,
  type PortfolioData
} from './portfolioData.ts';

/** Crawlers que a política do site permite. O WAF da Cloudflare pode bloquear antes deste arquivo. */
const AI_AND_SEARCH_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended'
] as const;

const SITEMAP_PATHS = ['/', '/cv', '/llms.txt'] as const;
const PROFILE_IMAGE_PATH = '/og.png';

function escHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function xmlEscape(value: string): string {
  return escHtml(value).replaceAll("'", '&apos;');
}

function mdItem(label: string, href: string, note?: string): string {
  return note ? `- [${label}](${href}): ${note}` : `- [${label}](${href})`;
}

export function generateRobotsTxt(origin = SITE_ORIGIN): string {
  return [
    '# Política do site: busca e crawlers de IA podem ler o conteúdo público.',
    '# Um 403 na borda (Bot Fight Mode, AI Crawl Control ou WAF) não se resolve aqui.',
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_AND_SEARCH_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
    `Sitemap: ${origin}/sitemap.xml`,
    ''
  ].join('\n');
}

export function generateSitemapXml(origin = SITE_ORIGIN): string {
  const urls = SITEMAP_PATHS.map(
    (path) => `  <url><loc>${xmlEscape(`${origin}${path}`)}</loc><lastmod>${PROFILE_UPDATED}</lastmod></url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function generateJsonLdSchema(data: PortfolioData): object {
  const { profile, project, featuredProjects } = data;
  const pageUrl = `${SITE_ORIGIN}/`;
  const personId = `${SITE_ORIGIN}/#person`;
  const description = `${profile.headline} ${plainText(profile.summary)}`;
  const hasPart = [
    ...featuredProjects.map((item) => {
      const site = item.href?.trim();
      const repo = item.repoUrl?.trim();
      return {
        '@type': repo ? 'SoftwareSourceCode' : site ? 'WebApplication' : 'SoftwareApplication',
        name: item.name,
        description: item.tagline,
        ...(repo ? { codeRepository: repo } : {}),
        ...(site ? { url: site } : {})
      };
    }),
    {
      '@type': 'SoftwareSourceCode',
      name: project.name,
      description: project.tagline,
      codeRepository: project.repoUrl,
      programmingLanguage: project.language
    }
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_ORIGIN}/#profilepage`,
        url: pageUrl,
        dateModified: PROFILE_UPDATED,
        mainEntity: {
          '@type': 'Person',
          '@id': personId,
          name: profile.name,
          alternateName: profile.shortName,
          url: pageUrl,
          image: {
            '@type': 'ImageObject',
            url: `${SITE_ORIGIN}${PROFILE_IMAGE_PATH}`,
            width: 1200,
            height: 630
          },
          email: `mailto:${profile.email}`,
          jobTitle: profile.jobTitle,
          description,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Porto Alegre',
            addressRegion: 'RS',
            addressCountry: 'BR'
          },
          sameAs: [profile.linkedin, profile.github],
          alumniOf: data.education.map((e) => ({ '@type': 'EducationalOrganization', name: e.school })),
          knowsAbout: data.skills.flatMap(skillNames),
          knowsLanguage: data.languages.map((l) => l.code),
          hasCredential: data.certifications.map((cert) => ({
            '@type': 'EducationalOccupationalCredential',
            name: cert.name,
            recognizedBy: { '@type': 'Organization', name: cert.issuer },
            dateCreated: cert.year,
            ...(cert.href ? { url: cert.href } : {})
          }))
        },
        hasPart
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: pageUrl,
        name: `${profile.name} · ${profile.jobTitle}`,
        description,
        inLanguage: 'pt-BR',
        publisher: { '@id': personId }
      }
    ]
  };
}

function buildExperienceMarkdown(data: PortfolioData): string[] {
  return data.experiences.flatMap((exp) => {
    const span = experienceSpan(exp);
    return [
      `### ${exp.company} (${formatPeriod(span.start, span.end)})`,
      `${formatRoleTimeline(exp)} · ${exp.location}`,
      '',
      exp.summary,
      ...exp.highlights.map((h) => `- ${h.metric ? `${h.metric}: ` : ''}${h.text}`),
      `- Stack: ${exp.stack.join(', ')}`,
      ''
    ];
  });
}

export function generateLlmsTxt(data: PortfolioData, origin = SITE_ORIGIN): string {
  const { profile, project, featuredProjects } = data;
  return [
    `# ${profile.name} - ${profile.jobTitle}`,
    '',
    `> ${profile.headline} ${plainText(profile.summary)}`,
    '',
    ...profile.about,
    '',
    '## Páginas',
    mdItem('Portfólio', `${origin}/`, 'Página principal'),
    mdItem('Currículo HTML', `${origin}/cv`, 'Versão para impressão'),
    mdItem('Currículo PDF', `${origin}${profile.cvUrl}`, 'Download direto'),
    mdItem('Mapa do site', `${origin}/sitemap.xml`),
    '',
    '## Contato',
    mdItem('E-mail', `mailto:${profile.email}`),
    mdItem('LinkedIn', profile.linkedin),
    mdItem('GitHub', profile.github),
    `- Local: ${profile.location}`,
    `- Status: ${profile.status}`,
    `- ${availabilityLine(profile)}`,
    mdItem('Formulário no site', `${origin}/#contato`),
    mdItem(
      `${CONTACT_API.method} ${CONTACT_API.path}`,
      `${origin}${CONTACT_API.path}`,
      `${CONTACT_API.description} JSON { "name", "email", "message", "source": "agent" }. Campos: name (${CONTACT_API.body.name}); email (${CONTACT_API.body.email}); message (${CONTACT_API.body.message}). Resposta 200: { "ok": true }.`
    ),
    '',
    '## Experiência',
    ...buildExperienceMarkdown(data),
    '## Projetos em destaque (ferramentas e sites)',
    ...featuredProjects.flatMap((item) => [
      `### ${item.name}`,
      item.tagline,
      ...(item.repoUrl ? [mdItem('Repositório', item.repoUrl)] : []),
      ...(item.href ? [mdItem('App', item.href)] : []),
      `- Acesso: ${item.access === 'restricted' ? 'restrito (login)' : 'público'}`,
      `- Stack: ${item.stack.join(', ')}`,
      ''
    ]),
    `## Outro projeto: ${project.name} (${project.language})`,
    project.tagline,
    mdItem('Repositório', project.repoUrl),
    `- Módulos: ${project.modules.map((m) => `${m.name} (${m.description})`).join('; ')}`,
    '',
    '## Habilidades',
    ...data.skills.map((group) => `- ${group.name}: ${skillNames(group).join(', ')}`),
    '',
    '## Formação',
    ...data.education.map((e) => `- ${e.course}, ${e.school} (${e.period})`),
    '',
    '## Certificações',
    ...data.certifications.map((c) =>
      c.href ? mdItem(`${c.name} - ${c.issuer} (${c.year})`, c.href) : `- ${c.name} - ${c.issuer} (${c.year})`
    ),
    `- Outros cursos: ${data.otherCourses.join(', ')}`,
    '',
    '## Idiomas',
    ...data.languages.map((l) => `- ${l.name}: ${l.level}`)
  ].join('\n');
}

/** Resumo no HTML inicial. O React substitui `#root` quando o JavaScript roda. */
export function generateIndexableHomeHtml(data: PortfolioData): string {
  const { profile, project, featuredProjects } = data;
  const name = profile.name
    .split(' ')
    .map((word) => `<span class="block">${escHtml(word)}</span>`)
    .join('');
  const experience = data.experiences
    .map((exp) => {
      const span = experienceSpan(exp);
      return `<li><strong>${escHtml(exp.company)}</strong> - ${escHtml(formatRoleTimeline(exp))} (${escHtml(formatPeriod(span.start, span.end))}). ${escHtml(exp.summary)}</li>`;
    })
    .join('');
  const projects = [
    ...featuredProjects.map((item) => {
      const primary = featuredProjectPrimaryUrl(item);
      const title = escHtml(item.name);
      const body = escHtml(item.tagline);
      return primary
        ? `<li><a class="link" href="${escHtml(primary)}">${title}</a> - ${body}</li>`
        : `<li><strong>${title}</strong> - ${body}</li>`;
    }),
    `<li><a class="link" href="${escHtml(project.repoUrl)}">${escHtml(project.name)}</a> - ${escHtml(project.tagline)}</li>`
  ].join('');

  return `<main id="conteudo" class="seo-only">
      <section id="inicio" class="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <p class="eyebrow inline-flex flex-wrap items-center gap-x-2 gap-y-1">${escHtml(profile.status)}<span class="hidden sm:inline" aria-hidden="true">·</span><span class="whitespace-nowrap basis-full sm:basis-auto">${escHtml(profile.location)}</span></p>
        <h1 id="inicio-titulo" class="display-wide mt-6 text-[clamp(2.6rem,7.4vw,4.6rem)] uppercase leading-[0.9]">${name}</h1>
        <p class="mt-5 font-mono text-[0.9375rem] text-ink-soft"><span class="block">${escHtml(profile.jobTitle)}</span><span class="mt-1 block text-muted">React · Next.js · TypeScript</span></p>
        <p class="mt-7 max-w-xl text-[clamp(1.25rem,2.1vw,1.55rem)] font-semibold leading-snug">${escHtml(profile.headline)}</p>
        <p class="mt-4 max-w-xl text-ink-soft">${escHtml(plainText(profile.summary))}</p>
        <p class="mt-6 flex flex-wrap gap-x-3 gap-y-1">
          <a class="link" href="${escHtml(profile.cvUrl)}">Baixar CV (PDF)</a>
          <a class="link" href="mailto:${escHtml(profile.email)}">${escHtml(profile.email)}</a>
          <a class="link" href="${escHtml(profile.linkedin)}">LinkedIn</a>
          <a class="link" href="${escHtml(profile.github)}">GitHub</a>
        </p>
      </section>
      <section id="experiencia" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Experiência</h2>
        <ul class="mt-4 max-w-3xl list-disc space-y-3 pl-4 text-ink-soft">${experience}</ul>
      </section>
      <section id="projeto" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Projetos</h2>
        <ul class="mt-4 max-w-3xl list-disc space-y-3 pl-4 text-ink-soft">${projects}</ul>
      </section>
      <section id="contato" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Contato</h2>
        <p class="mt-4 max-w-3xl text-ink-soft">${escHtml(profile.trustCopy)}</p>
        <p class="mt-4 max-w-3xl text-ink-soft">${escHtml(availabilityLine(profile))}</p>
        <ul class="mt-4 list-disc space-y-3 pl-4">
          <li><a class="link" href="/llms.txt">/llms.txt</a></li>
          <li><a class="link" href="/cv">/cv</a></li>
        </ul>
      </section>
    </main>`;
}
