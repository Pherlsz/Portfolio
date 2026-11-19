import { ARTICLES, STUDIES } from '../content/collections.ts';
import { visibleSections } from '../content/sections.ts';
import {
  availabilityLine,
  CONTACT_API,
  DEFAULT_PORTFOLIO_DATA,
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
    'Disallow: /studio',
    'Disallow: /admin',
    '',
    ...AI_AND_SEARCH_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
    `Sitemap: ${origin}/sitemap.xml`,
    ''
  ].join('\n');
}

export function generateSitemapXml(origin = SITE_ORIGIN): string {
  const sections = visibleSections();
  const paths = new Set<string>([
    '/',
    ...sections.map((section) => section.path),
    '/cv',
    '/cv.md',
    '/cv.json',
    '/llms.txt'
  ]);

  if (sections.some((section) => section.id === 'studies')) {
    if (DEFAULT_PORTFOLIO_DATA.certificates.length > 0) {
      paths.add('/estudos/certificados');
    }
    for (const study of STUDIES) {
      paths.add(`/estudos/${study.slug}`);
    }
  }

  if (sections.some((section) => section.id === 'articles')) {
    for (const article of ARTICLES) {
      paths.add(`/artigos/${article.slug}`);
    }
  }

  const urls = Array.from(paths)
    .map(
      (path) =>
        `  <url><loc>${xmlEscape(`${origin}${path}`)}</loc><lastmod>${PROFILE_UPDATED}</lastmod></url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function generateJsonLdSchema(data: PortfolioData = DEFAULT_PORTFOLIO_DATA): object {
  const { profile, project, featuredProjects } = data;
  const pageUrl = `${SITE_ORIGIN}/`;
  const personId = `${SITE_ORIGIN}/#person`;
  const description = `${profile.headline} ${plainText(profile.summary)}`;
  const sections = visibleSections();

  const projectParts = data.projects?.length
    ? data.projects.map((item) => {
        const site = item.href?.trim();
        const repo = item.repoUrl?.trim();
        const resolvedSite = site
          ? site.startsWith('http')
            ? site
            : `${SITE_ORIGIN}${site}`
          : undefined;
        return {
          '@type': repo ? 'SoftwareSourceCode' : 'WebApplication',
          name: item.name,
          description: item.tagline,
          ...(repo ? { codeRepository: repo } : {}),
          ...(resolvedSite ? { url: resolvedSite } : {}),
          ...(item.language ? { programmingLanguage: item.language } : {})
        };
      })
    : [
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

  const sectionParts = sections.map((section) => ({
    '@type': 'WebPage',
    name: section.label,
    url: `${SITE_ORIGIN}${section.path}`
  }));

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
        hasPart: [...projectParts, ...sectionParts]
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

export function generateLlmsTxt(data: PortfolioData = DEFAULT_PORTFOLIO_DATA, origin = SITE_ORIGIN): string {
  const { profile, project, featuredProjects } = data;
  const sections = visibleSections();

  const sectionItems = sections.map((section) =>
    mdItem(section.label, `${origin}${section.path}`, `Seção ${section.label}`)
  );

  return [
    `# ${profile.name} - ${profile.jobTitle}`,
    '',
    `> ${profile.headline} ${plainText(profile.summary)}`,
    '',
    ...profile.about,
    '',
    '## Páginas e arquivos para IA',
    mdItem('Portfólio (Chat IA)', `${origin}/`, 'Interface conversacional principal'),
    ...sectionItems,
    mdItem('Currículo Markdown', `${origin}/cv.md`, 'Currículo completo em Markdown'),
    mdItem('Currículo JSON Resume', `${origin}/cv.json`, 'Currículo estruturado no padrão JSON Resume'),
    mdItem('Currículo HTML', `${origin}/cv`, 'Versão para impressão A4'),
    mdItem('Currículo PDF', `${origin}${profile.cvUrl}`, 'Download direto em PDF'),
    mdItem('Mapa do site', `${origin}/sitemap.xml`),
    '',
    '## Contato',
    mdItem('E-mail', `mailto:${profile.email}`),
    mdItem('LinkedIn', profile.linkedin),
    mdItem('GitHub', profile.github),
    `- Local: ${profile.location}`,
    `- Status: ${profile.status}`,
    `- ${availabilityLine(profile)}`,
    mdItem('Formulário no site', `${origin}/`),
    mdItem(
      `${CONTACT_API.method} ${CONTACT_API.path}`,
      `${origin}${CONTACT_API.path}`,
      `${CONTACT_API.description} JSON { "name", "email", "message", "source": "agent" }. Campos: name (${CONTACT_API.body.name}); email (${CONTACT_API.body.email}); message (${CONTACT_API.body.message}). Resposta 200: { "ok": true }.`
    ),
    '',
    '## Experiência',
    ...buildExperienceMarkdown(data),
    '## Projetos em destaque (ferramentas e sites)',
    ...(data.projects?.length
      ? data.projects.flatMap((item) => [
          `### ${item.name} (${item.kicker})`,
          item.tagline,
          ...(item.repoUrl ? [mdItem('Repositório', item.repoUrl)] : []),
          ...(item.href
            ? [mdItem('Link', item.href.startsWith('http') ? item.href : `${origin}${item.href}`)]
            : []),
          ...(item.modules?.length
            ? [`- Módulos: ${item.modules.map((m) => `${m.name} (${m.description})`).join('; ')}`]
            : []),
          `- Acesso: ${item.access === 'restricted' ? 'restrito (login)' : 'público'}`,
          `- Stack: ${item.stack.join(', ')}`,
          ''
        ])
      : [
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
          ''
        ]),
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

export function generateCvMarkdown(data: PortfolioData = DEFAULT_PORTFOLIO_DATA, origin = SITE_ORIGIN): string {
  const { profile } = data;
  return [
    `# ${profile.name}`,
    `**${profile.jobTitle}** · ${profile.location}`,
    '',
    `- E-mail: ${profile.email}`,
    `- LinkedIn: ${profile.linkedin}`,
    `- GitHub: ${profile.github}`,
    `- Site: ${origin}`,
    `- Status: ${profile.status} (${availabilityLine(profile)})`,
    '',
    '## Resumo',
    `${profile.headline} ${plainText(profile.summary)}`,
    '',
    ...profile.about,
    '',
    '## Experiência Profissional',
    ...buildExperienceMarkdown(data),
    '## Projetos Relevantes',
    ...data.projects.flatMap((proj) => {
      const link = proj.repoUrl ?? (proj.href ? (proj.href.startsWith('http') ? proj.href : `${origin}${proj.href}`) : '');
      return [
        `### ${proj.name} · ${proj.kicker}`,
        proj.tagline,
        ...(link ? [`- Link: ${link}`] : []),
        ...(proj.modules?.length
          ? [`- Módulos: ${proj.modules.map((m) => `${m.name} (${m.description})`).join('; ')}`]
          : []),
        `- Stack: ${proj.stack.join(', ')}`,
        ''
      ];
    }),
    '## Stack Técnica',
    ...data.skills.map((group) => `- **${group.name}**: ${skillNames(group).join(', ')}`),
    '',
    '## Formação Acadêmica',
    ...data.education.map((edu) => `- **${edu.course}** · ${edu.school} (${edu.period})`),
    '',
    '## Certificados e Cursos',
    ...data.certificates.map((cert) =>
      `- **${cert.title}** · ${cert.issuer} (${cert.issuedAt})${cert.verifyUrl ? ` - ${cert.verifyUrl}` : ''}`
    ),
    `- **Outros cursos**: ${data.otherCourses.join(', ')}`,
    '',
    '## Idiomas',
    ...data.languages.map((lang) => `- **${lang.name}**: ${lang.level}`),
    ''
  ].join('\n');
}

export function generateCvJsonResume(data: PortfolioData = DEFAULT_PORTFOLIO_DATA, origin = SITE_ORIGIN): object {
  const { profile } = data;
  const [city = 'Porto Alegre', region = 'RS'] = profile.location.split(',').map((s) => s.trim());

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: profile.name,
      label: profile.jobTitle,
      email: profile.email,
      url: origin,
      summary: `${profile.headline} ${plainText(profile.summary)}`,
      location: {
        city,
        region,
        countryCode: 'BR'
      },
      profiles: [
        {
          network: 'LinkedIn',
          username: 'pherls',
          url: profile.linkedin
        },
        {
          network: 'GitHub',
          username: 'Pherlsz',
          url: profile.github
        }
      ]
    },
    work: data.experiences.map((exp) => {
      const span = experienceSpan(exp);
      return {
        name: exp.company,
        location: exp.location,
        position: exp.roles[0]?.title ?? 'Software Engineer',
        startDate: span.start,
        endDate: span.end,
        summary: exp.summary,
        highlights: exp.highlights.map((h) => (h.metric ? `${h.metric}: ${h.text}` : h.text)),
        keywords: exp.stack
      };
    }),
    projects: data.projects.map((proj) => {
      const rawUrl = proj.repoUrl ?? proj.href;
      const url = rawUrl
        ? rawUrl.startsWith('http')
          ? rawUrl
          : `${origin}${rawUrl}`
        : origin;
      return {
        name: proj.name,
        description: proj.tagline,
        type: proj.kind,
        url,
        keywords: proj.stack,
        ...(proj.modules?.length
          ? { highlights: proj.modules.map((m) => `${m.name}: ${m.description}`) }
          : {})
      };
    }),
    education: data.education.map((edu) => ({
      institution: edu.school,
      area: edu.course,
      studyType: 'Tecnólogo',
      startDate: '2022-08',
      endDate: '2024-12',
      score: edu.period
    })),
    certificates: data.certificates.map((cert) => ({
      name: cert.title,
      issuer: cert.issuer,
      date: cert.issuedAt,
      ...(cert.verifyUrl ? { url: cert.verifyUrl } : {})
    })),
    skills: data.skills.map((group) => ({
      name: group.name,
      keywords: skillNames(group)
    })),
    languages: data.languages.map((lang) => ({
      language: lang.name,
      fluency: lang.level
    })),
    meta: {
      canonical: `${origin}/cv.json`,
      version: 'v1.0.0',
      lastModified: PROFILE_UPDATED
    }
  };
}

export function generateIndexableHomeHtml(data: PortfolioData = DEFAULT_PORTFOLIO_DATA): string {
  const { profile, project, featuredProjects } = data;
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

  return `<main id="conteudo" class="initial-shell">
      <p class="initial-eyebrow">${escHtml(profile.name)} · ${escHtml(profile.jobTitle)} · ${escHtml(profile.location)}</p>
      <h1 id="inicio-titulo" class="initial-title">O que você quer saber sobre o trabalho do Pedro?</h1>
      <div class="initial-composer" aria-hidden="true"></div>
      <div class="seo-only">
      <section id="inicio">
        <p>${escHtml(profile.status)} · ${escHtml(profile.location)}</p>
        <p>${escHtml(profile.jobTitle)} · React · Next.js · TypeScript</p>
        <p>${escHtml(profile.headline)}</p>
        <p>${escHtml(plainText(profile.summary))}</p>
        <p>
          <a href="${escHtml(profile.cvUrl)}">Baixar CV (PDF)</a>
          <a href="mailto:${escHtml(profile.email)}">${escHtml(profile.email)}</a>
          <a href="${escHtml(profile.linkedin)}">LinkedIn</a>
          <a href="${escHtml(profile.github)}">GitHub</a>
        </p>
      </section>
      <section id="experiencia">
        <h2>Experiência</h2>
        <ul>${experience}</ul>
      </section>
      <section id="projeto">
        <h2>Projetos</h2>
        <ul>${projects}</ul>
      </section>
      <section id="contato">
        <h2>Contato</h2>
        <p>${escHtml(profile.trustCopy)}</p>
        <p>${escHtml(availabilityLine(profile))}</p>
        <ul>
          <li><a href="/llms.txt">/llms.txt</a></li>
          <li><a href="/cv.md">/cv.md</a></li>
          <li><a href="/cv.json">/cv.json</a></li>
          <li><a href="/cv">/cv</a></li>
        </ul>
      </section>
      </div>
    </main>`;
}
