# Pedro Henriques Lopes — Creative Engineer & AI-Friendly Portfolio

Portfólio minimalista, interativo, **Mobile-First** e **AI-Friendly** construído com **React 19, TypeScript, Tailwind CSS, Express e Gemini API**.

## Destaques da Arquitetura

- **Floating Top Navbar**: Navegação expansível entre seções, assistente de IA integrado com analisador de *Job-Fit* para vagas, exportação instantânea de currículo (`.md` / `.json` / PDF) e alternância de tema (*Obsidian Dark* / *Warm Paper Light*).
- **Projetos Interativos (Preview, Blueprint Nodes & Código)**: Visualização compacta em 3 colunas com alternância ao vivo entre preview visual, topologia de nós de arquitetura e trechos de código em TypeScript.
- **Stickers Die-Cut Interativos & Background Animado**:
  - **Morcega**: A gata preta mais velha, gordinha, peluda e com asinhas de morcega.
  - **Banguela**: A gatinha preta menorzinha com bochechas grandes de esquilo cheias de comida e apenas 1 presa.
  - **Tomada**: O caçula comprido, magro/atlético e ligado no 220V.
  - **D20 RPG, Café Especial Fumegante, Setor de Diversas (Gincanas RS — Dados/Docs/Locais), Academia & E-Sports**.
- **AI-Friendly Architecture & Guardrails**:
  - Rotas nativas `/llms.txt`, `/ai.json` e `/cv-pedro-lopes.md` para indexação semântica por agentes de recrutamento.
  - Microdados `Schema.org/Person` (`JSON-LD`) sincronizados no `<head>`.
  - Validação anti-*jailbreak* com **Zod** e *System Prompt* compacto de baixa latência.

## Como Executar Localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure sua chave no arquivo `.env` (opcional para o chat com IA; o portfólio também possui fallback local completo):
   ```env
   GEMINI_API_KEY="sua_chave_aqui"
   ```

3. Inicie o servidor full-stack (Express + Vite na porta 3000):
   ```bash
   npm run dev
   ```

4. Build para produção:
   ```bash
   npm run build
   npm start
   ```
