---
slug: portfolio-v2-arquitetura-ia
title: Arquitetura do assistente e streaming seguro no pherls.dev v2
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
    { "id": "client", "label": "Composer + Reasoning", "detail": "Fast / Default / High + skills /vaga e /resumo", "x": 30, "y": 95 },
    { "id": "guard", "label": "Validação + Rate Limit", "detail": "Zod, origem permitida e janela por IP", "x": 240, "y": 95 },
    { "id": "llm", "label": "Gemini Stream", "detail": "Delta em tempo real com filtro de segurança", "x": 450, "y": 40 },
    { "id": "catalog", "label": "Resolver de Cards", "detail": "Referências tipadas contra content/ (0 tokens)", "x": 450, "y": 155 }
  ],
  "edges": [
    { "from": "client", "to": "guard" },
    { "from": "guard", "to": "llm" },
    { "from": "llm", "to": "catalog" }
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
    },
    {
      "id": "machine",
      "label": "Endpoints para IAs",
      "language": "text",
      "content": "GET /llms.txt    -> resumo estruturado do perfil e rotas\nGET /cv.json     -> currículo em JSON Resume\nGET /cv.md       -> currículo em Markdown\nPOST /api/contact -> envio direto de recados por humanos ou agentes"
    }
  ]
}
:::

## Diário aberto de decisões

Todas as decisões de produto, design e engenharia tomadas durante a construção da v2 estão registradas em `docs/decisoes.md`, incluindo alternativas descartadas e trade-offs de custo e acessibilidade.
