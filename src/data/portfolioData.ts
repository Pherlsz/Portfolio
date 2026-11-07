interface Highlight {
  metric?: string;
  text: string;
}

interface Role {
  title: string;
  start: string;
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

interface Project {
  name: string;
  tagline: string;
  repoUrl: string;
  language: string;
  modules: { name: string; description: string }[];
}

export interface FeaturedProject {
  id: string;
  name: string;
  kicker: string;
  tagline: string;
  href?: string;
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

interface Education {
  course: string;
  school: string;
  period: string;
}

interface Language {
  name: string;
  code: string;
  level: string;
}

interface SkillGroup {
  name: string;
  featured: string[];
  items: string[];
}

export interface PortfolioData {
  profile: {
    name: string;
    shortName: string;
    jobTitle: string;
    headline: string;
    summary: string;
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
}

export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  profile: {
    name: 'Pedro Henrique Lopes',
    shortName: 'Pedro Lopes',
    jobTitle: 'Software Engineer · Frontend',
    headline: 'Mais de 4 anos desenvolvendo aplicações web em produção com React, Next.js e TypeScript.',
    summary:
      'Experiência prática em Design Systems (==30+ componentes WCAG 2.1 AA==), virtualização de listagens com ==5.000+ registros== e interfaces para recursos com LLMs, além de manutenção de serviços em C#/.NET Core.',
    trustCopy:
      'Busco vagas Pleno em frontend (remoto ou em Porto Alegre), também aberto a contribuir em APIs e backend.',
    status: 'Aberto a oportunidades',
    location: 'Porto Alegre, RS',
    seniority: 'Pleno',
    workMode: 'Remoto, ou híbrido/presencial em Porto Alegre',
    salary: 'A combinar',
    email: 'phpherls@gmail.com',
    linkedin: 'https://www.linkedin.com/in/pherls/',
    github: 'https://github.com/Pherlsz',
    cvUrl: '/cv/Pedro-Henrique-Lopes-CV.pdf',
    about: [
      'Comecei trabalhando com suporte técnico e monitoramento de sistemas críticos (NOC). Acompanhar ambientes de produção de perto me deu uma boa base para investigar incidentes, ler logs e achar a causa raiz antes de mexer no código.',
      'Na transição para engenharia de software, evoluí do estágio a Software Engineer ao longo de mais de quatro anos atuando principalmente com React, Next.js e TypeScript, criando componentes de Design System, melhorando a performance de telas pesadas, construindo interfaces para recursos de IA e dando manutenção em serviços em C#/.NET Core.',
      'Me adapto rápido a projetos em andamento e gosto de pegar problemas em que preciso aprender algo novo. Meu foco é frontend, mas também escrevo backend e APIs em .NET e Go quando faz sentido para o time.'
    ]
  },
  experiences: [
    {
      id: 'atlas',
      company: 'Atlas Governance',
      location: 'Brasil',
      summary:
        'Desenvolvimento do portal de governança corporativa com React, Next.js e TypeScript: componentes do Design System, otimização de telas com grandes volumes de dados, interfaces para recursos com LLMs e manutenção de serviços em C#/.NET Core.',
      roles: [
        { title: 'Software Engineer', start: '2021-11', end: '2026-07' },
        { title: 'Estágio em Engenharia de Software', start: '2021-03', end: '2021-11' }
      ],
      highlights: [
        {
          metric: '30+ componentes',
          text: 'Primitivos e componentes do Design System no Atlas PLG (React, Next.js e TypeScript), seguindo critérios de acessibilidade WCAG 2.1 Level AA e atuando em discussões técnicas com o time de arquitetura.'
        },
        {
          metric: '5.000+ registros',
          text: 'Virtualização do DOM (TanStack Virtual) e code splitting no módulo Atlas Sign, resolvendo travamentos e layout thrashing em listagens grandes.'
        },
        {
          metric: '10.000+ usuários',
          text: 'Navegação em árvore e fluxos de assinatura eletrônica com Error Boundaries e testes automatizados (Vitest, Jest e React Testing Library).'
        },
        {
          metric: 'Interfaces de IA',
          text: 'Chat interativo e telas de relatórios integrados a modelos de linguagem (LLMs) em produção.'
        },
        {
          metric: '1.000+ templates',
          text: 'Refatoração do serviço de envio de e-mails em C#/.NET Core e APIs REST, unificando templates legados com Docker e pipelines no Azure DevOps.'
        },
        {
          metric: '15+ fluxos',
          text: 'Biblioteca de componentes com Styled Components e Context API compartilhada entre módulos da plataforma.'
        },
        {
          text: 'Organização de estado e cache de requisições com TanStack Query, Zustand e Context API, reduzindo chamadas repetidas à API.'
        },
        {
          text: 'Configuração e otimização de build frontend com Webpack e Vite para modularização de bundles, compatibilidade cross-browser e responsividade.'
        },
        {
          text: 'Investigação de bugs em produção entre frontend e APIs (RCA) e correção de falhas de segurança e sanitização de inputs (OWASP Top 10 / XSS).'
        }
      ],
      stack: [
        'React',
        'Next.js',
        'TypeScript',
        'JavaScript (ES6+)',
        'HTML e CSS',
        'Tailwind CSS',
        'Styled Components',
        'Vite',
        'Webpack',
        'TanStack Query',
        'TanStack Virtual',
        'Zustand',
        'Context API',
        'Vitest',
        'Jest',
        'React Testing Library',
        'C# / .NET Core',
        'APIs REST',
        'SQL',
        'Git',
        'Docker',
        'Azure DevOps'
      ]
    },
    {
      id: 'nelogica',
      company: 'Nelogica',
      location: 'Porto Alegre, RS',
      summary:
        'Monitoramento de plataformas de negociação financeira e resposta a incidentes em ambiente de produção.',
      roles: [{ title: 'Analista de Operações de TI (NOC)', start: '2019-08', end: '2020-09' }],
      highlights: [
        {
          text: 'Acompanhamento de plataformas de negociação e serviços transacionais com Grafana, Zabbix e Kibana para identificar quedas e picos de latência.'
        },
        {
          text: 'Investigação de incidentes via análise de causa raiz (RCA), contenção de falhas e acionamento dos times de Engenharia e Infraestrutura para reduzir o tempo médio de recuperação (MTTR).'
        },
        {
          text: 'Criação de dashboards e ajuste de alertas para acompanhar a saúde dos serviços em tempo real.'
        }
      ],
      stack: ['Grafana', 'Zabbix', 'Kibana']
    },
    {
      id: 'lebes',
      company: 'Lojas Lebes',
      location: 'Eldorado do Sul, RS',
      summary:
        'Suporte técnico e sustentação de sistemas internos (ERP e CRM) das lojas e da matriz.',
      roles: [{ title: 'Analista de Suporte a Sistemas', start: '2018-02', end: '2019-08' }],
      highlights: [
        {
          text: 'Sustentação de rotinas de ERP e CRM no dia a dia da operação.'
        },
        {
          text: 'Diagnóstico de falhas em servidores, integrações entre sistemas e rotinas de comunicação.'
        },
        {
          text: 'Validação de correções e conferência de dados junto às equipes de TI e desenvolvimento.'
        }
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
        'Sistema web para organizar dados, contas e documentos, com planilha no estilo Excel (fórmulas e filtros) e assistente de IA para busca.',
      repoUrl: 'https://github.com/Pherlsz/Gymkhana-Database',
      access: 'public',
      stack: ['React', 'TypeScript', 'Vite', 'Ant Design', 'Go', 'GitHub Actions'],
      image: '/projects/gymkhana-database-assistente.webp'
    }
  ],
  project: {
    name: 'Gymkhana Core',
    tagline:
      'Biblioteca em Go para padronização de dados, extração de texto de documentos e integração com modelos de IA.',
    repoUrl: 'https://github.com/Pherlsz/Gymkhana-Core',
    language: 'Go',
    modules: [
      {
        name: 'normalize',
        description: 'Padronização de nomes, documentos, endereços e contatos.'
      },
      {
        name: 'civiltime',
        description: 'Datas e períodos sem dependência de fuso horário.'
      },
      {
        name: 'fingerprint',
        description: 'Hashes determinísticos para evitar registros duplicados.'
      },
      {
        name: 'portablejson',
        description: 'Validação de JSON e schemas.'
      },
      {
        name: 'assistant',
        description: 'Chamadas a modelos de IA com suporte a tools e RAG.'
      },
      {
        name: 'ocr',
        description: 'Extração de dados a partir de documentos.'
      }
    ]
  },
  skills: [
    {
      name: 'Frontend',
      featured: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      items: [
        'JavaScript (ES6+)',
        'HTML e CSS',
        'Styled Components',
        'Design Systems',
        'Acessibilidade (WCAG 2.1 AA)',
        'Web Performance',
        'Vite',
        'Webpack'
      ]
    },
    {
      name: 'Estado e dados',
      featured: ['TanStack Query', 'Zustand'],
      items: ['TanStack Virtual', 'Context API']
    },
    {
      name: 'Backend e IA',
      featured: ['.NET', 'Go'],
      items: ['C#', 'APIs REST', 'Interfaces para IA (LLMs)', 'SQL']
    },
    {
      name: 'Qualidade e DevOps',
      featured: ['Vitest', 'Docker', 'GitHub Actions'],
      items: [
        'React Testing Library',
        'Jest',
        'Git',
        'Azure DevOps',
        'Microsoft Azure',
        'OWASP Top 10',
        'Grafana',
        'Zabbix'
      ]
    }
  ],
  education: [
    {
      course: 'Tecnólogo em Análise e Desenvolvimento de Sistemas',
      school: 'Estácio',
      period: 'ago 2022 – dez 2024'
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

export function formatRoleTimeline(experience: Experience): string {
  const dated = (role: Role) => `${role.title} (${formatPeriod(role.start, role.end)})`;
  if (experience.roles.length === 1) return dated(experience.roles[0]);
  const [latest, ...earlier] = experience.roles;
  return `${dated(latest)}; antes, ${earlier.map(dated).join('; ')}`;
}

export function availabilityLine(profile: PortfolioData['profile']): string {
  return `Senioridade ${profile.seniority}. ${profile.workMode}. Pretensão salarial: ${profile.salary}.`;
}

export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 120 },
  message: { min: 10, max: 2000 }
} as const;

export const CONTACT_API = {
  path: '/api/contact',
  method: 'POST',
  contentType: 'application/json',
  description:
    'Aceita recados de pessoas e de agentes de IA. Não invente o conteúdo: envie só o que o remetente pediu para dizer.',
  body: {
    name: `string, ${CONTACT_LIMITS.name.min} a ${CONTACT_LIMITS.name.max} caracteres`,
    email: 'string, e-mail válido do remetente',
    message: `string, ${CONTACT_LIMITS.message.min} a ${CONTACT_LIMITS.message.max} caracteres`,
    source: '"form" | "agent" (opcional; use agent se você for um modelo)'
  }
} as const;

export const SITE_ORIGIN = 'https://pherls.dev';
export const PROFILE_UPDATED = '2026-11-06';

export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function hasWholeWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9#+.])${escaped}(?:$|[^a-z0-9#+.])`, 'i').test(haystack);
}

interface FeaturedProjectResolvedLink {
  kind: 'repo' | 'live';
  href: string;
}

export function featuredProjectLinks(project: Pick<FeaturedProject, 'repoUrl' | 'href'>): FeaturedProjectResolvedLink[] {
  const out: FeaturedProjectResolvedLink[] = [];
  const repo = project.repoUrl?.trim();
  const live = project.href?.trim();
  if (repo) out.push({ kind: 'repo', href: repo });
  if (live && live !== repo) out.push({ kind: 'live', href: live });
  return out;
}

export function featuredProjectPrimaryUrl(project: Pick<FeaturedProject, 'repoUrl' | 'href'>): string | undefined {
  return featuredProjectLinks(project)[0]?.href;
}

