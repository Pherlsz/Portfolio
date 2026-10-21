import {
  availabilityLine,
  CONTACT_API,
  DEFAULT_PORTFOLIO_DATA,
  extractQuotedText,
  featuredProjectPrimaryUrl,
  foldText,
  formatRoleTimeline,
  plainText,
  skillNames,
  type PortfolioData
} from '../data/portfolioData.ts';
import { buildJobFitReply } from './jobFit.ts';
import { mentionsPersonalProject } from './chatGuardrails.ts';

export type LocalIntent =
  | 'quoted_injection_analysis'
  | 'llm_security'
  | 'assistant_architecture'
  | 'pets'
  | 'design_system'
  | 'atlas_ai'
  | 'projects'
  | 'availability'
  | 'contact'
  | 'education'
  | 'skills'
  | 'portfolio'
  | 'out_of_scope';

export function looksLikeJobDescription(text: string): boolean {
  const q = foldText(text);
  const hasJobHeader =
    /\b(vaga|cargo|oportunidade|posicao|job\s+description|analise\s+a\s+aderencia|analisar\s+aderencia|fit\s+com\s+a\s+vaga)\b/.test(
      q
    );
  const hasRequirementsSection =
    /\b(requisitos?|requirements?|qualificac[oõ]es|responsabilidades|atribuic[oõ]es|experiencia\s+profissional\s+com|conhecimento\s+de)\b/.test(
      q
    );
  const bulletCount = (text.match(/(?:^|\n)\s*[-*•]\s+/g) ?? []).length;
  return (
    (hasJobHeader && hasRequirementsSection) ||
    (hasJobHeader && bulletCount >= 2) ||
    (hasRequirementsSection && bulletCount >= 3)
  );
}

function classifyInjectionSample(sample: string): string {
  const f = foldText(sample);
  const categories: string[] = [];

  if (/\b(ignore|disregard|forget|override|bypass|ignorar|ignore|esqueca|desconsidere|burlar|sobrescrever)\b/.test(f)) {
    categories.push('**sobrescrita de instruções** (*instruction override*), que tenta anular as regras originais do sistema');
  }
  if (
    /\b(reveal|print|show|output|repeat|dump|expose|mostre|revele|exiba|imprima)\b/.test(f) ||
    /\b(system prompt|prompt de sistema|hidden instructions|instrucoes internas|segredos|secrets|api key)\b/.test(f)
  ) {
    categories.push('**extração de prompt ou segredos** (*prompt/secret exfiltration*), voltada a expor configurações internas');
  }
  if (/\b(system\s*:|developer\s*:|modo desenvolvedor|developer mode|dan mode|jailbreak|finja ser|aja como|act as)\b/.test(f)) {
    categories.push('**falsificação de papel/persona** (*role spoofing / jailbreak*), que tenta simular autoridade de sistema ou modo irrestrito');
  }

  const classification =
    categories.length > 0
      ? categories.join(' combinada com ')
      : '**manipulação de contexto** (*prompt injection*), que tenta inserir comandos dentro de dados de entrada';

  return [
    `**Classificação do exemplo citado**: o trecho \`"${sample}"\` é uma técnica de ${classification}.`,
    '- **Por que ocorre**: o atacante tenta fazer o modelo confundir dados do usuário com instruções de autoridade.',
    '- **Como mitigar**: separar instruções confiáveis (`system_instruction`) dos dados de entrada, tratar o texto do usuário apenas como conteúdo a ser analisado e manter validações e controle de acesso no servidor.'
  ].join('\n');
}

export function resolveLocalIntent(
  query: string,
  data: PortfolioData = DEFAULT_PORTFOLIO_DATA
): LocalIntent {
  const q = foldText(query);
  const quoted = extractQuotedText(query);

  if (
    quoted &&
    /\b(como|por que|explique|analise|avalie|classifique|exemplo|frase|expressao|trecho|prompt injection|injecao de prompt|guardrail)\b/.test(
      q
    )
  ) {
    return 'quoted_injection_analysis';
  }

  if (
    /\b(como|qual|quais)\b/.test(q) &&
    /\b(este|esse|seu|do)\s+(?:assistente|site|portfolio|guardrail)\b/.test(q) &&
    /\b(implementad|arquitetura|feito|funciona|construid|proteg|lida|trata)\b/.test(q)
  ) {
    return 'assistant_architecture';
  }

  if (
    /\b(prompt\s*injection|injecao\s+de\s+prompt|seguranca\s+de\s+llms?|seguranca\s+em\s+ia|owasp|guardrails?\s+de\s+ia)\b/.test(
      q
    )
  ) {
    return 'llm_security';
  }

  if (q.includes('gata') || q.includes('gato') || data.pets.some((p) => q.includes(foldText(p.name)))) {
    return 'pets';
  }
  if (q.includes('wcag') || q.includes('acessib') || q.includes('design system')) {
    return 'design_system';
  }
  if (q.includes('atlas') && (q.includes('ia') || q.includes('llm') || q.includes('chat'))) {
    return 'atlas_ai';
  }
  if (q.includes('projet') || mentionsPersonalProject(query, data)) {
    return 'projects';
  }
  if (/salar|pretens|remoto|hibrid|presencial|pleno|junior|senioridade|disponib/.test(q)) {
    return 'availability';
  }
  if (q.includes('contato') || q.includes('mensagem') || q.includes('e-mail') || q.includes('email')) {
    return 'contact';
  }
  if (/formac|faculdade|graduac|certificac|idioma|ingles/.test(q)) {
    return 'education';
  }
  if (q.includes('stack') || q.includes('tecnolog') || q.includes('skill')) {
    return 'skills';
  }
  if (
    /experi|carreira|trabalh|resumo|quem e|sobre o pedro|pedro|atlas|nelogica|lebes/.test(q) ||
    data.skills.some((group) => skillNames(group).some((skill) => skill.length >= 3 && q.includes(foldText(skill))))
  ) {
    return 'portfolio';
  }

  return 'out_of_scope';
}

