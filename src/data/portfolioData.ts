export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  type: string;
  summary: string;
  highlights: string[];
  architectureHighlight: string;
  stack: string[];
  impactMetric: string;
}

export interface CertificationBadge {
  id: string;
  title: string;
  issuer: string;
  issuedDate: string;
  credentialCode: string;
  category: 'architecture' | 'frontend' | 'ai' | 'competitive';
  badgeShape: 'octagon' | 'shield' | 'diamond' | 'hexagon' | 'crest';
  accentColor: string;
  skills: string[];
  description: string;
  asciiStamp: string;
}

export interface BlueprintNode {
  id: string;
  label: string;
  sublabel: string;
  latencyOrStat: string;
  detail: string;
}

export interface ProjectItem {
  id: string;
  index: string;
  title: string;
  kicker: string;
  year: string;
  role: string;
  featured: boolean;
  image: string;
  summary: string;
  architectureNotes: string;
  blueprintNodes: BlueprintNode[];
  codeSnippet: string;
  metrics: string[];
  stack: string[];
  liveUrl: string;
  repoUrl: string;
}

export interface PortfolioData {
  profile: {
    name: string;
    shortName: string;
    email: string;
    location: string;
    headline: string;
    subheadline: string;
    availability: string;
    aboutParagraphs: string[];
    heroImage: string;
    metrics: {
      label: string;
      value: string;
      context: string;
    }[];
  };
  experiences: ExperienceItem[];
  certifications: CertificationBadge[];
  projects: ProjectItem[];
}

