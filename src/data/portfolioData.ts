import {
  featuredProjectLlmsMdItems,
  featuredProjectSchemaOrg
} from '../utils/featuredProjectLinks.ts';

export interface Highlight {
  metric?: string;
  text: string;
}

export interface Role {
  title: string;
  /** YYYY-MM */
  start: string;
  /** YYYY-MM */
  end: string;
}

export interface Experience {
  id: string;
  company: string;
  location: string;
  summary: string;
  roles: Role[];
  highlights: Highlight[];
  stack: string[];
}

export interface Project {
  name: string;
  tagline: string;
  repoUrl: string;
  releasesUrl: string;
  language: string;
  version: string;
  spec: string;
  releases: { count: number; period: string };
  license: string;
  modules: { name: string; description: string }[];
  cards: { title: string; text: string }[];
}

export interface FeaturedProject {
  id: string;
  name: string;
  kicker: string;
  tagline: string;
  /** App em produção. Omita quando não houver site público. */
  href?: string;
  /** Repositório no GitHub. Omita quando o código não for público. */
  repoUrl?: string;
  access: 'public' | 'restricted';
  stack: string[];
  image: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
  href?: string;
  image?: string;
  badge: { code: string; caption: string; shape: 'hexagon' | 'circle'; color: string };
}

export interface Education {
  course: string;
  school: string;
  period: string;
}

export interface Language {
  name: string;
  code: string;
  level: string;
}

export interface SkillGroup {
  name: string;
  /** Aparecem como selos com logo; o resto fica em texto corrido. */
  featured: string[];
  items: string[];
}

export interface Pet {
  id: string;
  name: string;
  kind: 'gata' | 'gato';
  bio: string;
}

export interface Interest {
  id: string;
  title: string;
  text: string;
}

export interface PortfolioData {
  profile: {
    name: string;
    shortName: string;
    role: string;
    jobTitle: string;
    headline: string;
    /** Trechos entre ==sinais== aparecem com marca-texto. */
    summary: string;
    /** Copy de confiança / senioridade (Hero e Contato). */
    trustCopy: string;
    status: string;
    location: string;
    seniority: string;
    workMode: string;
    salary: string;
    email: string;
    linkedin: string;
    github: string;
    cvUrl: string;
    about: string[];
  };
  experiences: Experience[];
  featuredProjects: FeaturedProject[];
  project: Project;
  skills: SkillGroup[];
  education: Education[];
  certifications: Certification[];
  otherCourses: string[];
  languages: Language[];
  pets: Pet[];
  interests: Interest[];
}

