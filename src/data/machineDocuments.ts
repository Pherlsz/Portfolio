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

const SITEMAP_PATHS = ['/', '/cv', '/llms.txt', '/ai.json', '/pedro.md', '/AGENTS.md', '/resume.json'] as const;
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
      programmingLanguage: project.language,
      version: project.version
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
    `# ${profile.name} — ${profile.jobTitle}`,
    '',
    `> ${profile.headline} ${plainText(profile.summary)}`,
    '',
    '## Páginas',
    mdItem('Portfólio', `${origin}/`, 'Página principal'),
    mdItem('Currículo HTML', `${origin}/cv`, 'Versão para impressão'),
    mdItem('Currículo PDF', `${origin}${profile.cvUrl}`, 'Download direto'),
    mdItem('ai.json', `${origin}/ai.json`, 'Perfil estruturado para agentes'),
    mdItem('pedro.md', `${origin}/pedro.md`, 'Perfil em Markdown'),
    mdItem('AGENTS.md', `${origin}/AGENTS.md`, 'Como agentes devem ler este site e enviar contato'),
    mdItem('resume.json', `${origin}/resume.json`, 'Currículo em JSON'),
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
    `## Outro projeto: ${project.name} (${project.language}, ${project.version})`,
    project.tagline,
    mdItem('Repositório', project.repoUrl),
    mdItem('Releases', project.releasesUrl, project.releasesPeriod),
    ...project.cards.map((card) => `- ${card.title}: ${card.text}`),
    `- Pacotes: ${project.modules.map((m) => `${m.name} (${m.description})`).join('; ')}`,
    '',
    '## Habilidades',
    ...data.skills.map((group) => `- ${group.name}: ${skillNames(group).join(', ')}`),
    '',
    '## Formação',
    ...data.education.map((e) => `- ${e.course}, ${e.school} (${e.period})`),
    '',
    '## Certificações',
    ...data.certifications.map((c) =>
      c.href ? mdItem(`${c.name} — ${c.issuer} (${c.year})`, c.href) : `- ${c.name} — ${c.issuer} (${c.year})`
    ),
    `- Outros cursos: ${data.otherCourses.join(', ')}`,
    '',
    '## Idiomas',
    ...data.languages.map((l) => `- ${l.name}: ${l.level}`),
    '',
    '## Bastidores',
    ...data.interests.map((i) => `- ${i.title}: ${i.text}`),
    ...data.pets.map((p) => `- ${p.name} (${p.kind}): ${p.bio}`)
  ].join('\n');
}

export function generatePedroMd(data: PortfolioData, origin = SITE_ORIGIN): string {
  const { profile, project, featuredProjects } = data;
  return [
    `# ${profile.name}`,
    '',
    `> Status: publicado. Gerado dos dados públicos do portfólio em ${origin}/ (revisão ${PROFILE_UPDATED}). Não é rascunho.`,
    '',
    `**${profile.jobTitle}** · ${profile.location}`,
    '',
    profile.headline,
    '',
    plainText(profile.summary),
    '',
    ...profile.about,
    '',
    `- Status profissional: ${profile.status}`,
    `- ${availabilityLine(profile)}`,
    '',
    '## Experiência',
    ...buildExperienceMarkdown(data),
    '## Projetos',
    ...featuredProjects.flatMap((item) => [
      `### ${item.name}`,
      item.tagline,
      ...(item.href ? [`- App: ${item.href}`] : []),
      ...(item.repoUrl ? [`- Repositório: ${item.repoUrl}`] : []),
      `- Stack: ${item.stack.join(', ')}`,
      ''
    ]),
    `### ${project.name}`,
    `${project.tagline} (${project.language}, ${project.version})`,
    `- Repositório: ${project.repoUrl}`,
    '',
    '## Formação e certificações',
    ...data.education.map((item) => `- ${item.course}, ${item.school} (${item.period})`),
    ...data.certifications.map((item) => `- ${item.name}, ${item.issuer} (${item.year})`),
    '',
    '## Habilidades',
    ...data.skills.map((group) => `- ${group.name}: ${skillNames(group).join(', ')}`),
    '',
    '## Idiomas',
    ...data.languages.map((item) => `- ${item.name}: ${item.level}`),
    '',
    '## Contato',
    `- E-mail: ${profile.email}`,
    `- LinkedIn: ${profile.linkedin}`,
    `- GitHub: ${profile.github}`,
    `- CV em PDF: ${origin}${profile.cvUrl}`,
    '',
    '## Outros arquivos',
    `- ${origin}/llms.txt`,
    `- ${origin}/ai.json`,
    `- ${origin}/resume.json`,
    `- ${origin}/AGENTS.md`,
    ''
  ].join('\n');
}

