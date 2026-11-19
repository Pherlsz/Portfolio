import { lazy, Suspense, useCallback, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { chatStore } from './chat/chatStore';
import ChatView from './chat/ChatView';
import { printConsoleBanner } from './easter/consoleBanner';
import { AppShell } from './shell/AppShell';

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

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center font-mono text-micro text-muted">
      Carregando...
    </div>
  );
}

export default function App() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    printConsoleBanner();
  }, []);

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
    <Switch>
      <Route path="/v1">
        {() => (
          <div className="v1-scope">
            <Suspense fallback={<RouteLoading />}>
              <V1Page />
            </Suspense>
          </div>
        )}
      </Route>

      <Route path="/cv">
        {() => (
          <div className="v1-scope">
            <Suspense fallback={<RouteLoading />}>
              <CvDocument />
            </Suspense>
          </div>
        )}
      </Route>

      <Route>
        {() => (
          <AppShell onStartContact={handleStartContact}>
            <Suspense fallback={<RouteLoading />}>
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
  );
}