export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  profile: {
    name: 'Pedro Henriques Lopes',
    shortName: 'Pedro Lopes',
    email: 'henriqueslopespedro@gmail.com',
    location: 'Rio Grande do Sul, Brasil',
    headline: 'Engenharia de software minimalista, interfaces táteis & sistemas de alta precisão.',
    subheadline:
      'Desenvolvedor focado em arquiteturas web Mobile-First, micro-interações a 60fps e aplicações semânticas prontas tanto para humanos exigentes quanto para agentes de IA.',
    availability: 'Disponível para posições Senior / Mid-Senior & Projetos Estratégicos',
    aboutParagraphs: [
      'Construo produtos digitais onde engenharia rigorosa encontra direção de arte minimalista. Meu foco principal é criar aplicações React, TypeScript e Node.js que carregam instantaneamente, respondem ao toque com precisão cirúrgica e escalam sem fricção — sempre movido a muito café.',
      'Acredito em software com alma: por trás da arquitetura limpa e dos dados estruturados para recrutadores de IA, trago a precisão investigativa das competições no RS (Gincanas — Setor de Diversas, extremamente focado em dados, documentos, informações pessoais e locais), a disciplina da academia, a visão tática dos e-sports/RPGs e a companhia das minhas 3 gatas (Morcega, Banguela e Tomada).'
    ],
    heroImage: '/src/assets/images/hero_editorial_workspace_1792009908411.jpg',
    metrics: [
      {
        label: 'Performance & UI',
        value: '60 FPS',
        context: 'Micro-interações de compositor & Mobile-First 44px+'
      },
      {
        label: 'Impacto em LCP',
        value: '-38% Latência',
        context: 'Otimização de renderização crítica & bundles'
      },
      {
        label: 'Automação Operacional',
        value: '+60% Ganho',
        context: 'Redução de retrabalho manual via pipelines TS/Node'
      },
      {
        label: 'Indexação Agêntica',
        value: '100% AI-Ready',
        context: 'Schema.org JSON-LD + /llms.txt + /ai.json'
      }
    ]
  },
  experiences: [
    {
      id: 'exp-1',
      role: 'Senior Frontend & Full-Stack Software Engineer',
      company: 'Engenharia de Produtos Digitais & Sistemas Web',
      location: 'Rio Grande do Sul, Brasil · Remoto',
      period: '2023 — Presente',
      type: 'Tempo Integral',
      summary:
        'Liderança técnica no desenvolvimento de aplicações web modernas com arquitetura Mobile-First, design systems enxutos, acessibilidade WCAG AA e integração nativa de agentes de IA.',
      highlights: [
        'Arquitetura de sistemas de componentes em React 19 e TypeScript estrito, reduzindo o tempo de carregamento inicial (LCP) em 38% e eliminando regressões visuais.',
        'Desenvolvimento de camadas BFF (Backend-for-Frontend) em Node.js/Express com streaming de respostas, validação de esquemas e alta resiliência.',
        'Implementação pioneira de padrões AI-Friendly (Schema.org JSON-LD dinâmico e manifestos /llms.txt) para indexação semântica perfeita.'
      ],
      architectureHighlight:
        'Migração de árvores de estado monolíticas para composição modular com code-splitting granular e renderização orientada a eventos.',
      stack: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Tailwind CSS', 'PostgreSQL', 'REST APIs'],
      impactMetric: '-38% LCP · 100/100 Core Web Vitals'
    },
    {
      id: 'exp-2',
      role: 'Software Developer · Full-Stack & Automação',
      company: 'Soluções Web, Dados & Ferramentas Analíticas',
      location: 'Rio Grande do Sul, Brasil',
      period: '2021 — 2023',
      type: 'Engenharia de Software',
      summary:
        'Criação de plataformas operacionais, dashboards analíticos de baixa latência e motores de automação para processos críticos de negócio.',
      highlights: [
        'Construção de interfaces responsivas de visualização de dados operáveis tanto em coletores/smartphones em campo quanto em monitores ultrawide.',
        'Desenvolvimento de pipelines de validação, ingestão e transformação de dados em TypeScript e SQL que reduziram tarefas manuais em mais de 60%.',
        'Padronização de contratos de API, testes automatizados e documentação técnica executável.'
      ],
      architectureHighlight:
        'Desenho de fila assíncrona e cache inteligente para consultas analíticas pesadas, caindo de 4.2s para 190ms.',
      stack: ['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'Docker', 'Git'],
      impactMetric: '+60% Eficiência Operacional · 190ms Query P95'
    },
    {
      id: 'exp-3',
      role: 'Engenharia de Dados Rápidos, Indexação & Resolução Competitiva',
      company: 'Laboratório Criativo & Competições de Dados (RS)',
      location: 'Rio Grande do Sul, Brasil',
      period: '2019 — 2021',
      type: 'Dados, Buscas & Automação',
      summary:
        'Desenvolvimento de utilitários de indexação em tempo real, cruzamento de bases documentais, geolocalização e interfaces web leves sob alta pressão de tempo.',
      highlights: [
        'Criação de ferramentas web customizadas para indexação rápida de documentos, cruzamento de registros públicos/históricos, dados pessoais, mapas/locais e coordenação de equipes.',
        'Desenvolvimento de protótipos funcionais completos em janelas de poucas horas, priorizando busca instantânea e usabilidade mobile.',
        'Consolidação de base sólida em estruturas de dados, indexação textual, protocolos HTTP e manipulação de DOM.'
      ],
      architectureHighlight:
        'Indexação local de alta velocidade + WebSockets leves para cruzamento instantâneo de documentos e locais mesmo em redes móveis instáveis.',
      stack: ['JavaScript', 'TypeScript', 'WebSockets', 'Python', 'Data Indexing', 'CSS Architecture'],
      impactMetric: 'Dezenas de ferramentas de busca e dados entregues'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      index: '01',
      title: 'CloudOS — Distributed Telemetry & Topology Directory',
      kicker: 'Plataforma de Observabilidade & Design System',
      year: '2025',
      role: 'Lead Frontend & Systems Architect',
      featured: true,
      image: '/src/assets/images/project_system_architecture_1792009909530.jpg',
      summary:
        'Painel de controle minimalista de altíssima densidade informacional para monitoramento de microsserviços, topologia de nós, logs em streaming e latência P99 sem bibliotecas pesadas de terceiros.',
      architectureNotes:
        'Renderização híbrida SVG + Canvas com virtualização de listas de logs (suporta 100k+ linhas a 60fps) e navegação completa via Command Palette (⌘K).',
      blueprintNodes: [
        {
          id: 'edge',
          label: '01. Edge Collector',
          sublabel: 'Ingestão SSE / WebSockets',
          latencyOrStat: '1.8ms overhead',
          detail: 'Recebe streams de telemetria comprimidos e normaliza eventos em buffers circulares.'
        },
        {
          id: 'state',
          label: '02. Reactive Ring Buffer',
          sublabel: 'Zero-GC State Store',
          latencyOrStat: '100k linhas @ 60fps',
          detail: 'Evita garbage collection excessivo no browser mantendo fatias de janela virtualizadas.'
        },
        {
          id: 'render',
          label: '03. Procedural SVG Graph',
          sublabel: 'Topologia de Nós Viva',
          latencyOrStat: '< 4ms frame budget',
          detail: 'Calcula layout direcionado por força de forma determinística e acessível via teclado.'
        }
      ],
      codeSnippet: `// Virtualized Ring Buffer para telemetria a 60fps
export function useTelemetryWindow<T>(stream: T[], capacity = 500) {
  return useMemo(() => {
    const start = Math.max(0, stream.length - capacity);
    return stream.slice(start);
  }, [stream, capacity]);
}`,
      metrics: [
        '60fps constantes com mais de 100.000 eventos em memória',
        'Bundle 74% menor ao substituir libs de gráficos por SVG procedural',
        'Pontuação 100/100 em Acessibilidade, Performance e SEO'
      ],
      stack: ['React 19', 'TypeScript', 'Node.js', 'WebSockets', 'SVG Procedural', 'Tailwind CSS'],
      liveUrl: '#projetos',
      repoUrl: 'https://github.com'
    },
    {
      id: 'proj-2',
      index: '02',
      title: 'Nexus Command — Real-Time Cryptographic & Task War-Room',
      kicker: 'Colaboração em Tempo Real & Motores de Decodificação',
      year: '2025',
      role: 'Creator & Full-Stack Engineer',
      featured: false,
      image: '/src/assets/images/project_gincana_command_1792009910616.jpg',
      summary:
        'Ambiente colaborativo Mobile-First de baixa latência para resolução de problemas complexos em equipe. Inclui pipeline de análise criptográfica simultânea e sincronização de estado otimista.',
      architectureNotes:
        'Web Workers dedicados executam heurísticas de decodificação em paralelo sem bloquear a thread principal de UI no smartphone.',
      blueprintNodes: [
        {
          id: 'worker',
          label: '01. Crypto WebWorker Pool',
          sublabel: 'Multi-thread no Browser',
          latencyOrStat: '14 cifras em 11ms',
          detail: 'Testa automaticamente César, Vigenère, Base64, Hex, Morse e análise de frequência.'
        },
        {
          id: 'sync',
          label: '02. Optimistic CRDT Sync',
          sublabel: 'Estado Compartilhado',
          latencyOrStat: '< 35ms sync global',
          detail: 'Sincroniza descobertas entre operadores no desktop e equipes móveis na rua.'
        },
        {
          id: 'ui',
          label: '03. Thumb-Zone Tactical UI',
          sublabel: 'Ergonomia Mobile-First',
          latencyOrStat: '48px touch targets',
          detail: 'Projetado para operação rápida com apenas uma mão em qualquer iluminação.'
        }
      ],
      codeSnippet: `// Execução paralela de decodificadores sem travar a UI
const results = await Promise.all(
  ciphers.map((cipher) => workerPool.exec(cipher.decode, payload))
);
return results.filter((r) => r.entropyScore > 0.82);`,
      metrics: [
        'Decodificação heurística de 14 formatos simultâneos em < 12ms',
        'Sincronização em tempo real para mais de 40 dispositivos simultâneos',
        'Redução de 70% no tempo de resolução de tarefas críticas'
      ],
      stack: ['TypeScript', 'React', 'Web Workers', 'Node.js', 'WebSockets'],
      liveUrl: '#projetos',
      repoUrl: 'https://github.com'
    },
    {
      id: 'proj-3',
      index: '03',
      title: 'Obsidian Engine — Deterministic State & Tactical Planner',
      kicker: 'Simulador Probabilístico & Arquitetura Offline-First',
      year: '2024',
      role: 'Product & Frontend Engineer',
      featured: false,
      image: '/src/assets/images/project_rpg_companion_1792009910410.jpg',
      summary:
        'Aplicação web progressiva (Offline-First) com máquina de estados finitos para simulações táticas, árvores de decisão complexas e cálculo probabilístico em tempo real.',
      architectureNotes:
        'Persistência IndexedDB sincronizada com histórico imutável (Undo/Redo instantâneo em 50 níveis) e motor matemático puro em TypeScript.',
      blueprintNodes: [
        {
          id: 'fsm',
          label: '01. Finite State Machine',
          sublabel: 'Transições Determinísticas',
          latencyOrStat: 'Zero estados inválidos',
          detail: 'Garante integridade matemática em regras complexas de turnos, recursos e modificadores.'
        },
        {
          id: 'idb',
          label: '02. Local-First IndexedDB',
          sublabel: 'Persistência Instantânea',
          latencyOrStat: '0ms network wait',
          detail: 'Funciona 100% offline com snapshots comprimidos e exportação JSON.'
        },
        {
          id: 'prob',
          label: '03. Monte Carlo Simulator',
          sublabel: 'Cálculo de Probabilidade',
          latencyOrStat: '10k iterações em 8ms',
          detail: 'Calcula curvas de distribuição de sucesso antes de cada decisão tática.'
        }
      ],
      codeSnippet: `// Simulação rápida de distribuição de probabilidade
export function computeSuccessChance(dc: number, modifier: number, advantage: boolean): number {
  const needed = Math.max(1, Math.min(21, dc - modifier));
  const singleFail = (needed - 1) / 20;
  return advantage ? 1 - singleFail * singleFail : 1 - singleFail;
}`,
      metrics: [
        'Zero latência de rede com arquitetura Local-First + IndexedDB',
        'Histórico de 50 estados com Time-Travel Undo/Redo em < 1ms',
        'Interface adaptativa para mobile portrait e tablets landscape'
      ],
      stack: ['TypeScript', 'React', 'State Machines', 'IndexedDB', 'Tailwind CSS'],
      liveUrl: '#projetos',
      repoUrl: 'https://github.com'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      title: 'Full-Stack TypeScript & Modern React Architecture',
      issuer: 'Especialização em Engenharia Web',
      issuedDate: '2025',
      credentialCode: 'PHL-ARCH-2025-TS',
      category: 'frontend',
      badgeShape: 'octagon',
      accentColor: '#E11D48',
      skills: ['React 19', 'TypeScript Strict', 'State Architecture', 'Performance Tuning'],
      description:
        'Domínio de padrões avançados de renderização, composição de componentes acessíveis e arquitetura cliente-servidor tipada de ponta a ponta.',
      asciiStamp: `[+==================+]
|  TS // REACT 19    |
|  VERIFIED: 2025    |
[+==================+]`
    },
    {
      id: 'cert-2',
      title: 'AI Agents, Context Guardrails & Semantic Web (LLMs.txt)',
      issuer: 'AI Engineering & Structured Data',
      issuedDate: '2025',
      credentialCode: 'PHL-AI-AGENT-09',
      category: 'ai',
      badgeShape: 'hexagon',
      accentColor: '#F59E0B',
      skills: ['Gemini SDK', 'Context Locking', 'JSON-LD Schema', 'Agentic Workflows'],
      description:
        'Construção de agentes de IA com escopo estritamente controlado, extração estruturada e otimização de aplicações para leitura por agentes autônomos.',
      asciiStamp: `/--------------------\\
|  AI AGENT READY    |
|  GUARDRAILS: LOCK  |
\\--------------------/`
    },
    {
      id: 'cert-3',
      title: 'Cloud Infrastructure, Node.js APIs & Distributed Systems',
      issuer: 'Cloud & Backend Architecture',
      issuedDate: '2024',
      credentialCode: 'PHL-CLOUD-884',
      category: 'architecture',
      badgeShape: 'shield',
      accentColor: '#10B981',
      skills: ['Node.js', 'Containers', 'REST & WebSockets', 'SQL & NoSQL Modeling'],
      description:
        'Modelagem de dados de alta performance, criação de APIs resilientes, cache estratégico e deploy contínuo em nuvem.',
      asciiStamp: `.____________________.
|  CLOUD & SYSTEMS   |
|  UPTIME ARCH 99.9% |
'--------------------'`
    },
    {
      id: 'cert-4',
      title: 'Mobile-First Ergonomics, WCAG AA & Kinetic UI',
      issuer: 'Creative Design & Interaction',
      issuedDate: '2024',
      credentialCode: 'PHL-UX-MOB-44',
      category: 'frontend',
      badgeShape: 'diamond',
      accentColor: '#3B82F6',
      skills: ['Thumb-Zone UX', 'WCAG AA Contrast', '60fps Compositor Motion', 'Design Systems'],
      description:
        'Design centrado na ergonomia mobile (alvos mínimos de 44px), navegação por teclado e micro-interações táteis sem layout shift.',
      asciiStamp: `<====================>
|  MOBILE FIRST 44px |
|  WCAG AA VERIFIED  |
<====================>`
    }
  ]
};

