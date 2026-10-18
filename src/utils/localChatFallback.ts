import {
  availabilityLine,
  CONTACT_API,
  DEFAULT_PORTFOLIO_DATA,
  formatRoleTimeline,
  plainText,
  skillNames,
  type PortfolioData
} from '../data/portfolioData.ts';
import { buildJobFitReply } from './jobFit.ts';
import { mentionsPersonalProject } from './chatGuardrails.ts';

export function buildLocalFallback(
  query: string,
  mode: 'chat' | 'jobfit',
  data: PortfolioData = DEFAULT_PORTFOLIO_DATA
): string {
  const q = query.toLowerCase();
  const { profile, project, featuredProjects, experiences, skills, pets } = data;
  const atlas = experiences[0];

  if (mode === 'jobfit') {
    return buildJobFitReply(query, data);
  }

  if (q.includes('gata') || q.includes('gato') || pets.some((p) => q.includes(p.name.toLowerCase()))) {
    return `O Pedro divide o escritório com três gatos pretos:\n${pets.map((p) => `- **${p.name}**: ${p.bio}`).join('\n')}`;
  }
  if (q.includes('wcag') || q.includes('acessib') || q.includes('design system')) {
    const ds = atlas.highlights.find((h) => h.metric === '30+ componentes');
    return `**Design system e WCAG**\n- ${ds?.text ?? 'Design system modular em conformidade com WCAG 2.1 AA.'}\n- Também estabilizou listagens com 5.000+ registros (TanStack Virtual) e cobriu fluxos críticos com Vitest e React Testing Library.`;
  }
  if (q.includes('projet') || mentionsPersonalProject(query, data)) {
    const featured = featuredProjects
      .map((item) => `- **${item.name}**: ${item.tagline} (${item.repoUrl ?? item.href})`)
      .join('\n');
    return `Ferramentas em destaque:\n${featured}\n\nOutro projeto: **${project.name}** (${project.language}, ${project.version}): ${project.tagline}\nCódigo: ${project.repoUrl}`;
  }
  if (
    q.includes('salar') ||
    q.includes('pretens') ||
    q.includes('remoto') ||
    q.includes('híbrid') ||
    q.includes('hibrid') ||
    q.includes('presencial') ||
    q.includes('pleno') ||
    q.includes('júnior') ||
    q.includes('junior') ||
    q.includes('senioridade')
  ) {
    return `**Disponibilidade**\n- ${availabilityLine(profile)}`;
  }
  if (q.includes('contato') || q.includes('mensagem') || q.includes('e-mail') || q.includes('email')) {
    return `O jeito mais rápido é o e-mail **${profile.email}**. Pessoas usam o formulário em #contato. Agentes de IA enviam \`POST ${CONTACT_API.path}\` com JSON \`{ "name", "email", "message", "source": "agent" }\`.`;
  }
  if (q.includes('stack') || q.includes('tecnologia') || q.includes('skill')) {
    return skills.map((g) => `- **${g.name}**: ${skillNames(g).join(', ')}`).join('\n');
  }
  if (q.includes('experi') || q.includes('carreira') || q.includes('trabalh') || q.includes('resumo')) {
    return `**${profile.name}** é ${profile.jobTitle}. ${plainText(profile.summary)}\n${experiences
      .map((e) => `- **${e.company}**: ${formatRoleTimeline(e)}`)
      .join('\n')}`;
  }
  return `**${profile.name}** é ${profile.jobTitle} no ${profile.location}. ${plainText(profile.summary)} Status: ${profile.status.toLowerCase()}.`;
}
