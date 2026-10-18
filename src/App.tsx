import { lazy, Suspense, useState } from 'react';
import { DEFAULT_PORTFOLIO_DATA } from './data/portfolioData';
import type { ChatMode } from './utils/chatGuardrails';
import { ExperienceSection } from './components/ExperienceSection';
import { Hero } from './components/Hero';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';

const ProjectSection = lazy(() =>
  import('./components/ProjectSection').then((module) => ({ default: module.ProjectSection }))
);
const CredentialsSection = lazy(() =>
  import('./components/CredentialsSection').then((module) => ({ default: module.CredentialsSection }))
);
const AboutSection = lazy(() =>
  import('./components/AboutSection').then((module) => ({ default: module.AboutSection }))
);
const ContactSection = lazy(() =>
  import('./components/ContactSection').then((module) => ({ default: module.ContactSection }))
);
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<ChatMode>('chat');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [cvOpen, setCvOpen] = useState(false);

  const openAssistant = (mode: ChatMode) => {
    setAssistantMode(mode);
    setAssistantOpen(true);
  };

  return (
    <>
      <nav aria-label="Atalhos" className="skip-nav">
        <a
          href="#inicio"
          className="skip-link"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById('inicio')?.focus();
          }}
        >
          Pular para o conteúdo
        </a>
        <button type="button" className="skip-link" onClick={() => openAssistant('chat')}>
          Abrir assistente
        </button>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(17.5rem,23rem)_minmax(0,1fr)]">
        <header className="border-b border-line px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-8">
          <SiteHeader onOpenAssistant={() => openAssistant('chat')} onOpenCv={() => setCvOpen(true)} />
          <Hero onOpenCv={() => setCvOpen(true)} />
        </header>

        <div className="min-w-0">
          <main id="conteudo" tabIndex={-1}>
            <div id="projeto">
              <Suspense fallback={<div className="min-h-64" />}>
                <ProjectSection />
              </Suspense>
            </div>
            <ExperienceSection />
            <div id="formacao">
              <Suspense fallback={<div className="min-h-64" />}>
                <CredentialsSection />
              </Suspense>
            </div>
            <div id="sobre">
              <Suspense fallback={<div className="min-h-48" />}>
                <AboutSection />
              </Suspense>
            </div>
            <div id="contato">
              <Suspense fallback={<div className="min-h-64" />}>
                <ContactSection
                  onOpenJobFit={() => openAssistant('jobfit')}
                  onOpenCv={() => setCvOpen(true)}
                />
              </Suspense>
            </div>
          </main>
          <SiteFooter onOpenInspector={() => setInspectorOpen(true)} />
        </div>
      </div>

      {assistantOpen ? (
        <Suspense fallback={null}>
          <AssistantPanel
            open={assistantOpen}
            mode={assistantMode}
            onOpenChange={setAssistantOpen}
            onModeChange={setAssistantMode}
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
