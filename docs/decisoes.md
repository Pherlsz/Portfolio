# Registro de decisões: pherls.dev v2

> Resumo enxuto das decisões de produto, design e arquitetura tomadas durante o planejamento e a construção do **pherls.dev v2** (portfólio em formato de chat de IA). Mantém apenas o que tem relevância técnica ou de produto para o estudo de caso.

## Processo de trabalho

O projeto foi conduzido em modo de planejamento antes do código, combinando três ciclos curtos:

1. **Alinhamento visual e de escopo:** partiu de um mockup anotado (inspirado no app do Gemini) refinado com perguntas objetivas e protótipos descartáveis para validar layout, fluxos e legibilidade antes de mexer no repositório.
2. **Desenvolvimento orquestrado (Swarm):** trabalho dividido por arquivos exclusivos entre workers paralelos (`design` para tokens, animações e mascotes; `shell` para rotas, páginas, conteúdo e prerender; `chat` para store e streaming; `api` para Worker, SSE, orçamento e D1; `v1` para versão arquivada; `verifier` para testes e revisão).
3. **Revisão contínua:** passes dedicados de anti-AI-Slop (`unslop-ui`), WCAG 2.2 AA, performance (LCP/CLS/bundle) e testes automatizados (`node --test`).

---

## Decisões de produto e UX

| Área | Decisão | Motivo |
|---|---|---|
| **Substituição da v1** | A v2 assume a home (`/`). A v1 volta simplificada (sem IA, contato ou modal de CV) em `/v1` e listada em Projetos. | Evita manter dois portfólios completos em paralelo, preservando a tampa de stickers holográficos como arquivo. |
| **Seções condicionais** | Sidebar, sitemap, `llms.txt` e prerender só exibem seções com conteúdo real (`visibleSections()`). | Garante que nunca existam páginas vazias nem rotas quebradas para visitantes ou crawlers. |
| **Páginas dedicadas** | Projetos (galeria), Experiência (CV + PDF nativo + DOCX/MD/JSON), Estudos e Certificados (juntos na mesma seção, separados em 2 abas), Artigos e AI/Arquivos. | Cada tipo de conteúdo pede leitura própria; todas as páginas têm CTA para aprofundar no chat. |
| **Módulos interativos sob demanda** | Ao expandir um estudo ou artigo, blocos visuais (canvas de nós arrastáveis/teclado, código + preview ao vivo, abas de spec/JSON) carregam via `lazy()`. | Enriquece a leitura técnica sem transformar o site inteiro numa ferramenta de diagrama nem pesar no bundle inicial. |
| **Reasoning e mascotes** | Seletor de raciocínio (`Rápido`, `Padrão`, `Profundo`) em botão pill com popover slider. Mascotes (`Tomada`, `Morcega`, `Banguela`) aparecem apenas enquanto a IA responde, com micro-animação ao clicar 1x. | Mantém o seletor limpo e dá personalidade ao estado de espera sem distrair. |
| **Cards ricos no chat** | Respostas do assistente renderizam cards inline (projeto, experiência, certificado, estudo, artigo, contato, `/v1`). | Torna a conversa navegável sem obrigar o visitante a ler blocos longos de texto. |
| **Skills e contato** | Comandos `/` (`/vaga`, `/resumo`, `/contato`, `/v1`, `/help`) e anexo local de descrição de vaga (`.txt`/`.md`). O contato abre um card inline pré-preenchido enviado manualmente pelo visitante. | A IA nunca dispara ações com efeito colateral sozinha; templates de skill ficam no servidor. |
| **Sugestões sem nomes de empresas** | Perguntas em destaque (padrão e curadas) focam em Pedro, stack e projetos, filtrando nomes de empresas onde trabalhou. | Mantém o foco do portfólio nas competências e evita expor marcas fora de contexto. |
| **Histórico local e i18n** | Até 30 conversas salvas em `localStorage` (sem login). Interface em pt-BR centralizada em dicionário tipado (`src/i18n/pt-BR.ts`). | Zero atrito para visitantes e base pronta para adicionar inglês sem refatoração. |

---

## Arquitetura, IA, segurança e custo

