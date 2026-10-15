import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { DEFAULT_PORTFOLIO_DATA } from './data/portfolioData';
import type { ChatMode } from './utils/chatGuardrails';
import { AboutSection } from './components/AboutSection';
import { AiFriendlyInspectorModal } from './components/AiFriendlyInspectorModal';
import { AssistantPanel } from './components/AssistantPanel';
import { ContactSection } from './components/ContactSection';
import { CredentialsSection } from './components/CredentialsSection';
import { ExperienceSection } from './components/ExperienceSection';
import { Hero } from './components/Hero';
import { ProjectSection } from './components/ProjectSection';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';

export default function App() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<ChatMode>('chat');
  const [inspectorOpen, setInspectorOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
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
        <ProjectSection />
        <CredentialsSection />
        <AboutSection />
        <ContactSection />
      </main>

      <SiteFooter onOpenInspector={() => setInspectorOpen(true)} />

      <AssistantPanel
        open={assistantOpen}
        mode={assistantMode}
        onOpenChange={setAssistantOpen}
        onModeChange={setAssistantMode}
      />
      <AiFriendlyInspectorModal
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        portfolioData={DEFAULT_PORTFOLIO_DATA}
      />
    </MotionConfig>
  );
}