export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  profile: {
    name: 'Pedro Henrique Lopes',
    shortName: 'Pedro Lopes',
    role: 'Frontend Engineer',
    jobTitle: 'Software Engineer · Frontend',
    headline: 'Transformo fluxos complexos em interfaces rápidas, acessíveis e fáceis de manter.',
    summary:
      'Cerca de 5 anos em produção com React, Next.js e TypeScript: um design system com ==30+ componentes WCAG 2.1 AA==, listas com ==5.000+ registros== sem travar e IA integrada a fluxos reais de negócio.',
    trustCopy:
      'São cerca de 5 anos construindo front-end em produção, de estágio a júnior, usando IA no dia a dia para entregar mais e melhor. Estou aberto a vagas pleno quando houver fit.',
    status: 'Aberto a oportunidades',
    location: 'Rio Grande do Sul, Brasil',
    seniority: 'Júnior/Pleno',
    workMode: 'Remoto, ou híbrido/presencial em Porto Alegre',
    salary: 'A combinar',
    email: 'phpherls@gmail.com',
    linkedin: 'https://www.linkedin.com/in/pherls/',
    github: 'https://github.com/Pherlsz',
    cvUrl: '/cv/Pedro-Henrique-Lopes-CV.pdf',
    about: [
      'Engenheiro de software com foco em frontend. Comecei em suporte e no monitoramento de sistemas de alta disponibilidade; essa experiência orienta o modo como construo interfaces: estáveis, observáveis e fáceis de manter.',
      'Participo de gincanas no Rio Grande do Sul, no Setor de Diversas. Parte dos projetos pessoais nasceu desse contexto. Treino com regularidade, jogo RPG e convivo com três gatos.'
    ]
  },
  experiences: [
    {
      id: 'atlas',
      company: 'Atlas Governance',
      location: 'Brasil',
      summary:
        'Plataforma de governança corporativa. Entrei como estagiário e segui como Software Engineer, com foco no frontend do Atlas PLG e do Atlas Sign, em design system e em integração de IA.',
      roles: [
        { title: 'Software Engineer', start: '2021-11', end: '2026-07' },
        { title: 'Estagiário em Engenharia de Software', start: '2021-03', end: '2021-11' }
      ],
      highlights: [
        {
          metric: '30+ componentes',
          text: 'Arquitetei o frontend da plataforma Atlas PLG com React, Next.js e TypeScript e criei um design system modular em conformidade com WCAG 2.1 AA.'
        },
        {
          metric: '5.000+ registros',
          text: 'Estabilizei as listagens do Atlas Sign (assinatura digital) com virtualização de DOM (TanStack Virtual) e code splitting, eliminando gargalos de renderização.'
        },
        {
          metric: '10.000+ usuários',
          text: 'Estruturei a navegação em árvore e os fluxos críticos de assinatura eletrônica, com Error Boundaries e testes em Vitest e React Testing Library.'
        },
        {
          metric: 'LLMs em produção',
          text: 'Integrei modelos de IA aos fluxos de negócio com function calling e tool calling, via APIs REST em Python e C#/.NET Core.'
        },
        {
          metric: '1.000+ templates',
          text: 'Refatorei o serviço de mensageria em C#/.NET Core, consolidando templates de e-mail legados em modelos parametrizados, com Docker e CI/CD no Azure DevOps.'
        },
        {
          metric: '15+ fluxos',
          text: 'No estágio, criei uma biblioteca de componentes com Styled Components e Context API que acelerou o desenvolvimento de fluxos corporativos.'
        },
        {
          text: 'Separei o estado de servidor do estado de interface com TanStack Query (cache e deduplicação), Zustand e Context API, eliminando requisições redundantes.'
        },
        {
          text: 'Corrigi falhas de frontend e de integração com análise de causa raiz no Azure DevOps, aplicando o OWASP Top 10 contra XSS.'
        }
      ],
      stack: [
        'React',
        'Next.js',
        'TypeScript',
        'TanStack Query',
        'TanStack Virtual',
        'Zustand',
        'Vitest',
        'React Testing Library',
        'Python',
        'C# / .NET Core',
        'Docker',
        'Azure DevOps'
      ]
    },
    {
      id: 'nelogica',
      company: 'Nelogica',
      location: 'Porto Alegre, RS',
      summary: 'Plataformas de negociação do mercado financeiro, operando com alta disponibilidade.',
      roles: [{ title: 'Analista de Operações de TI (NOC)', start: '2019-08', end: '2020-09' }],
      highlights: [
        {
          text: 'Monitorei plataformas de negociação e sistemas transacionais com Grafana, Zabbix e Kibana, antecipando oscilações de latência e degradação de serviço.'
        },
        {
          text: 'Fiz diagnóstico de causa raiz e escalonei incidentes críticos com os times de engenharia e infraestrutura, ajudando a reduzir o MTTR.'
        },
        {
          text: 'Montei dashboards operacionais, limites de telemetria e fluxos de alerta para acompanhar a saúde da produção em tempo real.'
        }
      ],
      stack: ['Grafana', 'Zabbix', 'Kibana']
    },
    {
      id: 'lebes',
      company: 'Lojas Lebes',
      location: 'Eldorado do Sul, RS',
      summary: 'Sistemas corporativos (ERP e CRM) de uma rede varejista do Rio Grande do Sul.',
      roles: [{ title: 'Analista de Suporte a Sistemas', start: '2018-02', end: '2019-08' }],
      highlights: [
        {
          text: 'Sustentei ambientes de missão crítica (ERP e CRM), garantindo a continuidade operacional e a integridade dos dados.'
        },
        {
          text: 'Analisei a causa raiz de falhas em servidores, integrações e rotinas de comunicação, reduzindo o tempo de indisponibilidade.'
        },
        { text: 'Validei correções e homologuei melhorias junto aos times de TI e engenharia.' }
      ],
      stack: ['ERP', 'CRM']
    }
  ],
  featuredProjects: [
    {
      id: 'gymkhana-database',
      name: 'Gymkhana Database',
      kicker: 'Aplicação web',
      tagline:
        'Cadastro de pessoas, contas e documentos. Assistente de IA para busca e correlação de documentos com as tarefas. Tabela no estilo Excel, com fórmulas e filtros avançados.',
      repoUrl: 'https://github.com/Pherlsz/Gymkhana-Database',
      access: 'public',
      stack: ['React', 'TypeScript', 'Ant Design', 'Go'],
      image: '/projects/gymkhana-database-assistente.webp'
    }
  ],
  project: {
    name: 'Gymkhana Core',
    tagline:
      'Uma base em Go, independente de linguagem e de provedor, para normalizar dados brasileiros, extrair informações de documentos e orquestrar modelos de IA.',
    repoUrl: 'https://github.com/Pherlsz/Gymkhana-Core',
    releasesUrl: 'https://github.com/Pherlsz/Gymkhana-Core/releases',
    language: 'Go',
    version: 'v0.7.0',
    spec: 'Core Spec 0.4',
    releases: { count: 9, period: 'de julho a agosto de 2026' },
    license: 'Código público para leitura, licença proprietária.',
    cards: [
      {
        title: 'Contexto',
        text: 'Nasceu da operação de gincanas no Setor de Diversas: padronizar pessoas, documentos e endereços para consulta rápida.'
      },
      {
        title: 'Especificação primeiro',
        text: 'As regras ficam em spec/. Casos de teste em JSON garantem o mesmo resultado em qualquer linguagem.'
      },
      {
        title: 'Assistente independente de provedor',
        text: 'Tools, RAG e troca de modelo sem acoplamento ao SDK de um único fornecedor.'
      }
    ],
    modules: [
      {
        name: 'normalize',
        description: 'Texto, nomes, endereços, CPF, CNPJ alfanumérico, CEP, e-mail e telefone em E.164.'
      },
      { name: 'civiltime', description: 'Datas civis e ano-mês sem fuso horário, com parsing estrito.' },
      {
        name: 'fingerprint',
        description: 'Impressões SHA-256 determinísticas, com separação por domínio.'
      },
      {
        name: 'portablejson',
        description: 'JSON estrito e um JSON Schema portátil para validar saídas estruturadas.'
      },
      {
        name: 'assistant',
        description: 'Assistente multimodal independente de provedor: tools, RAG, roteamento e chave própria.'
      },
      {
        name: 'ocr',
        description: 'Extração de documentos guiada por schema, com evidências e revisão humana.'
      }
    ]
  },
  skills: [
    {
      name: 'Frontend',
      featured: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
      items: [
        'JavaScript (ES6+)',
        'HTML e CSS',
        'Styled Components',
        'Design Systems',
        'Acessibilidade (WCAG 2.1 AA)',
        'Webpack'
      ]
    },
    {
      name: 'Estado e dados',
      featured: ['TanStack Query', 'Redux'],
      items: ['TanStack Virtual', 'Zustand', 'Context API']
    },
    {
      name: 'Backend e IA',
      featured: ['Python', 'Go', 'Node.js', '.NET'],
      items: ['C#', 'APIs REST', 'LLMs (function e tool calling)', 'SQL']
    },
    {
      name: 'Qualidade e DevOps',
      featured: ['Vitest', 'Docker', 'GitHub Actions'],
      items: ['Jest', 'React Testing Library', 'Git', 'Azure DevOps', 'Microsoft Azure', 'OWASP Top 10']
    }
  ],
  education: [
    {
      course: 'Tecnólogo em Análise e Desenvolvimento de Sistemas',
      school: 'Estácio',
      period: '2022 – 2024'
    }
  ],
  certifications: [
    {
      name: 'Microsoft Certified: Azure Fundamentals',
      issuer: 'Microsoft',
      year: '2021',
      href: 'https://www.credly.com/users/pherls/badges',
      image: '/badges/azure-fundamentals.webp',
      badge: { code: 'AZ-900', caption: 'Fundamentals', shape: 'hexagon', color: 'var(--poster)' }
    },
    {
      name: 'Azure Cloud Computing Professional Bootcamp',
      issuer: 'IGTI',
      year: '2021',
      badge: { code: 'IGTI', caption: 'Bootcamp', shape: 'circle', color: 'var(--poster)' }
    }
  ],
  otherCourses: ['Zabbix Foundation', 'Container Fundamentals', 'DevOps Essentials', 'Technical Support Fundamentals'],
  languages: [
    { name: 'Português', code: 'pt-BR', level: 'Nativo' },
    { name: 'Inglês', code: 'en', level: 'Intermediário, com leitura e escrita técnica' },
    { name: 'Espanhol', code: 'es', level: 'Intermediário' }
  ],
  pets: [
    {
      id: 'morcega',
      name: 'Morcega',
      kind: 'gata',
      bio: 'A mais velha. Calma e observadora; costuma ficar por perto enquanto trabalho.'
    },
    {
      id: 'banguela',
      name: 'Banguela',
      kind: 'gata',
      bio: 'A menor das três. Independente e discreta.'
    },
    {
      id: 'tomada',
      name: 'Tomada',
      kind: 'gato',
      bio: 'O mais novo. Inquieto, circula o escritório o tempo todo.'
    }
  ],
  interests: [
    {
      id: 'gincana',
      title: 'Gincanas do RS',
      text: 'Participo de gincanas no Rio Grande do Sul, no Setor de Diversas: localização de pessoas, documentos e informações com prazo curto.'
    },
    {
      id: 'treino',
      title: 'Academia',
      text: 'Musculação cinco a seis vezes por semana.'
    },
    {
      id: 'jogos',
      title: 'RPG e jogos',
      text: 'RPG de mesa, Baldur’s Gate 3, Dota 2 e Cities: Skylines.'
    },
    { id: 'cafe', title: 'Café', text: 'Café filtrado, diariamente.' }
  ]
};

