import certificatesJson from '../../content/certificates.json' with { type: 'json' };
import experiencesJson from '../../content/experiences.json' with { type: 'json' };
import profileJson from '../../content/profile.json' with { type: 'json' };
import projectsJson from '../../content/projects.json' with { type: 'json' };

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

export interface ProjectModule {
  name: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  kicker: string;
  kind: 'app' | 'library' | 'case-study' | 'portfolio-version';
  featured: boolean;
  tagline: string;
  href?: string;
  repoUrl?: string;
  decisionsDoc?: string;
  access: 'public' | 'restricted';
  language?: string;
  stack: string[];
  image?: string;
  modules?: ProjectModule[];
  chatPrompt?: string;
}

export interface CertificateBadgeMeta {
  code: string;
  caption: string;
  shape: 'hexagon' | 'circle';
  color: string;
}

export interface CertificateItem {
  slug: string;
  title: string;
  issuer: string;
  platform: string;
  code: string;
  description: string;
  issuedAt: string;
  expiresAt?: string;
  badge?: string;
  pdf?: string;
  verifyUrl?: string;
  badgeMeta?: CertificateBadgeMeta;
}

interface Project {
  name: string;
  tagline: string;
  repoUrl: string;
  language: string;
  modules: ProjectModule[];
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
  badge: CertificateBadgeMeta;
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

interface ProfileDocument {
  siteOrigin: string;
  updatedAt: string;
  profile: PortfolioData['profile'];
  skills: SkillGroup[];
  education: Education[];
  otherCourses: string[];
  languages: Language[];
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
  projects: ProjectItem[];
  featuredProjects: FeaturedProject[];
  project: Project;
  skills: SkillGroup[];
  education: Education[];
  certificates: CertificateItem[];
  certifications: Certification[];
  otherCourses: string[];
  languages: Language[];
}

const parsedProfileDoc = profileJson as ProfileDocument;
const parsedExperiences = experiencesJson as Experience[];
const parsedProjects = projectsJson as ProjectItem[];
const parsedCertificates = certificatesJson as CertificateItem[];

const legacyFeaturedProjects: FeaturedProject[] = parsedProjects
  .filter((item): item is ProjectItem & { image: string } => item.kind === 'app' && Boolean(item.image))
  .map((item) => ({
    id: item.id,
    name: item.name,
    kicker: item.kicker,
    tagline: item.tagline,
    href: item.href,
    repoUrl: item.repoUrl,
    access: item.access,
    stack: item.stack,
    image: item.image
  }));

const coreProjectItem =
  parsedProjects.find((item) => item.id === 'gymkhana-core') ??
  parsedProjects.find((item) => item.kind === 'library');

const legacyCoreProject: Project = {
  name: coreProjectItem?.name ?? 'Gymkhana Core',
  tagline: coreProjectItem?.tagline ?? '',
  repoUrl: coreProjectItem?.repoUrl ?? 'https://github.com/Pherlsz/Gymkhana-Core',
  language: coreProjectItem?.language ?? 'Go',
  modules: coreProjectItem?.modules ?? []
};

const legacyCertifications: Certification[] = parsedCertificates.map((cert) => ({
  name: cert.title,
  issuer: cert.issuer,
  year: cert.issuedAt,
  href: cert.verifyUrl,
  image: cert.badge,
  badge: cert.badgeMeta ?? {
    code: cert.code,
    caption: cert.platform,
    shape: 'circle',
    color: 'var(--poster)'
  }
}));

export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  profile: parsedProfileDoc.profile,
  experiences: parsedExperiences,
  projects: parsedProjects,
  featuredProjects: legacyFeaturedProjects,
  project: legacyCoreProject,
  skills: parsedProfileDoc.skills,
  education: parsedProfileDoc.education,
  certificates: parsedCertificates,
  certifications: legacyCertifications,
  otherCourses: parsedProfileDoc.otherCourses,
  languages: parsedProfileDoc.languages
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
  return `${formatMonth(start)} - ${formatMonth(end)}`;
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

export const SITE_ORIGIN = parsedProfileDoc.siteOrigin;
export const PROFILE_UPDATED = parsedProfileDoc.updatedAt;

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

export function featuredProjectLinks(
  project: Pick<FeaturedProject, 'repoUrl' | 'href'>
): FeaturedProjectResolvedLink[] {
  const out: FeaturedProjectResolvedLink[] = [];
  const repo = project.repoUrl?.trim();
  const live = project.href?.trim();
  if (repo) out.push({ kind: 'repo', href: repo });
  if (live && live !== repo) out.push({ kind: 'live', href: live });
  return out;
}

export function featuredProjectPrimaryUrl(
  project: Pick<FeaturedProject, 'repoUrl' | 'href'>
): string | undefined {
  return featuredProjectLinks(project)[0]?.href;
}