export function generateJsonLdSchema(data: PortfolioData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntity: {
      '@type': 'Person',
      name: data.profile.name,
      alternateName: data.profile.shortName,
      email: data.profile.email,
      jobTitle: 'Senior Frontend & Full-Stack Software Engineer',
      description: data.profile.headline + ' ' + data.profile.subheadline,
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'RS',
        addressCountry: 'BR',
        name: data.profile.location
      },
      knowsAbout: Array.from(
        new Set([
          ...data.experiences.flatMap((e) => e.stack),
          ...data.certifications.flatMap((c) => c.skills),
          'Mobile-First Architecture',
          'AI-Friendly Semantic Web'
        ])
      ),
      hasCredential: data.certifications.map((cert) => ({
        '@type': 'EducationalOccupationalCredential',
        name: cert.title,
        credentialCategory: cert.category,
        recognizedBy: {
          '@type': 'Organization',
          name: cert.issuer
        },
        dateCreated: cert.issuedDate,
        identifier: cert.credentialCode
      })),
      worksFor: data.experiences[0]
        ? {
            '@type': 'Organization',
            name: data.experiences[0].company
          }
        : undefined
    },
    hasPart: data.projects.map((proj) => ({
      '@type': 'SoftwareSourceCode',
      name: proj.title,
      description: proj.summary,
      dateCreated: proj.year,
      programmingLanguage: proj.stack
    }))
  };
}

