import type { Components } from 'react-markdown';

export function safeMarkdownUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed, 'https://pherls.dev');
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') {
      return trimmed;
    }
  } catch {
    // Reject invalid URLs
  }
  return '';
}

export const proseTableComponents: Pick<Components, 'table' | 'th' | 'td'> = {
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border py-2 pr-8 text-left font-semibold text-ink last:pr-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border py-2 pr-8 align-top last:pr-0">{children}</td>
  )
};
