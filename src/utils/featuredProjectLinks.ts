export type FeaturedProjectLinkKind = 'site' | 'repo';

export type FeaturedProjectLinkFields = {
  href?: string;
  repoUrl?: string;
};

export type FeaturedProjectLink = {
  kind: FeaturedProjectLinkKind;
  href: string;
};

function trimmed(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

/** Links present on a featured project, in UI order (site then repo). */
export function featuredProjectLinks(project: FeaturedProjectLinkFields): FeaturedProjectLink[] {
  const links: FeaturedProjectLink[] = [];
  const site = trimmed(project.href);
  const repo = trimmed(project.repoUrl);
  if (site) links.push({ kind: 'site', href: site });
  if (repo) links.push({ kind: 'repo', href: repo });
  return links;
}

/** Primary URL for plain-text fallbacks (site preferred, then repo). */
export function featuredProjectPrimaryUrl(project: FeaturedProjectLinkFields): string | undefined {
  const links = featuredProjectLinks(project);
  return links[0]?.href;
}

export type FeaturedProjectResumeFields = FeaturedProjectLinkFields & {
  name: string;
  description: string;
  keywords: string[];
};

/** JSON Resume–style project entry; omits missing URLs. */
export function resumeFeaturedProjectEntry(project: FeaturedProjectResumeFields): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    name: project.name,
    description: project.description
  };
  const site = trimmed(project.href);
  const repo = trimmed(project.repoUrl);
  if (site) entry.url = site;
  if (repo) entry.codeRepository = repo;
  entry.keywords = project.keywords;
  return entry;
}

export type FeaturedProjectSchemaFields = FeaturedProjectLinkFields & {
  name: string;
  tagline: string;
};

/** schema.org fragment for a featured project; omits missing URLs. */
export function featuredProjectSchemaOrg(project: FeaturedProjectSchemaFields): Record<string, unknown> {
  const base = {
    name: project.name,
    description: project.tagline
  };
  const site = trimmed(project.href);
  const repo = trimmed(project.repoUrl);
  if (repo) {
    return {
      '@type': 'SoftwareSourceCode',
      ...base,
      codeRepository: repo,
      ...(site ? { url: site } : {})
    };
  }
  if (site) {
    return {
      '@type': 'WebApplication',
      ...base,
      url: site
    };
  }
  return {
    '@type': 'SoftwareApplication',
    ...base
  };
}

/** Markdown bullet lines for pedro.md (Portuguese labels). */
export function featuredProjectPedroMdLines(project: FeaturedProjectLinkFields): string[] {
  const lines: string[] = [];
  const site = trimmed(project.href);
  const repo = trimmed(project.repoUrl);
  if (site) lines.push(`- App: ${site}`);
  if (repo) lines.push(`- Repositório: ${repo}`);
  return lines;
}

export type MdItemFn = (label: string, href: string, note?: string) => string;

/** Markdown list items for llms.txt. */
export function featuredProjectLlmsMdItems(project: FeaturedProjectLinkFields, mdItem: MdItemFn): string[] {
  const items: string[] = [];
  const site = trimmed(project.href);
  const repo = trimmed(project.repoUrl);
  if (repo) items.push(mdItem('Repositório', repo));
  if (site) items.push(mdItem('App', site));
  return items;
}

/** Serializes link fields for tests and guards against empty output. */
export function serializeFeaturedProjectLinks(project: FeaturedProjectLinkFields): string[] {
  return featuredProjectLinks(project).map((link) => link.href);
}
