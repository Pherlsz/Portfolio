import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData.ts';

function countStudyFiles(): number {
  try {
    return Object.keys(import.meta.glob('../../content/studies/*.md')).length;
  } catch {
    return 0;
  }
}

function countArticleFiles(): number {
  try {
    return Object.keys(import.meta.glob('../../content/articles/*.md')).length;
  } catch {
    return 0;
  }
}

export type SectionId = 'projects' | 'experience' | 'studies' | 'articles' | 'ai';

export interface SectionDefinition {
  id: SectionId;
  path: string;
  labelKey: 'nav.projects' | 'nav.experience' | 'nav.studies' | 'nav.articles' | 'nav.ai';
  label: string;
  count: number;
}

export interface SectionCounts {
  projects: number;
  experiences: number;
  studies: number;
  certificates: number;
  articles: number;
}

export function getSectionCounts(): SectionCounts {
  return {
    projects: DEFAULT_PORTFOLIO_DATA.projects.length,
    experiences: DEFAULT_PORTFOLIO_DATA.experiences.length,
    studies: countStudyFiles(),
    certificates: DEFAULT_PORTFOLIO_DATA.certificates.length,
    articles: countArticleFiles()
  };
}

export function visibleSections(counts: SectionCounts = getSectionCounts()): SectionDefinition[] {
  const all: SectionDefinition[] = [
    {
      id: 'projects',
      path: '/projetos',
      labelKey: 'nav.projects',
      label: 'Projetos',
      count: counts.projects
    },
    {
      id: 'experience',
      path: '/experiencia',
      labelKey: 'nav.experience',
      label: 'Experiência',
      count: counts.experiences
    },
    {
      id: 'studies',
      path: '/estudos',
      labelKey: 'nav.studies',
      label: 'Estudos',
      count: counts.studies + counts.certificates
    },
    {
      id: 'articles',
      path: '/artigos',
      labelKey: 'nav.articles',
      label: 'Artigos',
      count: counts.articles
    },
    {
      id: 'ai',
      path: '/ai',
      labelKey: 'nav.ai',
      label: 'AI / Arquivos',
      count: 1
    }
  ];

  return all.filter((section) => section.count > 0);
}

export function isSectionVisible(id: SectionId, counts?: SectionCounts): boolean {
  return visibleSections(counts).some((section) => section.id === id);
}
