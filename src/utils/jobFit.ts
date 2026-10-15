import { experienceSpan, formatPeriod, type PortfolioData } from '../data/portfolioData.ts';

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function has(haystack: string, ...needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/** Evita 'java' em 'javascript' e 'ia' em 'hibrida'. */
function hasWord(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9+#])${escaped}(?:[^a-z0-9+#]|$)`).test(haystack);
}

function joinBold(items: string[]): string {
  if (items.length === 1) return `**${items[0]}**`;
  if (items.length === 2) return `**${items[0]}** e **${items[1]}**`;
  return `${items.slice(0, -1).map((item) => `**${item}**`).join(', ')} e **${items[items.length - 1]}**`;
}

const MISSING_TECH: { label: string; keys: string[]; words?: string[] }[] = [
  { label: 'Vue', keys: ['vue'] },
  { label: 'Angular', keys: ['angular'] },
  { label: 'Svelte', keys: ['svelte'] },
  { label: 'GraphQL', keys: ['graphql'] },
  { label: 'React Native', keys: ['react native', 'reactnative'] },
  { label: 'Flutter', keys: ['flutter'] },
  { label: 'Kotlin', keys: ['kotlin'] },
  { label: 'Swift', keys: ['swift'] },
  { label: 'PHP', keys: ['php'] },
  { label: 'Ruby', keys: ['ruby', 'rails'] },
  { label: 'Java', keys: [], words: ['java'] },
  { label: 'AWS', keys: [], words: ['aws'] },
  { label: 'Kubernetes', keys: ['kubernetes'], words: ['k8s'] }
];

export function buildJobFitReply(job: string, data: PortfolioData): string {
  const q = fold(job);
  const { profile, experiences, project } = data;
  const atlas = experiences[0];
  const atlasWhen = formatPeriod(experienceSpan(atlas).start, experienceSpan(atlas).end);

  const wantsReact = has(q, 'react');
  const wantsTs = has(q, 'typescript');
  const wantsNext = has(q, 'next.js', 'nextjs', 'next js');
  const wantsFrontend = has(q, 'frontend', 'front-end', 'front end') || wantsReact || wantsNext;
  const wantsDs = has(q, 'design system', 'design systems');
  const wantsA11y = has(q, 'acessib', 'wcag', 'a11y');
  const wantsPerf = has(q, 'performance', 'web vitals', 'lcp', 'virtualiza');
  const wantsTest = has(q, 'teste', 'vitest', 'jest', 'testing library');
  const wantsPython = has(q, 'python');
  const wantsDotnet = has(q, '.net', 'dotnet', 'c#');
  const wantsNode = has(q, 'node.js', 'nodejs') || hasWord(q, 'node');
  const wantsGo = has(q, 'golang') || hasWord(q, 'go');
  const wantsLlm =
    has(q, 'llm', 'function calling', 'tool calling', 'openai', 'gemini', 'ia aplicada', 'inteligencia artificial') ||
    hasWord(q, 'ia');
  const wantsFullstack = has(q, 'full-stack', 'fullstack', 'full stack');
  const wantsHybrid = has(q, 'hibrid');
  const wantsRemote = has(q, 'remoto', 'remote');
  const wantsOnsite = has(q, 'presencial', 'on-site', 'onsite');
  const mentionsPoa = has(q, 'porto alegre');
  const otherCity = has(
    q,
    'sao paulo',
    'rio de janeiro',
    'curitiba',
    'belo horizonte',
    'brasilia',
    'florianopolis',
    'campinas',
    'recife'
  );
  const wantsJunior = has(q, 'junior') || hasWord(q, 'jr');
  const wantsPleno = has(q, 'pleno');
  const wantsSenior = has(q, 'senior', 'staff', 'principal', 'tech lead', 'techlead');
  const wantsEnglishFluent = has(q, 'ingles fluente', 'ingles avancado', 'english fluent', 'english native');
  const wantsSalary = has(q, 'salario', 'salarial', 'pretens', 'faixa');

  const match: string[] = [];
  const gaps: string[] = [];
  const questions: string[] = [];

  if (wantsReact || wantsTs || wantsNext || wantsFrontend) {
    const stack = [
      wantsReact || wantsFrontend ? 'React' : null,
      wantsTs || wantsFrontend ? 'TypeScript' : null,
      wantsNext ? 'Next.js' : null
    ].filter(Boolean);
    const label = stack.length ? stack.join(', ') : 'React, TypeScript e Next.js';
    match.push(
      `**${label}** em produção na **Atlas** (${atlasWhen}): frontend do Atlas PLG e do Atlas Sign.`
    );
  }

  if (wantsDs || wantsA11y) {
    match.push(
      `**Design system e acessibilidade**: **30+ componentes** em conformidade com **WCAG 2.1 AA** no Atlas PLG.`
    );
  }

  if (wantsPerf) {
    match.push(
      `**Performance**: listagens com **5.000+ registros** (TanStack Virtual) e code splitting no Atlas Sign.`
    );
  }

  if (wantsTest) {
    match.push(
      `**Testes**: Vitest e React Testing Library nos fluxos críticos de assinatura (Atlas Sign).`
    );
  }

  if (wantsPython || wantsDotnet || wantsFullstack) {
    const backend = [wantsPython || wantsFullstack ? 'Python' : null, wantsDotnet || wantsFullstack ? 'C#/.NET' : null]
      .filter(Boolean)
      .join(' e ');
    match.push(
      `**APIs REST** em **${backend || 'Python e C#/.NET'}** na Atlas, com o frontend separado do estado de servidor (TanStack Query).`
    );
  } else if (wantsNode) {
    match.push('**Node.js** aparece na stack; o backend em produção na Atlas foi **Python** e **C#/.NET**.');
  }

  if (wantsLlm) {
    match.push('**IA em produção**: function calling e tool calling nos fluxos da Atlas.');
  }

  if (wantsGo) {
    match.push(
      `**Go** não aparece na experiência em produção; o uso está no projeto pessoal **${project.name}** (${project.version}).`
    );
  }

  if (otherCity && (wantsOnsite || wantsHybrid)) {
    gaps.push(
      'A vaga exige presença fora de Porto Alegre; o presencial/híbrido do Pedro é só na cidade.'
    );
  } else if (wantsHybrid) {
    match.push(
      `**Formato**: a vaga é híbrida; o Pedro atua remoto ou híbrido/presencial em Porto Alegre.`
    );
    if (!mentionsPoa) {
      questions.push('O híbrido da vaga é em Porto Alegre ou em outra cidade?');
    }
  } else if (wantsOnsite && mentionsPoa) {
    match.push('**Formato**: presencial em Porto Alegre entra no modelo dele (híbrido/presencial na cidade).');
  } else if (wantsOnsite) {
    gaps.push(
      'A vaga pede **presencial** sem deixar claro se é Porto Alegre; fora da cidade o Pedro não se posiciona como presencial.'
    );
    questions.push('A presença é em Porto Alegre ou em outra cidade?');
  } else if (wantsRemote) {
    match.push('**Formato**: a vaga é remota; o Pedro atua remoto (ou híbrido/presencial em Porto Alegre).');
  }

  if (wantsSenior && !wantsPleno && !wantsJunior) {
    gaps.push(`A vaga pede **sênior**; o Pedro se posiciona como **${profile.seniority}**.`);
  } else if (wantsJunior || wantsPleno) {
    match.push(`**Senioridade ${profile.seniority}**, no intervalo da vaga.`);
  }

  if (wantsEnglishFluent) {
    gaps.push('A vaga pede inglês fluente; o inglês do Pedro é **intermediário**, com leitura e escrita técnica.');
  }

  const missingAsked = MISSING_TECH.filter(
    (tech) => tech.keys.some((key) => has(q, key)) || tech.words?.some((word) => hasWord(q, word))
  ).map((tech) => tech.label);
  if (missingAsked.length) {
    gaps.unshift(
      missingAsked.length === 1
        ? `A vaga cita ${joinBold(missingAsked)}, que não aparece no portfólio.`
        : `A vaga cita ${joinBold(missingAsked)}, que não aparecem no portfólio.`
    );
  }

  if (wantsSalary) {
    match.push(`**Pretensão salarial**: ${profile.salary.toLowerCase()}.`);
  }

  if (match.length === 0) {
    match.push(
      `Perfil de **${profile.role}** (React, Next.js, TypeScript) na **Atlas** (${atlasWhen}), com design system WCAG 2.1 AA.`
    );
  }

  if (gaps.length === 0) {
    const unspecified: string[] = [];
    if (!wantsTest && wantsFrontend) unspecified.push('testes');
    if (!wantsHybrid && !wantsRemote && !wantsOnsite) unspecified.push('modelo de trabalho');
    if (!wantsJunior && !wantsPleno && !wantsSenior) unspecified.push('nível (júnior/pleno/sênior)');
    gaps.push(
      unspecified.length
        ? `Nenhuma lacuna dura nos requisitos citados. A vaga não detalha ${unspecified.join(', ')}.`
        : 'Nenhuma lacuna dura nos requisitos citados.'
    );
  }

  if (wantsPerf) {
    questions.push(
      'Quais métricas de performance importam no time (Core Web Vitals, listas grandes, bundle)?'
    );
  }
  if (wantsDs || wantsA11y) {
    questions.push('O design system é interno, e o critério de acessibilidade é WCAG 2.1 AA ou outro nível?');
  }
  if (wantsLlm) {
    questions.push('A vaga pede LLMs em fluxos reais (function/tool calling) ou só consumo de API pronta?');
  }
  if (questions.length < 2) {
    questions.push(
      wantsLlm
        ? 'Como o time avalia qualidade dos fluxos com LLM em produção?'
        : 'Como o time mede qualidade de frontend (testes, a11y, revisão de performance)?'
    );
  }
  if (questions.length < 2 && !wantsJunior && !wantsPleno && !wantsSenior) {
    questions.push('Qual o nível esperado (júnior, pleno, sênior) e o tamanho do time de frontend?');
  }

  return [
    '**Aderência**',
    ...match.slice(0, 5).map((line) => `- ${line}`),
    '',
    '**Lacunas**',
    ...gaps.slice(0, 4).map((line) => `- ${line}`),
    '',
    '**Perguntas para a entrevista**',
    ...questions.slice(0, 3).map((line) => `- ${line}`)
  ].join('\n');
}
