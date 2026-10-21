interface Highlight {
  metric?: string;
  text: string;
}

interface Role {
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

interface Project {
  name: string;
  tagline: string;
  repoUrl: string;
  releasesUrl: string;
  language: string;
  version: string;
  spec: string;
  releasesPeriod: string;
  license: string;
  modules: { name: string; description: string }[];
  cards: { title: string; text: string }[];
}

export interface FeaturedProject {
  id: string;
  name: string;
  kicker: string;
  tagline: string;
  /** Live app URL. Omit when there is no public site. */
  href?: string;
  /** GitHub repository URL. Omit when the code is not public. */
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
  /** Aparecem como selos com logo; o resto fica em texto corrido. */
  featured: string[];
  items: string[];
}

interface Pet {
  id: string;
  name: string;
  kind: 'gata' | 'gato';
  bio: string;
}

interface Interest {
  id: string;
  title: string;
  text: string;
}

export interface PortfolioData {
  profile: {
    name: string;
    shortName: string;
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
    jobTitle: 'Software Engineer · Frontend',
    headline: 'Transformo fluxos complexos em interfaces rápidas, acessíveis e fáceis de manter.',
    summary:
      'Cerca de 5 anos em produção com React, Next.js e TypeScript: um design system com ==30+ componentes WCAG 2.1 AA==, listas com ==5.000+ registros== sem travar e interfaces de chat de IA.',
    trustCopy:
      'São cerca de 5 anos construindo front-end em produção, de estágio a júnior, usando IA no dia a dia para entregar mais e melhor. Estou aberto a vagas pleno quando houver fit.',
    status: 'Aberto a oportunidades',
    location: 'Porto Alegre, RS',
    seniority: 'Júnior/Pleno',
    workMode: 'Remoto, ou híbrido/presencial em Porto Alegre',
    salary: 'A combinar',
    email: 'phpherls@gmail.com',
    linkedin: 'https://www.linkedin.com/in/pherls/',
    github: 'https://github.com/Pherlsz',
    cvUrl: '/cv/Pedro-Henrique-Lopes-CV.pdf',
    about: [
      'Gosto de construir interfaces previsíveis, bem tipadas e fáceis de evoluir em time: componentes reutilizáveis com acessibilidade real, separação clara entre estado de servidor e de UI e cobertura de testes nos fluxos críticos.',
      'Participo de gincanas no RS, no Setor de Diversas. Parte dos projetos pessoais nasceu desse contexto. Treino com regularidade, jogo RPG e convivo com três gatos.'
    ]
  },
  experiences: [
    {
      id: 'atlas',
      company: 'Atlas Governance',
      location: 'Brasil',
      summary:
        'Plataforma de governança corporativa. Atuei no frontend do Atlas PLG e do Atlas Sign como Software Engineer, com design system e interfaces do chat de IA, após período de estágio.',
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
          metric: 'Chat de IA',
          text: 'Criei as interfaces visuais do chat da IA e suas funcionalidades no frontend da plataforma, consumindo APIs REST em Python e C#/.NET Core.'
        },
        {
          metric: '1.000+ templates',
          text: 'Refatorei os templates de e-mail no serviço de mensageria em C#/.NET Core, consolidando modelos legados em templates parametrizados.'
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
        'JavaScript (ES6+)',
        'HTML e CSS',
        'Tailwind CSS',
        'Styled Components',
        'Webpack',
        'TanStack Query',
        'TanStack Virtual',
        'Zustand',
        'Context API',
        'Vitest',
        'React Testing Library',
        'Python',
        'C# / .NET Core',
        'SQL',
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
      summary: 'Sistemas corporativos (ERP e CRM) de uma rede varejista gaúcha.',
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
    releasesPeriod: 'de julho a agosto de 2026',
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
      text: 'Participo de gincanas no RS, no Setor de Diversas: localização de pessoas, documentos e informações com prazo curto.'
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
/** Revisão pública do perfil. Atualize quando os fatos do currículo mudarem. */
export const PROFILE_UPDATED = '2026-10-18';

/** Normaliza texto para comparação insensível a acentos, caixa e pontuação de borda. */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Extrai o conteúdo entre aspas ou crases (`"..."`, `'...'`, `“...”`, `` `...` ``). */
export function extractQuotedText(text: string): string {
  return Array.from(text.matchAll(/["'“”`]+([^"'“”`\n]{2,120})["'“”`]+/g), (match) => match[1]).join(' ');
}

/** Verifica se `needle` ocorre como palavra/termo inteiro dentro de `haystack` (ambos normalizados com `foldText`). */
export function hasWholeWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9#+.])${escaped}(?:$|[^a-z0-9#+.])`, 'i').test(haystack);
}

export interface FeaturedProjectResolvedLink {
  kind: 'repo' | 'live';
  href: string;
}

/** Links públicos disponíveis para um projeto em destaque (`repoUrl` e/ou `href`). */
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

export { generateJsonLdSchema, generateLlmsTxt } from './machineDocuments.ts';
