# [pherls.dev](https://pherls.dev)

Portfólio conversacional (v2) de Pedro Henrique Lopes, Software Engineer · Frontend. Construído com React 19, TypeScript, Vite, Tailwind CSS 4 e Cloudflare Workers.

## Arquitetura

- **Interface conversacional + páginas dedicadas:** a home (`/`) abre um chat com histórico local no navegador (`localStorage`), seletor de raciocínio (`Rápido`, `Padrão`, `Profundo`), mascotes animados apenas durante o streaming (`Tomada`, `Morcega`, `Banguela`) e cards ricos inline sem custo extra de tokens.
- **Seções condicionais (`src/content/sections.ts`):** `Projetos`, `Experiência`, `Estudos` (com aba `Certificados`), `Artigos` e `AI / Arquivos`. Uma seção só aparece na sidebar, no `sitemap.xml` e no `llms.txt` se tiver conteúdo.
- **Versão arquivada (`/v1`):** (2025) segue acessível de forma simplificada e lazy-loaded em `/v1`, com `noindex` e tokens isolados em `.v1-scope`.
- **Prerender SEO por rota (`vite.config.ts`):** o build gera `dist/client/<rota>/index.html` com `<title>`, `<meta name="description">`, `canonical`, Open Graph, JSON-LD e HTML indexável para cada seção visível e slug de projeto, estudo e artigo.

## Camada de conteúdo (`content/`)

Os dados do portfólio vivem fora do código de UI e são validados com `zod` no build:

- `content/profile.json`: perfil, stack, formação, cursos e idiomas.
- `content/experiences.json`: histórico profissional, cargos, métricas e stacks.
- `content/projects.json`: galeria de projetos (`gymkhana-database`, `gymkhana-core`, `portfolio-v2`, `portfolio-v1`).
- `content/certificates.json`: carteira estruturada de certificações.
- `content/studies/*.md` e `content/articles/*.md`: textos em Markdown com frontmatter e blocos declarativos (`:::canvas`, `:::code-preview`, `:::spec-tabs`) carregados sob demanda via `lazy()`.
- `docs/decisoes.md`: diário aberto de decisões de produto, design e arquitetura da v2.

## Backend, Reasoning e Curadoria (Cloudflare Worker)

- **Streaming SSE (`POST /api/chat`):** emite `delta`, `cards` (referências tipadas resolvidas no servidor contra o catálogo real), `actions`, `notice`, `retract` (substitui a resposta caso algum marcador interno do prompt vaze), `error` e `done`.
- **Perfis de raciocínio (`REASONING_PROFILES`):** configuráveis via variável de ambiente JSON no Worker, com limites máximos rígidos em código (`fast <= 450`, `default <= 600`, `high <= 900` tokens de saída). O ritmo é por IP (`CHAT_LIMIT` e `CHAT_HIGH_LIMIT`).
- **Skills no servidor:** `/vaga` e `/resumo` usam templates no servidor; o cliente nunca injeta prompt de sistema.
- **Curadoria semanal (D1 + Cron):** perguntas anônimas (sem IP e com retenção de 30 dias em D1, migração em `migrations/0001_questions.sql`) alimentam um job semanal (`scheduled` no Worker) que gera sugestões em destaque e tentativas de quebra em `GET /api/suggestions`, com suporte a override manual (`suggestions:pinned`).
- **Endpoints para máquinas e recrutadores:** `/llms.txt`, `/cv.json` (JSON Resume), `/cv.md`, `/cv/Pedro-Henrique-Lopes-CV.docx` (gerado por `scripts/cv-docx.mjs`), `/sitemap.xml`, `/robots.txt` e `POST /api/contact`.