export function buildLocalFallback(
  query: string,
  mode: 'chat' | 'jobfit',
  data: PortfolioData = DEFAULT_PORTFOLIO_DATA
): string {
  const { profile, project, featuredProjects, experiences, skills, pets, education, certifications, languages } = data;
  const atlas = experiences[0];

  if (mode === 'jobfit' || looksLikeJobDescription(query)) {
    return buildJobFitReply(query, data);
  }

  const intent = resolveLocalIntent(query, data);

  switch (intent) {
    case 'quoted_injection_analysis': {
      const sample = extractQuotedText(query) || query;
      return classifyInjectionSample(sample);
    }
    case 'assistant_architecture':
      return [
        '**Arquitetura pública deste portfólio**',
        '- **Stack**: React 19, TypeScript, Tailwind CSS e Cloudflare Workers (`/api/chat` e `/api/contact`).',
        '- **Dados estruturados**: uma única fonte tipada alimenta a interface, `/llms.txt`, `/pedro.md`, `/resume.json`, `/ai.json` e o prompt do assistente.',
        '- **Fluxo do assistente**: valida o formato da requisição com schemas compartilhados, separa política conversacional de instruções de sistema e mantém fallback local determinístico quando o modelo externo não está configurado.'
      ].join('\n');
    case 'llm_security':
      return [
        '**Segurança em aplicações com LLMs e no portfólio**',
        '- **Princípio central**: separar instruções confiáveis de sistema de entradas não confiáveis (mensagens do visitante, histórico e descrições de vagas), tratando textos externos apenas como dados.',
        '- **Controle no servidor**: validação e autorização ficam no backend (por exemplo, o endpoint `/api/chat` não tem acesso ao armazenamento `INBOX` nem expõe variáveis de ambiente).',
        '- **Experiência prática do Pedro**: aplicação do **OWASP Top 10** (prevenção de XSS e falhas de integração) na **Atlas Governance** e validação estrita de schemas em **Gymkhana Core** (`portablejson`).'
      ].join('\n');
    case 'pets':
      return `O Pedro divide o escritório com três gatos pretos:\n${pets.map((p) => `- **${p.name}**: ${p.bio}`).join('\n')}`;
    case 'design_system': {
      const ds = atlas.highlights.find((h) => h.metric === '30+ componentes');
      return `**Design system e WCAG**\n- ${ds?.text ?? 'Design system modular com referência à WCAG 2.1 Level AA.'}\n- Também otimizou listagens com 5.000+ registros (TanStack Virtual e code splitting) e cobriu fluxos críticos com Vitest e React Testing Library.`;
    }
    case 'atlas_ai':
      return `**IA na ${atlas.company}**\n- Desenvolveu as interfaces de funcionalidades baseadas em modelos de linguagem (LLMs) em produção, incluindo um chat e a exibição de relatórios gerados por IA.\n- A orquestração direta de modelos de IA (tools, RAG e roteamento multimodal) está nos projetos pessoais **Gymkhana Database** e **Gymkhana Core**.`;
    case 'projects': {
      const featured = featuredProjects
        .map((item) => {
          const url = featuredProjectPrimaryUrl(item);
          return `- **${item.name}**: ${item.tagline}${url ? ` (${url})` : ''}`;
        })
        .join('\n');
      return `Ferramentas em destaque:\n${featured}\n\nOutro projeto: **${project.name}** (${project.language}, ${project.version}): ${project.tagline}\nCódigo: ${project.repoUrl}`;
    }
    case 'availability':
      return `**Disponibilidade**\n- ${availabilityLine(profile)}`;
    case 'contact':
      return `O jeito mais rápido é o e-mail **${profile.email}**. Pessoas usam o formulário em #contato. Agentes de IA enviam \`POST ${CONTACT_API.path}\` com JSON \`{ "name", "email", "message", "source": "agent" }\`.`;
    case 'education':
      return [
        `**Formação**: ${education.map((e) => `${e.course} — ${e.school} (${e.period})`).join('; ')}.`,
        `**Certificações**: ${certifications.map((c) => `${c.name} (${c.issuer}, ${c.year})`).join('; ')}.`,
        `**Idiomas**: ${languages.map((l) => `${l.name} (${l.level})`).join('; ')}.`
      ].join('\n');
    case 'skills':
      return skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`).join('\n');
    case 'portfolio':
      return `**${profile.name}** é ${profile.jobTitle}. ${plainText(profile.summary)}\n${experiences
        .map((e) => `- **${e.company}**: ${formatRoleTimeline(e)}`)
        .join('\n')}`;
    case 'out_of_scope':
      return `Esse assunto foge do escopo deste assistente. Posso responder sobre a experiência, os projetos, a stack e a formação do **${profile.name}**, ou analisar o fit dele com uma vaga.`;
  }
}