| Decisão | Implementação |
|---|---|
| **Streaming SSE seguro** | `POST /api/chat` faz streaming de `:streamGenerateContent?alt=sse`. A cada chunk, `isSafeReply` inspeciona o texto acumulado; em caso de vazamento do prompt de sistema, emite `event: retract` e encerra o stream. |
| **Cards inline a custo zero** | `inferContextualCards` cruza pergunta e resposta no servidor contra uma whitelist de IDs reais do catálogo e emite `event: cards`. Zero tokens extras e zero risco de alucinação. |
| **Orçamento rígido de tokens** | `REASONING_PROFILES` é configurável por variável de ambiente, mas tetos duros no código (`fast <= 450`, `default <= 600`, `high <= 900`, sem thinking dinâmico `-1`) impedem estouro. |
| **Camadas de contenção de custo** | Janela de histórico por caracteres (`6.000` chars), cache KV das sugestões padrão (0 tokens no 1o turno), rate limit por IP (`CHAT_LIMIT`) e limite separado para `high` (`CHAT_HIGH_LIMIT`), cancelamento upstream via `request.signal`. |
| **Curadoria semanal com privacidade** | Perguntas são registradas no D1 sem IP, com máscara de PII (e-mail, telefone, URL, CPF) e retenção de 30 dias. Um cron semanal (`0 12 * * 1`) usa structured output + validação `zod` + filtro de PII/empresas para atualizar `suggestions:current` no KV. |
| **Sanitização e headers** | Markdown renderizado com `react-markdown` (`skipHtml`, URLs restritas a `https:`, `http:`, `mailto:`), CSP estrita, `Permissions-Policy`, `COOP`, `X-Frame-Options` e 404 explícito em `/studio*` e `/admin*`. |
| **SEO sem perder o formato chat** | Plugin Vite valida `content/` com `zod` no `buildStart` e pré-renderiza 15 rotas estáticas em `dist/client/` com `<title>`, `canonical`, OG, JSON-LD e HTML indexável. |

---

## Design, acessibilidade e performance

- **Sem header superior:** a área principal é uma folha arredondada contínua com sidebar recolhível no desktop e `<dialog>` drawer no mobile.
- **Identidade e legibilidade:** paleta papel quente / carvão com acento acid-lime (`Archivo` + `Atkinson Hyperlegible Mono`). Escala mínima de 13px (`--text-micro`), contraste AAA (> 6.8:1) em texto secundário nos dois temas e fonte sans para frases corridas (monospace reservada para código, rotas e datas).
- **WCAG 2.2 AA:** skip link para `#conteudo`, hierarquia de headings contínua no chat ativo, `scroll-pb-44` para evitar foco encoberto pelo composer sticky (2.4.11) e navegação por setas no canvas de nós (2.5.7).
- **Performance:** `zod` removido do bundle do cliente (roda só no build e no servidor), `MessageBubble`, `react-markdown`, `V1Page` e `StudyModules` em chunks `lazy()`, imagem LCP da galeria com `loading="eager"` + `fetchPriority="high"` e dimensões explícitas.

---

## Conteúdo desacoplado e Fase 2 (Studio Local)

- **No MVP:** dados separados do código TypeScript em `content/` (`profile.json`, `experiences.json`, `projects.json`, `certificates.json`, `studies/*.md`, `articles/*.md`), validados com `zod` no build.
- **Fase 2 (pós-MVP):** Studio Local (`npm run studio` em `tools/studio/`), rodando apenas em `127.0.0.1` para editar conteúdo, montar blocos visuais e revisar/publicar via Git local, mantendo **zero API de escrita em produção**.

---

## Alternativas descartadas

| Alternativa | Por que saiu |
|---|---|
| **Manter a v1 em `/classic` completa** | Substituir na home e arquivar a v1 simplificada em `/v1` elimina manutenção duplicada. |
| **Seções abrindo "conversa fixa" no chat** | Galerias, currículo e estudos funcionam melhor em páginas dedicadas com CTA para o chat. |
| **Turnstile no chat desde o início** | Pode travar agentes de recrutadores que navegam no site; o rate limit por IP cobre o risco inicial. |
| **Cota diária global de tokens** | Somava o uso de todo mundo no dia UTC e, ao estourar, parava o assistente para o visitante seguinte. O limite ficou só por IP. |
| **pdf.js para o currículo** | Peso desnecessário no bundle; o visualizador PDF nativo em `<iframe>` dentro de `<dialog>` resolve bem. |
| **Easter eggs complexos (Konami code, tema secreto, 5 cliques)** | Custo de manutenção sem ganho real; ficaram apenas `/v1`, banner no console, 404 com mascote e micro-animação de 1 clique. |
| **CMS com API em produção** | Abre superfície de ataque para alteração indevida; edição fica 100% local + Git. |
