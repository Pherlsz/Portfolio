---
slug: portfolio-v2-arquitetura-ia
title: Arquitetura do assistente e streaming seguro no Portfólio Conversacional
summary: Como o portfólio combina streaming SSE, cards ricos sem tokens extras, evento retract contra vazamento de prompt e curadoria semanal automatizada.
publishedAt: 2026-11-18
readingTime: 5 min
category: Engenharia de IA
tags: [Cloudflare Workers, SSE, Gemini API, Segurança, React]
---

Transformar o portfólio em uma interface conversacional trouxe três restrições concretas: latência baixa percebida, custo previsível mesmo no modo Profundo e proteção contra prompt injection sem atrapalhar recrutadores que usam agentes de IA.

## Fluxo de uma mensagem no Worker

Em vez de pedir ao modelo que gere JSON complexo para renderizar cards visuais (o que consome tokens e abre margem para alucinação), o servidor resolve as referências contra o catálogo real de projetos, experiências, estudos e certificados e emite um evento SSE dedicado.

:::canvas
{
  "title": "Pipeline SSE no Cloudflare Worker",
  "nodes": [
    {
      "id": "client",
      "tag": "Cliente",
      "label": "Composer + Raciocínio",
      "summary": "Fast, Padrão ou Profundo e skills",
      "detail": "Envia o histórico recortado, o nível de raciocínio escolhido e comandos /vaga ou /resumo via POST /api/chat.",
      "x": 28,
      "y": 110
    },
    {
      "id": "guard",
      "tag": "Borda",
      "label": "Validação + Rate Limit",
      "summary": "Zod, origem e cache KV",
      "detail": "Valida o payload com Zod, verifica a origem permitida, aplica rate limit por IP e consulta o cache KV das sugestões.",
      "x": 318,
      "y": 110
    },
    {
      "id": "llm",
      "tag": "Stream",
      "label": "Gemini + Filtro",
      "summary": "Deltas SSE com proteção de prompt",
      "detail": "Consome streamGenerateContent em tempo real e inspeciona cada trecho acumulado contra vazamento; se detectar risco, emite retract.",
      "x": 608,
      "y": 28
    },
    {
      "id": "catalog",
      "tag": "Catálogo",
      "label": "Resolver de Cards",
      "summary": "Cards e ações tipadas (0 tokens)",
      "detail": "Cruza a conversa com os arquivos de content/ no servidor para anexar cards verificados de projetos, experiências e estudos sem gastar tokens do modelo.",
      "x": 608,
      "y": 192
    }
  ],
  "edges": [
    { "from": "client", "to": "guard", "label": "POST" },
    { "from": "guard", "to": "llm", "label": "stream" },
    { "from": "llm", "to": "catalog", "label": "SSE" }
  ]
}
:::

## Protocolo SSE e proteção contra vazamento

Durante o streaming, cada bloco passa por verificação. Se algum padrão interno do prompt de sistema aparecer no texto acumulado, o servidor interrompe a geração e envia um evento `retract` que substitui o balão no cliente por uma resposta segura.

:::spec-tabs
{
  "title": "Eventos SSE e contratos do chat",
  "tabs": [
    {
      "id": "sse",
      "label": "Eventos SSE",
      "language": "text",
      "content": "event: delta   -> trecho incremental de texto\nevent: cards   -> lista tipada de ChatCardRef (project, experience, study, contact...)\nevent: actions -> atalhos contextuais (rota, exportar CV, contato)\nevent: retract -> substitui resposta se houver vazamento de prompt\nevent: done    -> encerra stream"
    },
    {
      "id": "skills",
      "label": "Skills no servidor",
      "language": "json",
      "content": "{\n  \"message\": \"Vaga de Frontend Pleno React/TS\",\n  \"reasoning\": \"default\",\n  \"skill\": \"vaga\"\n}"
    }
  ]
}
:::

Arquivos para outras IAs ficam em rotas próprias: `/llms.txt` resume o perfil, `/cv.md` e `/cv.json` entregam o currículo, e `POST /api/contact` recebe recado de pessoa ou de agente.

## Diário aberto de decisões

Todas as decisões de produto, design e engenharia tomadas durante a construção desta edição estão registradas em `docs/decisoes.md`, incluindo alternativas descartadas e trade-offs de custo e acessibilidade.
