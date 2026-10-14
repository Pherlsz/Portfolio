import React, { useState, useEffect } from 'react';
import {
  DEFAULT_PORTFOLIO_DATA,
  ProjectItem,
  generateJsonLdSchema,
  generateLlmsTxt
} from './data/portfolioData';
import { InteractiveProjectsShowcase } from './components/InteractiveProjectsShowcase';
import { CreativeCertBadges } from './components/CreativeCertBadges';
import { FloatingDockNavbar } from './components/FloatingDockNavbar';
import { AiFriendlyInspectorModal } from './components/AiFriendlyInspectorModal';
import {
  StickerMorcega,
  StickerBanguela,
  StickerTomada,
  StickerD20,
  StickerGincanaCipher,
  StickerGymEsports,
  StickerCoffee,
  StickerBuilderHammer,
  AmbientBackgroundCanvas
} from './components/CreativeStickers';
import {
  ArrowUpRight,
  Download,
  ExternalLink,
  FileCode2,
  Layers,
  Mail,
  MapPin,
  Sparkles,
  X
} from 'lucide-react';

const CORE_TECH_FILTERS = [
  'TypeScript',
  'React',
  'Node.js',
  'WebSockets',
  'PostgreSQL',
  'Tailwind CSS'
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const portfolioData = DEFAULT_PORTFOLIO_DATA;

  const [highlightedTech, setHighlightedTech] = useState<string | null>(null);
  const [lightboxProject, setLightboxProject] = useState<ProjectItem | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'llms' | 'schema' | 'guardrails'>('llms');
  const [externalChatTrigger, setExternalChatTrigger] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [expandedExpIds, setExpandedExpIds] = useState<Record<string, boolean>>({
    'exp-1': true,
    'exp-2': true,
    'exp-3': false
  });

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Keep JSON-LD script in <head> synced for AI Crawlers
  useEffect(() => {
    const scriptEl = document.getElementById('ai-schema-jsonld');
    if (scriptEl) {
      scriptEl.textContent = JSON.stringify(generateJsonLdSchema(portfolioData), null, 2);
    }
  }, [portfolioData]);

  // Close Lightbox or Modal on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxProject(null);
        setInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const openInspector = (tab: 'llms' | 'schema' | 'guardrails' = 'llms') => {
    setInspectorTab(tab);
    setInspectorOpen(true);
  };

  const toggleExperienceExpand = (id: string) => {
    setExpandedExpIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      itemScope
      itemType="https://schema.org/Person"
      className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] pt-24 sm:pt-28 pb-20 transition-colors duration-200 overflow-x-hidden"
    >
      {/* =====================================================================
          UNDER-THE-HOOD AI-FRIENDLY SEMANTIC DOSSIER FOR LLM AGENTS & SCRAPERS
          ===================================================================== */}
      <article
        id="ai-recruiter-structured-dossier"
        aria-label="Structured Machine-Readable Dossier for AI Recruiter Agents"
        className="sr-only"
      >
        <h1 itemProp="name">{portfolioData.profile.name}</h1>
        <p itemProp="jobTitle">Senior Frontend & Full-Stack Software Engineer</p>
        <p itemProp="email">{portfolioData.profile.email}</p>
        <p itemProp="address">{portfolioData.profile.location}</p>
        <pre>{generateLlmsTxt(portfolioData)}</pre>
      </article>

      {/* =====================================================================
          SINGLE FLOATING TOP NAVBAR: [Menu] — [Locked AI Input] — [Export + Theme]
          ===================================================================== */}
      <FloatingDockNavbar
        theme={theme}
        onToggleTheme={toggleTheme}
        portfolioData={portfolioData}
        onOpenAiInspector={openInspector}
        onFilterTech={(tech) => setHighlightedTech(tech)}
        externalChatOpen={externalChatTrigger}
        onExternalChatClose={() => setExternalChatTrigger(false)}
      />

      {/* =====================================================================
          MAIN PORTFOLIO CONTENT (1440px Desktop Grid & Mobile-First Ergonomics)
          ===================================================================== */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 space-y-24 sm:space-y-28">
        {/* -------------------------------------------------------------------
            HERO SPLIT SECTION + EDITORIAL PHOTO WITH INTERACTIVE STICKERS
            ------------------------------------------------------------------- */}
        <section id="inicio" className="space-y-8 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left Column: Typographic Hierarchy & Primary Recruiter Actions */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8 py-1">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                    <MapPin className="w-3.5 h-3.5 text-[#E11D48]" />
                    {portfolioData.profile.location}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{portfolioData.profile.availability}</span>
                </div>

                <h1 className="font-display text-[clamp(2.25rem,4vw,3.75rem)] font-bold tracking-tight leading-[1.07] text-[var(--text-primary)] max-w-2xl">
                  {portfolioData.profile.headline}
                </h1>

                <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                  {portfolioData.profile.subheadline}
                </p>
              </div>

              {/* Hero CTAs */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#projetos"
                    className="min-h-[48px] px-6 py-3 rounded-xl bg-[#E11D48] hover:bg-[#be123c] text-white text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <span>Explorar Projetos</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => openInspector('llms')}
                    className="min-h-[48px] px-5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-sm font-medium text-[var(--text-primary)] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Download className="w-4 h-4 text-[#E11D48]" />
                    <span>Exportar Currículo / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExternalChatTrigger(true)}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-transparent border border-[var(--border-subtle)] hover:border-zinc-500 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-[#E11D48]" />
                    Avaliar Fit com Vaga
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[var(--text-muted)]">
                  <span>TypeScript Strict</span>
                  <span aria-hidden="true">·</span>
                  <span>React 19</span>
                  <span aria-hidden="true">·</span>
                  <span>Node.js</span>
                  <span aria-hidden="true">·</span>
                  <span>WebSockets</span>
                  <span aria-hidden="true">·</span>
                  <span>Mobile-First 44px+</span>
                  <span aria-hidden="true">·</span>
                  <span>Schema.org + /llms.txt</span>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Workspace Visual + Interactive Die-Cut Stickers on Corners */}
            <div className="lg:col-span-5 relative flex items-center">
              <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-zinc-950">
                {!heroImgError ? (
                  <img
                    src={portfolioData.profile.heroImage}
                    alt="Setup minimalista de engenharia de software de Pedro Lopes"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6 text-zinc-500 font-mono text-xs">
                    Pedro H. Lopes · Engenharia de Software
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-16 text-xs font-mono text-zinc-200">
                  <div className="text-zinc-400">Rio Grande do Sul, Brasil</div>
                  <div className="text-white font-medium mt-0.5">
                    Arquitetura limpa · Clique nos stickers espalhados pela página
                  </div>
                </div>
              </div>

              {/* Scattered Sticker #1: D20 RPG Die on Top-Right Corner of Hero */}
              <div className="absolute -top-4 -right-2 sm:-right-4 z-20">
                <StickerD20 />
              </div>

              {/* Scattered Sticker #2: Morcega sleeping on Bottom-Right Corner of Hero */}
              <div className="absolute -bottom-4 right-3 sm:right-6 z-20">
                <StickerMorcega />
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Engineering Metric Strip Below Hero Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {portfolioData.profile.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-1"
              >
                <div className="text-xs font-mono text-[var(--text-muted)]">{metric.label}</div>
                <div className="font-display text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                  {metric.value}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{metric.context}</div>
              </div>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 01: EXPERIÊNCIAS PROFISSIONAIS + INTERACTIVE STACK X-RAY
            ------------------------------------------------------------------- */}
        <section id="experiencias" className="space-y-8 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[var(--text-muted)]">
                01. Engenharia de Software & Impacto Real
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
                Experiências Profissionais
              </h2>
            </div>

            {/* Scattered Sticker #3: Gincana RS Cipher Wheel */}
            <StickerGincanaCipher />
          </div>

          {/* Interactive Stack X-Ray Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <Layers className="w-4 h-4 text-[#E11D48]" />
              <span>Raio-X de Stack (destaca Experiências e Projetos abaixo):</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHighlightedTech(null)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  highlightedTech === null
                    ? 'bg-[#E11D48] text-white'
                    : 'bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Todas
              </button>
              {CORE_TECH_FILTERS.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() =>
                    setHighlightedTech((prev) => (prev === tech ? null : tech))
                  }
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                    highlightedTech === tech
                      ? 'bg-[#E11D48] text-white'
                      : 'bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          {/* Experiences List */}
          <div className="space-y-5">
            {portfolioData.experiences.map((exp, idx) => {
              const isExpanded = !!expandedExpIds[exp.id];
              const isTechHighlighted =
                highlightedTech &&
                exp.stack.some((t) => t.toLowerCase() === highlightedTech.toLowerCase());

              return (
                <article
                  key={exp.id}
                  className={`rounded-2xl border p-6 sm:p-7 transition-all bg-[var(--bg-surface)] ${
                    isTechHighlighted
                      ? 'border-[#E11D48] ring-1 ring-[#E11D48]/30'
                      : 'border-[var(--border-subtle)] hover:border-zinc-500/60'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left 4 Cols: Period, Company, Impact */}
                    <div className="lg:col-span-4 space-y-1.5">
                      <div className="text-xs font-mono text-[var(--text-muted)] tabular-nums">
                        0{idx + 1} · {exp.period}
                      </div>
                      <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                        {exp.company}
                      </h3>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {exp.location} · {exp.type}
                      </div>
                      <div className="pt-2 text-xs font-mono text-[#E11D48] font-semibold">
                        {exp.impactMetric}
                      </div>
                    </div>

                    {/* Right 8 Cols: Role, Summary, Architectural Decision & Highlights */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                          {exp.role}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleExperienceExpand(exp.id)}
                          className="min-h-[34px] px-3 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0"
                        >
                          {isExpanded ? 'Recolher Detalhes' : 'Ver Arquitetura & Entregas'}
                        </button>
                      </div>

                      <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                        {exp.summary}
                      </p>

                      {isExpanded && (
                        <div className="space-y-4 pt-1">
                          <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                            <div className="text-xs font-mono text-[var(--text-primary)] font-semibold">
                              Decisão de Arquitetura em Destaque
                            </div>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                              {exp.architectureHighlight}
                            </p>
                          </div>

                          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            {exp.highlights.map((item, hIdx) => (
                              <li key={hIdx} className="flex items-start gap-2.5">
                                <span className="font-mono text-xs text-[#E11D48] mt-1">→</span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Unboxed Stack Metadata */}
                      <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-[var(--text-muted)]">
                        {exp.stack.map((tech, tIdx) => {
                          const isMatch =
                            highlightedTech &&
                            tech.toLowerCase() === highlightedTech.toLowerCase();
                          return (
                            <React.Fragment key={tech}>
                              <span
                                className={
                                  isMatch
                                    ? 'text-[#E11D48] font-bold underline underline-offset-4'
                                    : 'text-[var(--text-secondary)]'
                                }
                              >
                                {tech}
                              </span>
                              {tIdx < exp.stack.length - 1 && <span aria-hidden="true">·</span>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 02: COMPACT 3-COLUMN PROJETOS & BLUEPRINTS INTERATIVOS
            ------------------------------------------------------------------- */}
        <section id="projetos" className="space-y-8 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[var(--text-muted)]">
                02. Sistemas em Produção · Preview, Nodes & Código
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
                Projetos em Destaque
              </h2>
            </div>

            {/* Scattered Sticker #4: Banguela (petite cat with 1 fang!) */}
            <StickerBanguela />
          </div>

          <InteractiveProjectsShowcase
            projects={portfolioData.projects}
            highlightedTech={highlightedTech}
            onSelectProjectLightbox={(proj) => setLightboxProject(proj)}
          />
        </section>

        {/* -------------------------------------------------------------------
            SECTION 03: CERTIFICAÇÕES COM BADGES CRIATIVAS
            ------------------------------------------------------------------- */}
        <section id="certificacoes" className="space-y-8 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[var(--text-muted)]">
                03. Credenciais & Selos Vetoriais
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
                Certificações & Insígnias
              </h2>
            </div>

            {/* Scattered Sticker #5: Tomada (220V electric kitten!) */}
            <StickerTomada />
          </div>

          <CreativeCertBadges certifications={portfolioData.certifications} />
        </section>

        {/* -------------------------------------------------------------------
            SECTION 04: SOBRE MIM & COLEÇÃO DE STICKERS INTERATIVOS
            ------------------------------------------------------------------- */}
        <section id="sobre" className="space-y-6 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[var(--text-muted)]">
                04. Perfil, Filosofia & Bastidores
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Sobre Mim
              </h2>
            </div>

            {/* Scattered Sticker #6: Gym & E-Sports Barbell Sticker */}
            <StickerGymEsports />
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              {portfolioData.profile.aboutParagraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Interactive Sticker Strip at the bottom of About */}
            <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono text-[var(--text-primary)] font-semibold">
                  Stickers Interativos de Bastidores
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Passe o mouse ou clique nas 3 gatas (Morcega, Banguela e Tomada), no dado D20 de
                  RPG, no dossiê de dados do Setor de Diversas (Gincanas RS), no café ou no halter:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-0">
                <StickerMorcega />
                <StickerBanguela />
                <StickerTomada />
                <StickerD20 />
                <StickerGincanaCipher />
                <StickerGymEsports />
                <StickerCoffee />
                <StickerBuilderHammer />
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            SECTION 05: ARQUITETURA AI-FRIENDLY & EXPORTAÇÃO PARA RECRUTADORES
            ------------------------------------------------------------------- */}
        <section
          id="ai-inspector"
          className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-10 space-y-8 scroll-mt-24"
        >
          {/* Extra scattered sticker on the AI-Inspector corner */}
          <div className="hidden sm:block absolute -top-6 right-8 z-20">
            <StickerBuilderHammer />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-mono text-[#E11D48]">
                05. Por Baixo dos Panos · AI-Friendly & Recruiter Export
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Pronto para Agentes de IA & Exportação Instantânea.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                Se um recrutador colocar um agente autônomo para varrer este portfólio, o sistema
                entrega o dossiê completo via{' '}
                <code className="font-mono text-[#E11D48]">/llms.txt</code>,{' '}
                <code className="font-mono text-[#E11D48]">/ai.json</code> e microdados{' '}
                <code className="font-mono">Schema.org/Person</code>. Você também pode exportar o
                currículo completo em Markdown ou PDF com um clique.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openInspector('llms')}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#be123c] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Currículo / Ver JSON-LD
                </button>

                <button
                  type="button"
                  onClick={() => openInspector('guardrails')}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-xs font-mono text-[var(--text-primary)] transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>Prompt Compacto & Zod Guardrail</span>
                </button>

                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-xs font-mono text-[var(--text-primary)] transition-colors flex items-center gap-2"
                >
                  <span>Abrir /llms.txt</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href="/ai.json"
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-xs font-mono text-[var(--text-primary)] transition-colors flex items-center gap-2"
                >
                  <span>Abrir /ai.json</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Right 5 Cols: Live Machine-Readable Preview Card */}
            <div className="lg:col-span-5 rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-2">
                <span>GET /llms.txt · 200 OK</span>
                <span>Schema.org/Person</span>
              </div>
              <pre className="text-[11px] leading-relaxed text-emerald-400 overflow-x-auto">
{`{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "${portfolioData.profile.name}",
  "email": "${portfolioData.profile.email}",
  "jobTitle": "Senior Software Engineer",
  "aiEndpoints": ["/llms.txt", "/ai.json", "/cv-pedro-lopes.md"]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            CLEAN EDITORIAL FOOTER
            ------------------------------------------------------------------- */}
        <footer className="border-t border-[var(--border-subtle)] pt-10 pb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-[var(--text-secondary)]">
          <div className="space-y-1">
            <div className="font-display font-bold text-sm text-[var(--text-primary)]">
              {portfolioData.profile.name}
            </div>
            <p className="font-mono text-[var(--text-muted)]">
              Mobile-First · AI-Friendly · Rio Grande do Sul, Brasil
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <StickerCoffee />
            <a
              href={`mailto:${portfolioData.profile.email}`}
              className="hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>{portfolioData.profile.email}</span>
            </a>
            <button
              type="button"
              onClick={() => openInspector('llms')}
              className="hover:text-[var(--text-primary)] underline underline-offset-4 transition-colors flex items-center gap-1"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Exportar CV / Dados IA</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Ambient Interactive Background Layer (Grid + Margin Runes/Paws) */}
      <AmbientBackgroundCanvas />

      {/* =====================================================================
          FULLSCREEN PROJECT LIGHTBOX MODAL
          ===================================================================== */}
      {lightboxProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do projeto ${lightboxProject.title}`}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative h-56 sm:h-72 bg-zinc-950 shrink-0">
              <img
                src={lightboxProject.image}
                alt={lightboxProject.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setLightboxProject(null)}
                aria-label="Fechar visualização do projeto"
                className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-xl bg-black/75 text-white border border-white/20 flex items-center justify-center hover:bg-[#E11D48] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              <div className="text-xs font-mono text-[var(--text-muted)]">
                {lightboxProject.kicker} · {lightboxProject.year} · {lightboxProject.role}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {lightboxProject.title}
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {lightboxProject.summary}
              </p>
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                <div className="text-xs font-mono text-[var(--text-primary)] font-semibold">
                  Notas de Arquitetura
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {lightboxProject.architectureNotes}
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-mono text-[var(--text-muted)]">
                  Resultados & Métricas Verificadas
                </div>
                {lightboxProject.metrics.map((m, i) => (
                  <div key={i} className="text-xs sm:text-sm font-mono text-[var(--text-primary)]">
                    ✓ {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          RECRUITER CV EXPORT & AI-FRIENDLY INSPECTOR MODAL
          ===================================================================== */}
      <AiFriendlyInspectorModal
        isOpen={inspectorOpen}
        initialTab={inspectorTab}
        onClose={() => setInspectorOpen(false)}
        portfolioData={portfolioData}
      />
    </div>
  );
}
