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

export default function App() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<ChatMode>('chat');
  const [inspectorOpen, setInspectorOpen] = useState(false);

  return (
    <>
      <nav aria-label="Atalhos" className="skip-nav">
        <a
          href="#conteudo"
          className="skip-link"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById('conteudo')?.focus();
          }}
        >
          Pular para o conteúdo
        </a>
        <button type="button" className="skip-link" onClick={() => setAssistantOpen(true)}>
          Abrir assistente
        </button>
      </nav>
      <SiteHeader
        onOpenAssistant={() => {
          setAssistantMode('chat');
          setAssistantOpen(true);
        }}
      />

      <main id="conteudo" tabIndex={-1} className="divide-y divide-line">
        <Hero
          onOpenJobFit={() => {
            setAssistantMode('jobfit');
            setAssistantOpen(true);
          }}
        />
        <ExperienceSection />
        <div id="projeto" className="scroll-mt-20">
          <Suspense fallback={<div className="min-h-[28rem]" />}>
            <ProjectSection />
          </Suspense>
        </div>
        <div id="formacao" className="scroll-mt-20">
          <Suspense fallback={<div className="min-h-[32rem]" />}>
            <CredentialsSection />
          </Suspense>
        </div>
        <div id="sobre" className="scroll-mt-20">
          <Suspense fallback={<div className="min-h-[28rem]" />}>
            <AboutSection />
          </Suspense>
        </div>
        <div id="contato" className="scroll-mt-20">
          <Suspense fallback={<div className="min-h-[24rem]" />}>
            <ContactSection />
          </Suspense>
        </div>
      </main>

      <SiteFooter onOpenInspector={() => setInspectorOpen(true)} />

      {assistantOpen ? (
        <Suspense fallback={null}>
          <AssistantPanel
            open={assistantOpen}
            mode={assistantMode}
            onOpenChange={setAssistantOpen}
            onModeChange={setAssistantMode}
          />
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
