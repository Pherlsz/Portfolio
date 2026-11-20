import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { chatStore } from './chat/chatStore';
import ChatView from './chat/ChatView';
import { EditorialLoader } from './components/EditorialLoader';
import { DEFAULT_PORTFOLIO_DATA } from './data/portfolioData';
import { printConsoleBanner } from './easter/consoleBanner';
import { AppShell } from './shell/AppShell';
import { IntroCurtain } from './shell/IntroCurtain';

const NarratorOrb = lazy(() =>
  import('./components/NarratorOrb').then((mod) => ({ default: mod.NarratorOrb }))
);

const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((mod) => ({ default: mod.NotFoundPage }))
);

const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((mod) => ({ default: mod.ProjectsPage }))
);
const ExperiencePage = lazy(() =>
  import('./pages/ExperiencePage').then((mod) => ({ default: mod.ExperiencePage }))
);
const StudiesPage = lazy(() =>
  import('./pages/StudiesPage').then((mod) => ({ default: mod.StudiesPage }))
);
const ArticlesPage = lazy(() =>
  import('./pages/ArticlesPage').then((mod) => ({ default: mod.ArticlesPage }))
);
const AiFilesPage = lazy(() =>
  import('./pages/AiFilesPage').then((mod) => ({ default: mod.AiFilesPage }))
);
const V1Page = lazy(() => import('./v1/V1Page'));
const CvDocument = lazy(() =>
  import('./components/CvDocument').then((mod) => ({ default: mod.CvDocument }))
);

export default function App() {
  const [location, setLocation] = useLocation();
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    printConsoleBanner();
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches
    ) {
      setIsFinePointer(true);
    }
  }, []);

  useEffect(() => {
    const normalized =
      location.length > 1 && location.endsWith('/') ? location.slice(0, -1) : location;

    if (
      normalized === '/cv' ||
      normalized.startsWith('/cv/') ||
      normalized === '/v1' ||
      normalized.startsWith('/v1/')
    ) {
      return;
    }

    const { name, jobTitle } = DEFAULT_PORTFOLIO_DATA.profile;
    const baseTitle = `${name} · ${jobTitle}`;

    if (normalized === '/' || normalized.startsWith('/c/')) {
      document.title = baseTitle;
    } else if (normalized === '/projetos') {
      document.title = `Projetos · ${name}`;
    } else if (normalized.startsWith('/projetos/')) {
      const slug = normalized.slice('/projetos/'.length);
      const project = DEFAULT_PORTFOLIO_DATA.projects.find((item) => item.id === slug);
      document.title = project ? `${project.name} · Projetos · ${name}` : `Projetos · ${name}`;
    } else if (normalized === '/experiencia') {
      document.title = `Experiência e Currículo · ${name}`;
    } else if (normalized === '/estudos/certificados') {
      document.title = `Certificados · ${name}`;
    } else if (normalized === '/estudos' || normalized.startsWith('/estudos/')) {
      document.title = `Estudos · ${name}`;
    } else if (normalized === '/artigos' || normalized.startsWith('/artigos/')) {
      document.title = `Artigos · ${name}`;
    } else if (normalized === '/ai') {
      document.title = `AI / Arquivos · ${name}`;
    } else {
      document.title = `Página não encontrada · ${name}`;
    }
  }, [location]);

  const handleAskChat = useCallback(
    (prompt: string) => {
      setLocation('/');
      void chatStore.send(prompt, { chatId: null }).then((targetId) => {
        if (targetId) {
          setLocation(`/c/${targetId}`);
        }
      });
    },
    [setLocation]
  );

  const handleStartContact = useCallback(() => {
    handleAskChat('/contato');
  }, [handleAskChat]);

  return (
    <>
      <IntroCurtain />
      {isFinePointer ? (
        <Suspense fallback={null}>
          <NarratorOrb />
        </Suspense>
      ) : null}
      <Switch>
        <Route path="/v1">
          {() => (
            <div className="v1-scope">
              <Suspense fallback={<EditorialLoader />}>
                <V1Page />
              </Suspense>
            </div>
          )}
        </Route>

        <Route path="/cv">
          {() => (
            <div className="v1-scope">
              <Suspense fallback={<EditorialLoader />}>
                <CvDocument />
              </Suspense>
            </div>
          )}
        </Route>

        <Route>
          {() => (
            <AppShell onStartContact={handleStartContact}>
              <Suspense fallback={<EditorialLoader />}>
                <Switch>
                  <Route path="/">{() => <ChatView />}</Route>
                  <Route path="/c/:id">{(params) => <ChatView chatId={params.id} />}</Route>
                  <Route path="/projetos">{() => <ProjectsPage onAskChat={handleAskChat} />}</Route>
                  <Route path="/projetos/:slug">
                    {() => <ProjectsPage onAskChat={handleAskChat} />}
                  </Route>
                  <Route path="/experiencia">
                    {() => <ExperiencePage onAskChat={handleAskChat} />}
                  </Route>
                  <Route path="/estudos">{() => <StudiesPage onAskChat={handleAskChat} />}</Route>
                  <Route path="/estudos/certificados">
                    {() => <StudiesPage onAskChat={handleAskChat} />}
                  </Route>
                  <Route path="/estudos/:slug">
                    {() => <StudiesPage onAskChat={handleAskChat} />}
                  </Route>
                  <Route path="/artigos">{() => <ArticlesPage onAskChat={handleAskChat} />}</Route>
                  <Route path="/artigos/:slug">
                    {() => <ArticlesPage onAskChat={handleAskChat} />}
                  </Route>
                  <Route path="/ai">{() => <AiFilesPage />}</Route>
                  <Route>{() => <NotFoundPage />}</Route>
                </Switch>
              </Suspense>
            </AppShell>
          )}
        </Route>
      </Switch>
    </>
  );
}
