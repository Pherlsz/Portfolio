---
slug: virtualizacao-atlas-sign
title: Virtualização de listagens com 5.000+ registros no Atlas Sign
summary: Como a combinação de TanStack Virtual, code splitting e estabilização de medições eliminou travamentos e layout thrashing em fluxos de assinatura eletrônica.
publishedAt: 2026-04-12
readingTime: 5 min
category: Performance Frontend
tags: [React, TypeScript, TanStack Virtual, Code Splitting, Web Performance]
---

No módulo Atlas Sign, fluxos de governança corporativa frequentemente reúnem mais de 5.000 registros de documentos e signatários em uma mesma listagem navegável em árvore. Renderizar todas as linhas no DOM de uma só vez causava travamentos na rolagem, alto custo de reconciliação no React e ciclos repetidos de layout thrashing.

## Diagnóstico do gargalo

O custo principal não vinha apenas da quantidade de nós HTML, mas da combinação de três fatores em telas usadas por mais de 10.000 usuários:

1. Montagem simultânea de linhas fora da viewport, multiplicando listeners e árvores de componentes.
2. Recálculos forçados de layout a cada expansão de nó na navegação em árvore.
3. Carregamento síncrono de painéis secundários de assinatura no bundle inicial da rota.

## Arquitetura da solução

A reestruturação separou o estado plano da árvore expandida da camada de renderização em janela, mantendo apenas os itens visíveis e um overscan controlado montados no DOM.

:::canvas
{
  "title": "Pipeline de virtualização no Atlas Sign",
  "nodes": [
    { "id": "tree", "label": "Árvore de documentos", "detail": "5.000+ nós normalizados em lista plana", "x": 40, "y": 90 },
    { "id": "query", "label": "TanStack Query", "detail": "Cache de páginas e deduplicação de requests", "x": 260, "y": 40 },
    { "id": "virtual", "label": "TanStack Virtual", "detail": "Janela ativa + overscan controlado no DOM", "x": 260, "y": 150 },
    { "id": "split", "label": "Code Splitting", "detail": "Carregamento sob demanda do fluxo de assinatura", "x": 500, "y": 90 }
  ],
  "edges": [
    { "from": "tree", "to": "virtual" },
    { "from": "query", "to": "virtual" },
    { "from": "virtual", "to": "split" }
  ]
}
:::

## Padrão de implementação

Manter `estimateSize` previsível e isolar cada linha em um componente memorizado evita que a rolagem dispare re-renders em cascata nos itens vizinhos.

:::code-preview
{
  "title": "Janela virtualizada com TanStack Virtual",
  "language": "tsx",
  "previewLabel": "5.000 linhas -> ~18 nós no DOM",
  "code": "const rowVirtualizer = useVirtualizer({\n  count: flatRows.length,\n  getScrollElement: () => parentRef.current,\n  estimateSize: () => 56,\n  overscan: 6\n});\n\nreturn (\n  <div ref={parentRef} style={{ height: 520, overflow: 'auto' }}>\n    <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>\n      {rowVirtualizer.getVirtualItems().map((item) => (\n        <DocumentRow\n          key={flatRows[item.index].id}\n          row={flatRows[item.index]}\n          style={{ transform: `translateY(${item.start}px)` }}\n        />\n      ))}\n    </div>\n  </div>\n);"
}
:::

## Proteção de fluxo e testes

Para garantir estabilidade em produção sem regressões silenciosas, os fluxos críticos receberam Error Boundaries por bloco funcional e cobertura automatizada com Vitest, Jest e React Testing Library validando navegação por teclado, expansão de ramos e estados de erro.