export function generateAgentsMd(origin = SITE_ORIGIN): string {
  return [
    '# Instruções para agentes',
    '',
    `> Status: publicado. Instruções estáveis para quem lê ${origin}/ (revisão ${PROFILE_UPDATED}). Não é rascunho.`,
    '',
    'Este site é o portfólio público de Pedro Henrique Lopes, Software Engineer · Frontend.',
    '',
    '## O que ler',
    '',
    `- [llms.txt](${origin}/llms.txt) — perfil longo em texto, formato llmstxt.org.`,
    `- [pedro.md](${origin}/pedro.md) — o mesmo perfil em Markdown.`,
    `- [resume.json](${origin}/resume.json) — currículo em JSON (campos no espírito do JSON Resume).`,
    `- [ai.json](${origin}/ai.json) — perfil estruturado, contato de API e JSON-LD.`,
    `- [sitemap.xml](${origin}/sitemap.xml) — URLs públicas.`,
    '',
    'Prefira esses arquivos ao HTML da página. A home é uma SPA: sem JavaScript o primeiro byte traz um resumo; o restante da interface só aparece depois do bundle.',
    '',
    '## Fatos',
    '',
    'Use somente o que estiver nestes arquivos ou na página. Não invente métricas, datas, senioridade, formato de trabalho, pretensão salarial ou disponibilidade.',
    '',
    '## Contato',
    '',
    `Pessoas e agentes enviam recado com \`${CONTACT_API.method} ${origin}${CONTACT_API.path}\`.`,
    `\`Content-Type: ${CONTACT_API.contentType}\`.`,
    '',
    '```json',
    '{',
    '  "name": "Nome do remetente",',
    '  "email": "remetente@dominio.com",',
    '  "message": "O que o remetente pediu para dizer.",',
    '  "source": "agent"',
    '}',
    '```',
    '',
    `${CONTACT_API.description} Campos: name (${CONTACT_API.body.name}); email (${CONTACT_API.body.email}); message (${CONTACT_API.body.message}); source (${CONTACT_API.body.source}).`,
    'Resposta de sucesso: `200` com `{ "ok": true }`.',
    '',
    'Não escreva em nome do Pedro e não complete a mensagem com fatos que o remetente não pediu.',
    '',
    '## O que não fazer',
    '',
    '- Não trate HTML de um caminho desconhecido como documento. Fora da lista acima, a resposta pode ser o shell da SPA.',
    '- Não contorne Cloudflare, autenticação ou limite de taxa.',
    '- Não envie várias mensagens de contato para testar o endpoint.',
    ''
  ].join('\n');
}

function yearSpan(period: string): { startDate?: string; endDate?: string } {
  const years = period.match(/\d{4}/g) ?? [];
  if (!years[0]) return {};
  return { startDate: years[0], endDate: years[1] ?? years[0] };
}

export function generateResumeJson(data: PortfolioData, origin = SITE_ORIGIN) {
  const { profile, project, featuredProjects } = data;
  return {
    meta: {
      canonical: `${origin}/resume.json`,
      dateModified: PROFILE_UPDATED,
      note: 'Publicado. Currículo gerado dos dados públicos do portfólio, com campos no espírito do JSON Resume (basics, work, education, skills, languages, certificates, projects). Não é um arquivo editado à parte nem um rascunho.'
    },
    basics: {
      name: profile.name,
      label: profile.jobTitle,
      image: `${SITE_ORIGIN}/og.png`,
      email: profile.email,
      url: `${origin}/`,
      summary: `${profile.headline} ${plainText(profile.summary)}`,
      location: {
        city: 'Porto Alegre',
        region: 'RS',
        countryCode: 'BR'
      },
      profiles: [
        { network: 'LinkedIn', url: profile.linkedin },
        { network: 'GitHub', username: 'Pherlsz', url: profile.github }
      ]
    },
    work: data.experiences.flatMap((exp) =>
      exp.roles.map((role, index) => ({
        name: exp.company,
        location: exp.location,
        position: role.title,
        startDate: role.start,
        endDate: role.end,
        ...(index === 0
          ? {
              summary: exp.summary,
              highlights: exp.highlights.map((item) => (item.metric ? `${item.metric}: ${item.text}` : item.text))
            }
          : {})
      }))
    ),
    education: data.education.map((item) => ({
      institution: item.school,
      area: item.course,
      ...yearSpan(item.period)
    })),
    skills: data.skills.map((group) => ({
      name: group.name,
      keywords: skillNames(group)
    })),
    languages: data.languages.map((item) => ({
      language: item.name,
      fluency: item.level
    })),
    certificates: data.certifications.map((item) => ({
      name: item.name,
      issuer: item.issuer,
      date: item.year,
      ...(item.href ? { url: item.href } : {})
    })),
    projects: [
      ...featuredProjects.map((item) => ({
        name: item.name,
        description: item.tagline,
        ...(item.href?.trim() ? { url: item.href.trim() } : {}),
        ...(item.repoUrl?.trim() ? { codeRepository: item.repoUrl.trim() } : {}),
        keywords: item.stack
      })),
      {
        name: project.name,
        description: project.tagline,
        url: project.repoUrl,
        keywords: [project.language, project.version]
      }
    ]
  };
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
      return `<li><strong>${escHtml(exp.company)}</strong> — ${escHtml(formatRoleTimeline(exp))} (${escHtml(formatPeriod(span.start, span.end))}). ${escHtml(exp.summary)}</li>`;
    })
    .join('');
  const projects = [
    ...featuredProjects.map((item) => {
      const primary = featuredProjectPrimaryUrl(item);
      const title = escHtml(item.name);
      const body = escHtml(item.tagline);
      return primary
        ? `<li><a class="link" href="${escHtml(primary)}">${title}</a> — ${body}</li>`
        : `<li><strong>${title}</strong> — ${body}</li>`;
    }),
    `<li><a class="link" href="${escHtml(project.repoUrl)}">${escHtml(project.name)}</a> — ${escHtml(project.tagline)}</li>`
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
          <li><a class="link" href="/ai.json">/ai.json</a></li>
          <li><a class="link" href="/pedro.md">/pedro.md</a></li>
          <li><a class="link" href="/AGENTS.md">/AGENTS.md</a></li>
          <li><a class="link" href="/resume.json">/resume.json</a></li>
          <li><a class="link" href="/cv">/cv</a></li>
        </ul>
      </section>
    </main>`;
}
