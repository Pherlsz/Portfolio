import {
  availabilityLine,
  CONTACT_API,
  experienceSpan,
  featuredProjectLinks,
  formatDuration,
  formatMonth,
  formatPeriod,
  formatRoleTimeline,
  plainText,
  PROFILE_UPDATED,
  SITE_ORIGIN,
  skillNames,
  type PortfolioData
} from './portfolioData.ts';

const AI_AND_SEARCH_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'Google-Extended',
  'GoogleOther',
  'Applebot-Extended',
  'Amazonbot',
  'Meta-ExternalAgent',
  'DuckAssistBot',
  'YouBot',
  'Cohere-ai',
  'MistralAI-User'
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

function buildEnglishSummary(data: PortfolioData): string {
  const { profile, experiences } = data;
  const atlas = experiences.find((exp) => exp.id === 'atlas');
  const atlasSpan = atlas ? experienceSpan(atlas) : { start: '2021-03', end: '2026-07' };
  return [
    `Frontend Software Engineer (${profile.seniority}) based in ${profile.location}, open to remote roles or hybrid/on-site work in Porto Alegre.`,
    `Over 4 years of production experience at Atlas Governance (${formatPeriod(atlasSpan.start, atlasSpan.end)}, ${formatDuration(atlasSpan.start, atlasSpan.end)}) building React, Next.js, and TypeScript applications, WCAG 2.1 AA Design System components (30+), virtualized lists (5,000+ rows with TanStack Virtual), LLM interfaces, and C#/.NET Core services, plus open-source projects in Go.`
  ].join(' ');
}