export function skillNames(group: SkillGroup): string[] {
  return [...group.featured, ...group.items];
}

export function plainText(text: string): string {
  return text.replace(/==(.+?)==/g, '$1');
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatPeriod(start: string, end: string): string {
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

/** Duração inclusiva, no mesmo formato do LinkedIn ("5 anos e 5 meses"). */
export function formatDuration(start: string, end: string): string {
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? 'mês' : 'meses'}`);
  return parts.join(' e ');
}

export function experienceSpan(experience: Experience): { start: string; end: string } {
  const starts = experience.roles.map((r) => r.start).sort();
  const ends = experience.roles.map((r) => r.end).sort();
  return { start: starts[0], end: ends[ends.length - 1] };
}

/** Cargos com a data de cada um, para não parecer que o estágio durou o período inteiro. */
export function formatRoleTimeline(experience: Experience): string {
  const dated = (role: Role) => `${role.title} (${formatPeriod(role.start, role.end)})`;
  if (experience.roles.length === 1) return dated(experience.roles[0]);
  const [latest, ...earlier] = experience.roles;
  return `${dated(latest)}; antes, ${earlier.map(dated).join('; ')}`;
}

export function availabilityLine(profile: PortfolioData['profile']): string {
  return `Senioridade ${profile.seniority}. ${profile.workMode}. Pretensão salarial: ${profile.salary}.`;
}

export const CONTACT_API = {
  path: '/api/contact',
  method: 'POST',
  contentType: 'application/json',
  description:
    'Aceita recados de pessoas e de agentes de IA. Não invente o conteúdo: envie só o que o remetente pediu para dizer.',
  body: {
    name: 'string, 2 a 80 caracteres',
    email: 'string, e-mail válido do remetente',
    message: 'string, 10 a 2000 caracteres',
    source: '"form" | "agent" (opcional; use agent se você for um modelo)'
  }
} as const;

export const SITE_ORIGIN = 'https://pherls.dev';
export const PROFILE_IMAGE_PATH = '/og.png';
/** Revisão pública do perfil. Atualize quando os fatos do currículo mudarem. */
export const PROFILE_UPDATED = '2026-10-15';

export function generateJsonLdSchema(data: PortfolioData): object {
  const { profile, project, featuredProjects } = data;
  const pageUrl = `${SITE_ORIGIN}/`;
  const personId = `${SITE_ORIGIN}/#person`;
  const description = `${profile.headline} ${plainText(profile.summary)}`;
  const hasPart = [
    ...featuredProjects.map((item) => featuredProjectSchemaOrg(item)),
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
        name: `${profile.name} · ${profile.role}`,
        description,
        inLanguage: 'pt-BR',
        publisher: { '@id': personId }
      }
    ]
  };
}