export function generateLlmsTxt(data: PortfolioData): string {
  const lines: string[] = [
    `# ${data.profile.name} — Curriculum Vitae & AI-Friendly Dossier`,
    `> ${data.profile.headline}`,
    ``,
    `## Contact & Availability`,
    `- **Name**: ${data.profile.name}`,
    `- **Email**: ${data.profile.email}`,
    `- **Location**: ${data.profile.location}`,
    `- **Availability**: ${data.profile.availability}`,
    `- **Core Stack**: TypeScript, React 19, Next.js, Node.js, Tailwind CSS, PostgreSQL, WebSockets, AI Agents`,
    ``,
    `## Professional Experience (Experiências)`,
    ...data.experiences.map(
      (exp) =>
        `### ${exp.role} @ ${exp.company} (${exp.period})\n` +
        `- **Location/Type**: ${exp.location} · ${exp.type}\n` +
        `- **Verified Impact**: ${exp.impactMetric}\n` +
        `- **Summary**: ${exp.summary}\n` +
        `- **Architectural Highlight**: ${exp.architectureHighlight}\n` +
        `- **Technologies**: ${exp.stack.join(', ')}\n` +
        exp.highlights.map((h) => `  - ${h}`).join('\n') +
        `\n`
    ),
    `## Featured Engineering Projects (Projetos)`,
    ...data.projects.map(
      (proj) =>
        `### ${proj.index}. ${proj.title} (${proj.year}) — ${proj.kicker}\n` +
        `- **Role**: ${proj.role}\n` +
        `- **Summary**: ${proj.summary}\n` +
        `- **Architecture**: ${proj.architectureNotes}\n` +
        `- **Stack**: ${proj.stack.join(', ')}\n` +
        `- **Metrics**: ${proj.metrics.join(' | ')}\n`
    ),
    `## Certifications (Certificações)`,
    ...data.certifications.map(
      (cert) =>
        `- **${cert.title}** (${cert.issuer}, ${cert.issuedDate}) — Code: \`${cert.credentialCode}\` | Skills: ${cert.skills.join(', ')}`
    ),
    ``,
    `## Personal Notes & Culture Fit`,
    `- **Competitions**: Active competitor in Rio Grande do Sul Gincanas ("Setor de Diversas" — logic, cryptography, rapid problem-solving).`,
    `- **Hobbies & Discipline**: Consistent strength training (gym), competitive e-sports, and tactical/simulation games (Baldur's Gate 3, Valheim, Dota 2, Valorant, Cities: Skylines).`,
    `- **Cats (3 Gatas)**: Morcega (oldest and chonkiest matriarch), Banguela (middle and smallest of the three, missing one fang), and Tomada (youngest and hyperactive 220V).`
  ];

  return lines.join('\n');
}
