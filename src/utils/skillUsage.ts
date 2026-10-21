import {
  DEFAULT_PORTFOLIO_DATA,
  experienceSpan,
  foldText,
  formatPeriod,
  hasWholeWord,
  type PortfolioData
} from '../data/portfolioData.ts';

interface SkillEvidenceItem {
  id: string;
  kind: 'experience' | 'project' | 'certification';
  title: string;
  subtitle: string;
  details: string[];
  sectionId: 'experiencia' | 'projeto' | 'formacao';
}

/**
 * Sinônimos estritos da MESMA tecnologia (variações de grafia no portfólio),
 * sem associar uma ferramenta a outra diferente.
 */
const STRICT_SYNONYMS: Record<string, string[]> = {
  '.NET': ['.net', '.net core', 'c# / .net core', 'c#/.net core'],
  'C#': ['c#', 'c# / .net core', 'c#/.net core'],
  'C# / .NET Core': ['c#', '.net', '.net core', 'c# / .net core', 'c#/.net core'],
  'Acessibilidade (WCAG 2.1 AA)': ['wcag 2.1 aa', 'wcag 2.1 level aa', 'wcag 2.1'],
  'Web Performance': ['performance', 'virtualizacao do dom', 'code splitting', 'layout thrashing'],
  'Design Systems': ['design system'],
  'LLMs (function e tool calling)': [
    'modelos de linguagem (llms)',
    'function calling',
    'tool calling',
    'modelos de ia',
    'assistente de ia',
    'tools, rag'
  ],
  'APIs REST': ['apis rest'],
  'Microsoft Azure': ['azure fundamentals', 'azure cloud computing'],
  Docker: ['docker', 'container fundamentals']
};

function normalize(value: string): string {
  return foldText(value).trim();
}

function containsWholeTerm(haystack: string, term: string): boolean {
  const normHaystack = normalize(haystack);
  const normTerm = normalize(term);
  if (!normTerm) return false;
  return hasWholeWord(normHaystack, normTerm);
}

function getSkillSearchTerms(skill: string): string[] {
  const norm = normalize(skill);
  const synonyms = STRICT_SYNONYMS[skill] ?? [];
  return Array.from(new Set([norm, ...synonyms.map(normalize)]));
}

export function textMatchesSkill(text: string, skill: string): boolean {
  return getSkillSearchTerms(skill).some((term) => containsWholeTerm(text, term));
}

export function stackMatchesSkill(stack: string[], skill: string): boolean {
  const terms = getSkillSearchTerms(skill);
  return stack.some((item) => {
    const normItem = normalize(item);
    return terms.some((term) => normItem === term || containsWholeTerm(normItem, term));
  });
}

export function getSkillUsage(skill: string, data: PortfolioData = DEFAULT_PORTFOLIO_DATA): SkillEvidenceItem[] {
  const items: SkillEvidenceItem[] = [];

  for (const exp of data.experiences) {
    const inStack = stackMatchesSkill(exp.stack, skill);
    const matchingHighlights = exp.highlights
      .filter((h) => textMatchesSkill(`${h.metric ?? ''} ${h.text}`, skill))
      .map((h) => (h.metric ? `${h.metric}: ${h.text}` : h.text));

    if (inStack || matchingHighlights.length > 0) {
      const span = experienceSpan(exp);
      items.push({
        id: `exp-${exp.id}`,
        kind: 'experience',
        title: exp.company,
        subtitle: `${exp.roles[0]?.title ?? ''} · ${formatPeriod(span.start, span.end)}`,
        details:
          matchingHighlights.length > 0
            ? matchingHighlights
            : [exp.summary],
        sectionId: 'experiencia'
      });
    }
  }

  for (const feat of data.featuredProjects) {
    const inStack = stackMatchesSkill(feat.stack, skill);
    const inText = textMatchesSkill(`${feat.name} ${feat.kicker} ${feat.tagline}`, skill);
    if (inStack || inText) {
      items.push({
        id: `proj-${feat.id}`,
        kind: 'project',
        title: feat.name,
        subtitle: `${feat.kicker} · ${feat.stack.join(', ')}`,
        details: [feat.tagline],
        sectionId: 'projeto'
      });
    }
  }

  const core = data.project;
  const inCoreLang = stackMatchesSkill([core.language], skill) || textMatchesSkill(`${core.name} ${core.tagline}`, skill);
  const matchingCoreModules = core.modules
    .filter((m) => textMatchesSkill(`${m.name} ${m.description}`, skill))
    .map((m) => `${m.name}: ${m.description}`);
  const matchingCoreCards = core.cards
    .filter((c) => textMatchesSkill(`${c.title} ${c.text}`, skill))
    .map((c) => `${c.title}: ${c.text}`);

  if (inCoreLang || matchingCoreModules.length > 0 || matchingCoreCards.length > 0) {
    items.push({
      id: 'proj-gymkhana-core',
      kind: 'project',
      title: `${core.name} (${core.version})`,
      subtitle: `Biblioteca em ${core.language} · ${core.spec}`,
      details:
        matchingCoreModules.length > 0
          ? matchingCoreModules
          : matchingCoreCards.length > 0
            ? matchingCoreCards
            : [core.tagline],
      sectionId: 'projeto'
    });
  }

  for (const cert of data.certifications) {
    if (textMatchesSkill(`${cert.name} ${cert.issuer} ${cert.badge.code}`, skill)) {
      items.push({
        id: `cert-${cert.name}`,
        kind: 'certification',
        title: cert.name,
        subtitle: `${cert.issuer} · ${cert.year}`,
        details: [`Certificação oficial (${cert.badge.code}).`],
        sectionId: 'formacao'
      });
    }
  }

  for (const course of data.otherCourses) {
    if (textMatchesSkill(course, skill)) {
      items.push({
        id: `course-${course}`,
        kind: 'certification',
        title: course,
        subtitle: 'Formação complementar',
        details: [`Curso concluído: ${course}.`],
        sectionId: 'formacao'
      });
    }
  }

  return items;
}
