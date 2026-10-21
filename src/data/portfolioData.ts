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
      'Mais de 4 anos desenvolvendo e evoluindo aplicações web em produção com React, Next.js e TypeScript: contribuição em Design System com ==30+ componentes (WCAG 2.1 AA)==, listagens com ==5.000+ registros== virtualizadas e interfaces para funcionalidades baseadas em LLMs.',
    trustCopy:
      'Mais de 4 anos construindo frontend em produção, de estágio a júnior, com foco em componentização, performance, testes automatizados e interfaces para produtos com IA. Aberto a vagas pleno quando houver fit.',
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
      'Minha atuação combina desenvolvimento frontend, componentização, performance e qualidade de software: criação de primitivos e componentes reutilizáveis com acessibilidade (WCAG 2.1 AA), organização de estado e dados com TanStack Query e Zustand, cobertura de testes em fluxos críticos e interfaces para funcionalidades baseadas em LLMs.',
      'Participo de gincanas no RS, no Setor de Diversas. Parte dos projetos pessoais nasceu desse contexto. Treino com regularidade, jogo RPG e convivo com três gatos.'
    ]
  },
  experiences: [
    {
      id: 'atlas',
      company: 'Atlas Governance',
      location: 'Brasil',
      summary:
        'Atuação no desenvolvimento e na evolução de aplicações web em produção, com foco em React, Next.js e TypeScript. Experiência em componentização, construção de componentes reutilizáveis, otimização de performance, gerenciamento de estado e dados e implementação de testes automatizados. Atuação complementar em backend com C#/.NET Core e em interfaces para funcionalidades baseadas em modelos de linguagem (LLMs).',
      roles: [
        { title: 'Software Engineer', start: '2021-11', end: '2026-07' },
        { title: 'Estágio em Engenharia de Software', start: '2021-03', end: '2021-11' }
      ],
      highlights: [
        {
          metric: '30+ componentes',
          text: 'Fui um dos responsáveis pela criação de primitivos e componentes customizados do Design System da plataforma Atlas PLG com React, Next.js e TypeScript, promovendo padronização visual, acessibilidade (WCAG 2.1 Level AA) e participando de discussões técnicas com o time de arquitetura.'
        },
        {
          metric: '5.000+ registros',
          text: 'Otimizei a performance de listagens com mais de 5.000 registros no módulo Atlas Sign, utilizando virtualização do DOM com TanStack Virtual (@tanstack/react-virtual) e code splitting para reduzir gargalos de renderização e layout thrashing.'
        },
        {
          metric: '10.000+ usuários',
          text: 'Desenvolvi módulos de navegação em árvore e fluxos críticos de assinatura eletrônica em uma plataforma com mais de 10.000 usuários ativos, incorporando Error Boundaries e testes automatizados com Vitest e React Testing Library.'
        },
        {
          metric: 'Interfaces de IA',
          text: 'Desenvolvi as interfaces de funcionalidades baseadas em modelos de linguagem (LLMs) em produção, incluindo um chat e a exibição de relatórios gerados por IA.'
        },
        {
          metric: '1.000+ templates',
          text: 'Refatorei o serviço de mensageria corporativa em C#/.NET Core, consolidando mais de 1.000 templates legados de e-mail em modelos parametrizados e utilizando Docker e esteiras de CI/CD no Azure DevOps.'
        },
        {
          metric: '15+ fluxos',
          text: 'No estágio, criei uma biblioteca padronizada de componentes reutilizáveis com Styled Components e Context API, reduzindo redundâncias de código e o tempo de desenvolvimento em mais de 15 fluxos corporativos.'
        },
        {
          text: 'Aprimorei o gerenciamento de dados e estados da interface com TanStack Query, Zustand e Context API, utilizando cache e deduplicação de requisições para reduzir chamadas redundantes à rede e organizar o estado das aplicações.'
        },
        {
          text: 'No estágio, desenvolvi e mantive interfaces corporativas e serviços transacionais com React, TypeScript e C#/.NET Core, contribuindo para a estabilidade operacional e a manutenção das regras de negócio em produção.'
        },
        {
          text: 'Diagnostiquei e corrigi falhas nas camadas de frontend e na integração entre serviços com análise de causa raiz (RCA) e Azure DevOps, aplicando práticas alinhadas ao OWASP Top 10 na prevenção de XSS e sanitização segura de dados de entrada.'
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
        'C# / .NET Core',
        'SQL',
        'Docker',
        'Azure DevOps'
      ]
    },
    {
      id: 'nelogica',
      company: 'Nelogica',
      location: 'Porto Alegre, RS',
      summary:
        'Atuação em operações de TI e monitoramento de sistemas transacionais de alta disponibilidade, com foco em observabilidade, diagnóstico de incidentes e continuidade dos ambientes de produção.',
      roles: [{ title: 'Analista de Operações de TI (NOC)', start: '2019-08', end: '2020-09' }],
      highlights: [
        {
          text: 'Monitorei plataformas de negociação financeira e sistemas transacionais utilizando Grafana, Zabbix e Kibana, identificando sinais de degradação de serviços e oscilações de latência.'
        },
        {
          text: 'Investiguei incidentes operacionais por meio de análise de causa raiz, atuando na contenção de falhas e no escalonamento de incidentes críticos para os times de Engenharia de Software e Infraestrutura, com foco na redução do tempo médio de recuperação (MTTR).'
        },
        {
          text: 'Desenvolvi dashboards operacionais e configurei limites de telemetria e alertas para acompanhar a saúde dos sistemas em tempo real, apoiando a identificação de anomalias e a continuidade dos ambientes de produção.'
        }
      ],
      stack: ['Grafana', 'Zabbix', 'Kibana']
    },
    {
      id: 'lebes',
      company: 'Lojas Lebes',
      location: 'Eldorado do Sul, RS',
      summary:
        'Atuação no suporte e na sustentação de sistemas corporativos, com foco na continuidade operacional, diagnóstico de falhas e integridade de dados em ambientes de produção.',
      roles: [{ title: 'Technical Support Analyst', start: '2018-02', end: '2019-08' }],
      highlights: [
        {
          text: 'Realizei a sustentação de sistemas corporativos, incluindo ERP e CRM, apoiando a continuidade operacional e a integridade dos fluxos de dados das rotinas de negócio.'
        },
        {
          text: 'Diagnostiquei falhas técnicas em servidores, integrações entre sistemas corporativos e rotinas de comunicação, conduzindo análises de causa raiz para reduzir o tempo de indisponibilidade operacional.'
        },
        {
          text: 'Validei correções técnicas, integridade de dados e melhorias em conjunto com equipes multidisciplinares de TI e Engenharia, contribuindo para a identificação e a mitigação de gargalos operacionais.'
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
      featured: ['TanStack Query', 'Redux'],
      items: ['TanStack Virtual', 'Zustand', 'Context API']
    },
    {
      name: 'Backend e IA',
      featured: ['.NET', 'Node.js', 'Go', 'Python'],
      items: ['C#', 'APIs REST', 'LLMs (function e tool calling)', 'SQL']
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
export const PROFILE_UPDATED = '2026-10-21';

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
