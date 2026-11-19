---
slug: design-system-wcag-aa
title: Estruturando um Design System acessível (WCAG 2.1 AA)
summary: Lições práticas construindo primitivos reutilizáveis em React, Next.js e TypeScript com foco em teclado, contraste, semântica e manutenção entre times.
publishedAt: 2026-08-14
readingTime: 6 min
category: Design Systems
tags: [Design Systems, WCAG 2.1 AA, React, Next.js, TypeScript, Acessibilidade]
---

Construir uma biblioteca de componentes compartilhada entre múltiplos módulos exige equilibrar velocidade de entrega com garantias sólidas de acessibilidade. Na prática, acessibilidade não funciona como revisão de última hora: ela precisa morar nos primitivos.

## Comece pelos primitivos, não pelas telas

Quando cada time monta seu próprio modal, menu suspenso ou campo de formulário, detalhes críticos se perdem: retorno de foco ao fechar um diálogo, fechamento com `Escape`, ordem de tabulação e contraste mínimo de 4.5:1 para texto normal.

Centralizar esses comportamentos em primitivos reduz drasticamente o esforço de quem consome a biblioteca. O desenvolvedor de produto passa a herdar foco visível, estados `aria-invalid` e `aria-describedby` sem precisar reimplementar regras a cada tela.

## Contratos explícitos em TypeScript

Uma forma simples de evitar uso incorreto é deixar os requisitos de acessibilidade visíveis na própria tipagem do componente.

:::code-preview
{
  "title": "Botão de ícone com rótulo acessível obrigatório",
  "language": "tsx",
  "previewLabel": "Tipagem previne botões sem nome acessível",
  "code": "type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  'aria-label': string;\n  icon: React.ReactNode;\n};\n\nexport function IconButton({ icon, type = 'button', ...props }: IconButtonProps) {\n  return (\n    <button type={type} {...props}>\n      <span aria-hidden=\"true\">{icon}</span>\n    </button>\n  );\n}"
}
:::

## Checklist que sustenta a escala

Na rotina de code review e nas discussões com arquitetura, quatro verificações cobrem a maior parte das regressões de WCAG 2.1 Level AA:

1. **Navegação completa por teclado**: todo controle interativo alcançável com `Tab`, ativável com `Enter` ou `Space`, e sem armadilhas de foco.
2. **Contraste e temas**: tokens semânticos separados por superfície e texto, testados tanto no tema claro quanto no escuro.
3. **Semântica nativa antes de ARIA**: preferir `<button>`, `<nav>`, `<main>` e `<label>` ligados por `htmlFor` em vez de `div` clicável.
4. **Testes automatizados orientados ao usuário**: queries por role e label na React Testing Library validam o contrato acessível no mesmo momento em que testam o comportamento funcional.

:::spec-tabs
{
  "title": "Critérios verificados por componente",
  "tabs": [
    {
      "id": "focus",
      "label": "Foco e teclado",
      "language": "text",
      "content": "- Anel de foco visível com :focus-visible\n- Escape fecha popovers e diálogos\n- Foco retorna ao acionador ao fechar camadas sobrepostas"
    },
    {
      "id": "tests",
      "label": "Teste com RTL",
      "language": "tsx",
      "content": "render(<IconButton aria-label=\"Fechar painel\" icon={<CloseIcon />} onClick={onClose} />);\nconst button = screen.getByRole('button', { name: 'Fechar painel' });\nawait userEvent.click(button);\nexpect(onClose).toHaveBeenCalledTimes(1);"
    }
  ]
}
:::

## Resultado no dia a dia

Quando acessibilidade vira parte do contrato da biblioteca, ela deixa de competir com prazo de entrega. Novos fluxos herdam o padrão certo por construção, e correções feitas em um primitivo beneficiam imediatamente todos os módulos conectados.