export function generateRobotsTxt(origin = SITE_ORIGIN): string {
  return [
    '# Política do site: busca e crawlers de IA podem ler o conteúdo público.',
    `# LLMs: ${origin}/llms.txt`,
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

export function generateJsonLdSchema(data: PortfolioData, origin = SITE_ORIGIN): object {
  const { profile, project, featuredProjects } = data;
  const pageUrl = `${origin}/`;
  const personId = `${origin}/#person`;
  const description = `${profile.headline} ${plainText(profile.summary)}`;
  const allSkills = data.skills.flatMap(skillNames);

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
        '@id': `${origin}/#profilepage`,
        url: pageUrl,
        dateModified: PROFILE_UPDATED,
        inLanguage: 'pt-BR',
        mainEntity: {
          '@type': 'Person',
          '@id': personId,
          name: profile.name,
          alternateName: profile.shortName,
          url: pageUrl,
          image: {
            '@type': 'ImageObject',
            url: `${origin}${PROFILE_IMAGE_PATH}`,
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
          hasOccupation: {
            '@type': 'Occupation',
            name: profile.jobTitle,
            description,
            occupationLocation: {
              '@type': 'City',
              name: profile.location
            },
            skills: allSkills
          },
          worksFor: data.experiences.flatMap((exp) =>
            exp.roles.map((role) => ({
              '@type': 'OrganizationRole',
              roleName: role.title,
              startDate: role.start,
              endDate: role.end,
              worksFor: {
                '@type': 'Organization',
                name: exp.company,
                location: exp.location
              }
            }))
          ),
          alumniOf: data.education.map((e) => ({ '@type': 'EducationalOrganization', name: e.school })),
          knowsAbout: allSkills,
          knowsLanguage: data.languages.map((l) => ({
            '@type': 'Language',
            name: l.name,
            alternateName: l.code,
            description: l.level
          })),
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
        '@id': `${origin}/#website`,
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
      `### ${exp.company} (${formatPeriod(span.start, span.end)} · ${formatDuration(span.start, span.end)})`,
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
    '## Summary (English)',
    buildEnglishSummary(data),
    '',
    '## Sobre',
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
    '## Projetos',
    ...featuredProjects.flatMap((item) => [
      `### ${item.name}`,
      item.tagline,
      ...(item.repoUrl ? [mdItem('Repositório', item.repoUrl)] : []),
      ...(item.href ? [mdItem('App', item.href)] : []),
      `- Acesso: ${item.access === 'restricted' ? 'restrito (login)' : 'público'}`,
      `- Stack: ${item.stack.join(', ')}`,
      ''
    ]),
    `### ${project.name} (${project.language})`,
    project.tagline,
    mdItem('Repositório', project.repoUrl),
    `- Módulos: ${project.modules.map((m) => `${m.name} (${m.description})`).join('; ')}`,
    '',
    '## Stack',
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

export function generateIndexableHomeHtml(data: PortfolioData): string {
  const { profile, project, featuredProjects } = data;
  const name = profile.name
    .split(' ')
    .map((word) => `<span class="block">${escHtml(word)}</span>`)
    .join('');

  const experience = data.experiences
    .map((exp) => {
      const span = experienceSpan(exp);
      const duration = formatDuration(span.start, span.end);
      const rolesHtml = exp.roles
        .map(
          (role) =>
            `<li>${escHtml(role.title)} (<time datetime="${escHtml(role.start)}">${escHtml(formatMonth(role.start))}</time> - <time datetime="${escHtml(role.end)}">${escHtml(formatMonth(role.end))}</time>)</li>`
        )
        .join('');
      const highlightsHtml = exp.highlights
        .map((h) =>
          h.metric
            ? `<li><strong>${escHtml(h.metric)}:</strong> ${escHtml(h.text)}</li>`
            : `<li>${escHtml(h.text)}</li>`
        )
        .join('');
      return `<article class="mt-6 border-t border-line pt-4">
        <h3 class="text-lg font-semibold">${escHtml(exp.company)}</h3>
        <p class="font-mono text-xs text-muted"><time datetime="${escHtml(span.start)}">${escHtml(formatMonth(span.start))}</time> - <time datetime="${escHtml(span.end)}">${escHtml(formatMonth(span.end))}</time> · ${escHtml(duration)} · ${escHtml(exp.location)}</p>
        <ul class="mt-2 list-disc pl-4 text-sm text-ink-soft">${rolesHtml}</ul>
        <p class="mt-2 text-ink-soft">${escHtml(exp.summary)}</p>
        <ul class="mt-2 list-disc space-y-1 pl-4 text-ink-soft">${highlightsHtml}</ul>
        <p class="mt-2 font-mono text-xs text-muted">Stack: ${escHtml(exp.stack.join(', '))}</p>
      </article>`;
    })
    .join('');

  const featuredHtml = featuredProjects
    .map((item) => {
      const links = featuredProjectLinks(item)
        .map((l) => `<a class="link" href="${escHtml(l.href)}">${l.kind === 'repo' ? 'GitHub' : 'Ver app'}</a>`)
        .join(' · ');
      return `<article class="mt-4">
        <h3 class="text-lg font-semibold">${escHtml(item.name)}</h3>
        <p class="text-ink-soft">${escHtml(item.tagline)}</p>
        <p class="mt-1 font-mono text-xs text-muted">Stack: ${escHtml(item.stack.join(', '))}</p>
        ${links ? `<p class="mt-1">${links}</p>` : ''}
      </article>`;
    })
    .join('');

  const coreModulesHtml = project.modules
    .map(
      (mod) =>
        `<div><dt class="font-mono text-xs font-bold">${escHtml(mod.name)}</dt><dd class="text-sm text-ink-soft">${escHtml(mod.description)}</dd></div>`
    )
    .join('');

  const skillsHtml = data.skills
    .map(
      (group) =>
        `<li><strong>${escHtml(group.name)}:</strong> ${escHtml(skillNames(group).join(', '))}</li>`
    )
    .join('');

  const educationHtml = data.education
    .map((e) => `<li>${escHtml(e.course)} - ${escHtml(e.school)} (${escHtml(e.period)})</li>`)
    .join('');

  const certificationsHtml = data.certifications
    .map((c) => {
      const label = `${escHtml(c.name)} - ${escHtml(c.issuer)} (${escHtml(c.year)})`;
      return c.href ? `<li><a class="link" href="${escHtml(c.href)}">${label}</a></li>` : `<li>${label}</li>`;
    })
    .join('');

  const languagesHtml = data.languages
    .map((l) => `<li><strong>${escHtml(l.name)}</strong> (${escHtml(l.code)}): ${escHtml(l.level)}</li>`)
    .join('');

  const aboutHtml = profile.about
    .map((paragraph) => `<p class="mt-4 max-w-3xl text-ink-soft">${escHtml(paragraph)}</p>`)
    .join('');

  return `<main id="conteudo" class="seo-only">
      <section id="inicio" class="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <p class="eyebrow inline-flex flex-wrap items-center gap-x-2 gap-y-1">${escHtml(profile.status)}<span class="hidden sm:inline" aria-hidden="true">·</span><span class="whitespace-nowrap basis-full sm:basis-auto">${escHtml(profile.location)}</span></p>
        <h1 id="inicio-titulo" class="display-wide mt-6 text-[clamp(2.6rem,7.4vw,4.6rem)] uppercase leading-[0.9]">${name}</h1>
        <p class="mt-5 font-mono text-[0.9375rem] text-ink-soft"><span class="block">${escHtml(profile.jobTitle)}</span><span class="mt-1 block text-muted">React · Next.js · TypeScript</span></p>
        <p class="mt-7 max-w-xl text-[clamp(1.25rem,2.1vw,1.55rem)] font-semibold leading-snug">${escHtml(profile.headline)}</p>
        <p class="mt-4 max-w-xl text-ink-soft">${escHtml(plainText(profile.summary))}</p>
        <p class="mt-6 flex flex-wrap gap-x-3 gap-y-1">
          <a class="link" href="${escHtml(profile.cvUrl)}">Baixar CV (PDF)</a>
          <a class="link" href="/cv">Currículo HTML (/cv)</a>
          <a class="link" href="/llms.txt">Perfil para IA (/llms.txt)</a>
          <a class="link" href="mailto:${escHtml(profile.email)}">${escHtml(profile.email)}</a>
          <a class="link" href="${escHtml(profile.linkedin)}">LinkedIn</a>
          <a class="link" href="${escHtml(profile.github)}">GitHub</a>
        </p>
      </section>
      <section id="experiencia" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Experiência</h2>
        <div class="mt-4 max-w-3xl">${experience}</div>
      </section>
      <section id="projeto" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Projetos</h2>
        <div class="mt-4 max-w-3xl">
          ${featuredHtml}
          <article class="mt-6 border-t border-line pt-4">
            <h3 class="text-lg font-semibold">${escHtml(project.name)} (${escHtml(project.language)})</h3>
            <p class="text-ink-soft">${escHtml(project.tagline)}</p>
            <p class="mt-1"><a class="link" href="${escHtml(project.repoUrl)}">GitHub: ${escHtml(project.name)}</a></p>
            <dl class="mt-3 grid gap-2 sm:grid-cols-2">${coreModulesHtml}</dl>
          </article>
        </div>
      </section>
      <section id="formacao" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Formação e stack</h2>
        <h3 class="mt-6 text-lg font-semibold">Stack</h3>
        <ul class="mt-2 max-w-3xl list-disc space-y-2 pl-4 text-ink-soft">${skillsHtml}</ul>
        <h3 class="mt-6 text-lg font-semibold">Formação</h3>
        <ul class="mt-2 max-w-3xl list-disc space-y-2 pl-4 text-ink-soft">${educationHtml}</ul>
        <h3 class="mt-6 text-lg font-semibold">Certificações e cursos</h3>
        <ul class="mt-2 max-w-3xl list-disc space-y-2 pl-4 text-ink-soft">${certificationsHtml}<li>Outros cursos: ${escHtml(data.otherCourses.join(', '))}</li></ul>
        <h3 class="mt-6 text-lg font-semibold">Idiomas</h3>
        <ul class="mt-2 max-w-3xl list-disc space-y-2 pl-4 text-ink-soft">${languagesHtml}</ul>
      </section>
      <section id="sobre" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Sobre</h2>
        ${aboutHtml}
      </section>
      <section id="contato" class="mx-auto max-w-6xl border-t border-line px-5 py-16 sm:px-8">
        <h2 class="display text-2xl sm:text-3xl">Contato</h2>
        <p class="mt-4 max-w-3xl text-ink-soft">${escHtml(profile.trustCopy)}</p>
        <p class="mt-4 max-w-3xl text-ink-soft">${escHtml(availabilityLine(profile))}</p>
        <ul class="mt-4 list-disc space-y-2 pl-4">
          <li><a class="link" href="/llms.txt">/llms.txt</a></li>
          <li><a class="link" href="/cv">/cv</a></li>
          <li><a class="link" href="${escHtml(profile.cvUrl)}">CV PDF</a></li>
          <li><a class="link" href="/robots.txt">/robots.txt</a></li>
          <li><a class="link" href="/sitemap.xml">/sitemap.xml</a></li>
        </ul>
      </section>
    </main>`;
}