function mdItem(label: string, href: string, note?: string): string {
  return note ? `- [${label}](${href}): ${note}` : `- [${label}](${href})`;
}

export function generateLlmsTxt(data: PortfolioData, origin = SITE_ORIGIN): string {
  const { profile, project, featuredProjects } = data;
  const lines = [
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
    `- Senioridade: ${profile.seniority}`,
    `- Formato: ${profile.workMode}`,
    `- Pretensão salarial: ${profile.salary}`,
    mdItem('Formulário no site', `${origin}/#contato`),
    mdItem(
      `${CONTACT_API.method} ${CONTACT_API.path}`,
      `${origin}${CONTACT_API.path}`,
      `${CONTACT_API.description} JSON { "name", "email", "message", "source": "agent" }. Campos: name (${CONTACT_API.body.name}); email (${CONTACT_API.body.email}); message (${CONTACT_API.body.message}). Resposta 200: { "ok": true }.`
    ),
    '',
    '## Experiência',
    ...data.experiences.flatMap((exp) => {
      const span = experienceSpan(exp);
      return [
        `### ${exp.company} (${formatPeriod(span.start, span.end)})`,
        exp.summary,
        ...exp.roles.map((role) => `- Cargo: ${role.title} (${formatPeriod(role.start, role.end)})`),
        ...exp.highlights.map((h) => `- ${h.metric ? `${h.metric}: ` : ''}${h.text}`),
        `- Stack: ${exp.stack.join(', ')}`,
        ''
      ];
    }),
    '## Projetos em destaque (ferramentas e sites)',
    ...featuredProjects.flatMap((item) => [
      `### ${item.name}`,
      item.tagline,
      ...featuredProjectLlmsMdItems(item, mdItem),
      `- Acesso: ${item.access === 'restricted' ? 'restrito (login)' : 'público'}`,
      `- Stack: ${item.stack.join(', ')}`,
      ''
    ]),
    `## Outro projeto: ${project.name} (${project.language}, ${project.version})`,
    project.tagline,
    mdItem('Repositório', project.repoUrl),
    mdItem('Releases', project.releasesUrl, `${project.releases.count}, ${project.releases.period}`),
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
  ];
  return lines.join('\n');
}
