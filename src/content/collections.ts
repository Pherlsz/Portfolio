export interface CanvasNode {
  id: string;
  tag?: string;
  label: string;
  summary?: string;
  detail?: string;
  x: number;
  y: number;
}

export interface CanvasEdge {
  from: string;
  to: string;
  label?: string;
}

export interface CanvasBlockData {
  title: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface CodePreviewBlockData {
  title: string;
  language: string;
  previewLabel?: string;
  code: string;
}

export interface SpecTabItem {
  id: string;
  label: string;
  language: string;
  content: string;
}

export interface SpecTabsBlockData {
  title: string;
  tabs: SpecTabItem[];
}

export type ContentSegment =
  | { type: 'markdown'; content: string }
  | { type: 'canvas'; data: CanvasBlockData }
  | { type: 'code-preview'; data: CodePreviewBlockData }
  | { type: 'spec-tabs'; data: SpecTabsBlockData };

export type RichBlockKind = 'canvas' | 'code-preview' | 'spec-tabs';

export interface ContentDocument {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  readingTime: string;
  category: string;
  tags: string[];
  body: string;
  segments: ContentSegment[];
  richBlocks: RichBlockKind[];
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const normalized = raw.replace(/\r\n/g, '\n').trimStart();
  if (!normalized.startsWith('---\n')) {
    return { data: {}, body: normalized };
  }
  const endIndex = normalized.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { data: {}, body: normalized };
  }
  const header = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 5).trim();
  const data: Record<string, unknown> = {};

  for (const line of header.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(',').map((item) => item.trim().replace(/^["']|["']$/g, ''))
        : [];
    } else {
      data[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return { data, body };
}

function asRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid frontmatter field "${field}"`);
  }
  return value.trim();
}

const DIRECTIVE_RE = /^:::(canvas|code-preview|spec-tabs)\s*\n([\s\S]*?)\n:::\s*$/gm;

export function parseContentSegments(body: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let cursor = 0;

  for (const match of body.matchAll(DIRECTIVE_RE)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      const md = body.slice(cursor, start).trim();
      if (md) segments.push({ type: 'markdown', content: md });
    }

    const kind = match[1] as RichBlockKind;
    const payload = match[2].trim();
    try {
      const parsed = JSON.parse(payload);
      if (kind === 'canvas') {
        segments.push({ type: 'canvas', data: parsed as CanvasBlockData });
      } else if (kind === 'code-preview') {
        segments.push({ type: 'code-preview', data: parsed as CodePreviewBlockData });
      } else if (kind === 'spec-tabs') {
        segments.push({ type: 'spec-tabs', data: parsed as SpecTabsBlockData });
      }
    } catch {
      segments.push({ type: 'markdown', content: match[0] });
    }

    cursor = start + match[0].length;
  }

  if (cursor < body.length) {
    const tail = body.slice(cursor).trim();
    if (tail) segments.push({ type: 'markdown', content: tail });
  }

  return segments;
}

export function parseMarkdownCollection(rawMap: Record<string, string>): ContentDocument[] {
  const docs: ContentDocument[] = [];
  for (const raw of Object.values(rawMap)) {
    const { data, body } = parseFrontmatter(raw);
    const slug = asRequiredString(data.slug, 'slug');
    const title = asRequiredString(data.title, 'title');
    const summary = asRequiredString(data.summary, 'summary');
    const publishedAt = asRequiredString(data.publishedAt, 'publishedAt');
    const readingTime = asRequiredString(data.readingTime, 'readingTime');
    const category = asRequiredString(data.category, 'category');
    const tags = Array.isArray(data.tags)
      ? data.tags.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    const segments = parseContentSegments(body);
    const richBlocks = Array.from(
      new Set(
        segments
          .filter(
            (segment): segment is Exclude<ContentSegment, { type: 'markdown' }> =>
              segment.type !== 'markdown'
          )
          .map((segment) => segment.type)
      )
    );

    docs.push({
      slug,
      title,
      summary,
      publishedAt,
      readingTime,
      category,
      tags,
      body,
      segments,
      richBlocks
    });
  }
  return docs.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function loadRawStudies(): Record<string, string> {
  try {
    return import.meta.glob('../../content/studies/*.md', {
      query: '?raw',
      import: 'default',
      eager: true
    }) as Record<string, string>;
  } catch {
    return {};
  }
}

function loadRawArticles(): Record<string, string> {
  try {
    return import.meta.glob('../../content/articles/*.md', {
      query: '?raw',
      import: 'default',
      eager: true
    }) as Record<string, string>;
  } catch {
    return {};
  }
}

export const STUDIES: ContentDocument[] = parseMarkdownCollection(loadRawStudies());
export const ARTICLES: ContentDocument[] = parseMarkdownCollection(loadRawArticles());

export function findStudyBySlug(slug: string): ContentDocument | undefined {
  return STUDIES.find((study) => study.slug === slug);
}

export function findArticleBySlug(slug: string): ContentDocument | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}
