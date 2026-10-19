import { lazy, Suspense, useState } from 'react';
import { DEFAULT_PORTFOLIO_DATA } from './data/portfolioData';
import type { ChatMode } from './utils/chatGuardrails';
import { ExperienceSection } from './components/ExperienceSection';
import { Hero, IdentityColumn } from './components/Hero';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
const StickerLid = lazy(() => import('./components/stickers').then((module) => ({ default: module.StickerLid })));

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

  const assistant = assistantOpen ? (
    <Suspense fallback={null}>
      <AssistantPanel
        open={assistantOpen}
        mode={assistantMode}
        onOpenChange={setAssistantOpen}
        onModeChange={setAssistantMode}
        onOpenCv={() => setCvOpen(true)}
      />
    </Suspense>
  ) : null;

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
        onOpenCv={() => setCvOpen(true)}
      />

      <div className="mx-auto grid max-w-[calc(36ch+70ch+4rem)] px-4 pb-16 pt-6 lg:grid-cols-[minmax(18rem,36ch)_minmax(0,70ch)] lg:gap-x-16 lg:gap-y-10">
        <div className="contents lg:sticky lg:top-[4.25rem] lg:col-start-1 lg:row-span-2 lg:flex lg:flex-col lg:gap-8 lg:self-start">
          <IdentityColumn onOpenCv={() => setCvOpen(true)} />
          <div className="order-3 mt-8 lg:order-none lg:mt-0">
            <Suspense fallback={<div className="sticker-frame aspect-[3.6/1] w-full" />}>
              <StickerLid />
            </Suspense>
          </div>
        </div>

        <main id="conteudo" tabIndex={-1} className="order-2 min-w-0 lg:col-start-2">
          {assistant}
          <Hero
            onOpenJobFit={() => {
              setAssistantMode('jobfit');
              setAssistantOpen(true);
            }}
            onOpenCv={() => setCvOpen(true)}
          />
        </main>

        <div className="order-4 min-w-0 lg:col-start-2">
          <ExperienceSection />
          <div id="projeto" tabIndex={-1}>
            <Suspense fallback={<div className="min-h-[12rem]" />}>
              <ProjectSection />
            </Suspense>
          </div>
          <div id="formacao" tabIndex={-1}>
            <Suspense fallback={<div className="min-h-[12rem]" />}>
              <CredentialsSection />
            </Suspense>
          </div>
          <div id="sobre" tabIndex={-1}>
            <Suspense fallback={<div className="min-h-[12rem]" />}>
              <AboutSection />
            </Suspense>
          </div>
          <div id="contato" tabIndex={-1}>
            <Suspense fallback={<div className="min-h-[12rem]" />}>
              <ContactSection
                onOpenJobFit={() => {
                  setAssistantMode('jobfit');
                  setAssistantOpen(true);
                }}
                onOpenCv={() => setCvOpen(true)}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <SiteFooter onOpenInspector={() => setInspectorOpen(true)} />

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
