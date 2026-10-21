import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { Sparkles } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from './data/portfolioData';
import { createAssistantSession } from './utils/assistantSession';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { CredentialsSection } from './components/CredentialsSection';
import { CTA } from './components/CTA';
import { ExperienceSection } from './components/ExperienceSection';
import { Hero } from './components/Hero';
import { ProjectSection } from './components/ProjectSection';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { handleSmoothScrollClick, smoothScrollToSection } from './components/ui';

const AssistantPanel = lazy(() =>
  import('./components/AssistantPanel').then((module) => ({ default: module.AssistantPanel }))
);
const AiFriendlyInspectorModal = lazy(() =>
  import('./components/AiFriendlyInspectorModal').then((module) => ({
    default: module.AiFriendlyInspectorModal
  }))
);
const CvPreviewModal = lazy(() =>
  import('./components/CvPreviewModal').then((module) => ({ default: module.CvPreviewModal }))
);

export default function App() {
  const [assistantSession] = useState(() => createAssistantSession());
  const assistantState = useSyncExternalStore(
    assistantSession.subscribe,
    assistantSession.getState,
    assistantSession.getState
  );
  const [hasOpenedAssistant, setHasOpenedAssistant] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [cvOpen, setCvOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const openAssistant = (mode?: 'chat' | 'jobfit') => {
    if (mode) assistantSession.setMode(mode);
    setHasOpenedAssistant(true);
    assistantSession.setOpen(true);
  };

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        assistantSession.resetForPageNavigation();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [assistantSession]);

  useEffect(() => {
    if (!window.location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      smoothScrollToSection(window.location.hash);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (cvOpen || inspectorOpen) return;

      const hasCommandModifier = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
      if (!hasCommandModifier || event.key.toLowerCase() !== 'k') return;

      event.preventDefault();
      const nextOpen = !assistantSession.getState().open;
      if (nextOpen) setHasOpenedAssistant(true);
      assistantSession.setOpen(nextOpen);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantSession, cvOpen, inspectorOpen]);

  return (
    <>
      <nav aria-label="Atalhos" className="skip-nav">
        <a
          href="#conteudo"
          className="skip-link"
          onClick={(event) => handleSmoothScrollClick(event, 'conteudo', 0)}
        >
          Pular para o conteúdo
        </a>
        <button
          type="button"
          className="skip-link"
          aria-keyshortcuts="Control+K Meta+K"
          onClick={() => openAssistant()}
        >
          Abrir assistente
        </button>
      </nav>
      <SiteHeader
        onOpenAssistant={() => openAssistant('chat')}
        onOpenCv={() => setCvOpen(true)}
      />

      <main id="conteudo" tabIndex={-1} className="divide-y divide-line">
        <Hero
          onOpenJobFit={() => openAssistant('jobfit')}
          onOpenCv={() => setCvOpen(true)}
        />
        <ExperienceSection selectedSkill={selectedSkill} onSelectSkill={setSelectedSkill} />
        <div id="projeto" tabIndex={-1}>
          <ProjectSection selectedSkill={selectedSkill} onSelectSkill={setSelectedSkill} />
        </div>
        <div id="formacao" tabIndex={-1}>
          <CredentialsSection selectedSkill={selectedSkill} onSelectSkill={setSelectedSkill} />
        </div>
        <div id="sobre" tabIndex={-1}>
          <AboutSection />
        </div>
        <div id="contato" tabIndex={-1}>
          <ContactSection />
        </div>
      </main>

      <SiteFooter onOpenInspector={() => setInspectorOpen(true)} />

      {!assistantState.open && (
        <CTA
          variant="secondary"
          onClick={() => openAssistant('chat')}
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-controls="assistente"
          aria-keyshortcuts="Control+K Meta+K"
          className="no-print fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 bg-surface/95 shadow-lg shadow-neutral-950/20 backdrop-blur-xs sm:right-5"
          icon={<Sparkles className="size-4" aria-hidden="true" />}
        >
          <span className="sm:hidden">Perguntar</span>
          <span className="hidden sm:inline">Pergunte sobre o Pedro</span>
        </CTA>
      )}

      {hasOpenedAssistant || assistantState.open ? (
        <Suspense fallback={null}>
          <AssistantPanel
            session={assistantSession}
            open={assistantState.open}
            mode={assistantState.mode}
            onOpenChange={assistantSession.setOpen}
            onModeChange={assistantSession.setMode}
            onOpenCv={() => setCvOpen(true)}
          />
        </Suspense>
      ) : null}
      {cvOpen ? (
        <Suspense fallback={null}>
          <CvPreviewModal open={cvOpen} onClose={() => setCvOpen(false)} />
        </Suspense>
      ) : null}
      {inspectorOpen ? (
        <Suspense fallback={null}>
          <AiFriendlyInspectorModal
            open={inspectorOpen}
            onClose={() => setInspectorOpen(false)}
            portfolioData={DEFAULT_PORTFOLIO_DATA}
          />
        </Suspense>
      ) : null}
    </>
  );
}
