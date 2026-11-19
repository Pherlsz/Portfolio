---
slug: virtualizacao-listagens-react
title: Virtualização de listagens extensas em React
summary: Como combinar TanStack Virtual, code splitting e medições estáveis para evitar travamentos e layout thrashing em listas com milhares de itens.
publishedAt: 2026-04-12
readingTime: 5 min
category: Performance Frontend
tags: [React, TypeScript, TanStack Virtual, Code Splitting, Web Performance]
---

Em aplicações corporativas que exibem tabelas ou árvores de documentos com milhares de registros na mesma tela, renderizar todas as linhas no DOM de uma só vez costuma causar travamentos na rolagem, alto custo de reconciliação no React e ciclos repetidos de layout thrashing.

## Diagnóstico do gargalo

Em um cenário típico de listagem hierárquica com ~5.000 itens, o custo principal não vem apenas da quantidade de nós HTML, mas da combinação de três fatores:

1. Montagem simultânea de linhas fora da viewport, multiplicando listeners e árvores de componentes.
2. Recálculos forçados de layout a cada expansão de nó na navegação em árvore.
3. Carregamento síncrono de painéis secundários e ações pesadas no bundle inicial da rota.

## Arquitetura da solução

A abordagem separa o estado plano da árvore expandida da camada de renderização em janela, mantendo apenas os itens visíveis e um overscan controlado montados no DOM.

:::canvas
{
  "title": "Pipeline de virtualização em React",
  "nodes": [
    { "id": "tree", "label": "Árvore normalizada", "detail": "Nós hierárquicos convertidos em lista plana", "x": 40, "y": 90 },
    { "id": "query", "label": "TanStack Query", "detail": "Cache de páginas e deduplicação de requests", "x": 260, "y": 40 },
    { "id": "virtual", "label": "TanStack Virtual", "detail": "Janela ativa + overscan controlado no DOM", "x": 260, "y": 150 },
    { "id": "split", "label": "Code Splitting", "detail": "Carregamento sob demanda de painéis secundários", "x": 500, "y": 90 }
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
  "previewLabel": "5.000 itens -> ~18 nós ativos no DOM",
  "code": "const rowVirtualizer = useVirtualizer({\n  count: flatRows.length,\n  getScrollElement: () => parentRef.current,\n  estimateSize: () => 56,\n  overscan: 6\n});\n\nreturn (\n  <div ref={parentRef} style={{ height: 520, overflow: 'auto' }}>\n    <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>\n      {rowVirtualizer.getVirtualItems().map((item) => (\n        <DocumentRow\n          key={flatRows[item.index].id}\n          row={flatRows[item.index]}\n          style={{ transform: `translateY(${item.start}px)` }}\n        />\n      ))}\n    </div>\n  </div>\n);"
}
:::

## Proteção de fluxo e testes

Para manter previsibilidade sem regressões silenciosas, isolar blocos críticos com Error Boundaries e cobrir navegação por teclado, expansão de ramos e estados de erro com Vitest e React Testing Library fecha o ciclo de confiabilidade.
