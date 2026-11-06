# [pherls.dev](https://pherls.dev)

Portfólio de Pedro Henrique Lopes, Software Engineer · Frontend. SPA em React 19, TypeScript, Vite e Tailwind CSS, servida por um Cloudflare Worker.

O Worker serve o site, as rotas `/api/chat` e `/api/contact`, e os documentos `/llms.txt`, `/robots.txt` e `/sitemap.xml`. O JSON-LD e um resumo indexável vão no HTML inicial.

## Arquitetura

- **Dados:** uma fonte tipada (`src/data/portfolioData.ts`) alimenta a interface, o CV em `/cv`, o JSON-LD, o `llms.txt` e o prompt do assistente.
- **Assistente:** `src/server/assistant.ts` valida a entrada com zod, envolve o texto do visitante em tags de dado não confiável e chama o Gemini com um único prompt de sistema. Sem chave ou com erro, responde que está indisponível; não há fallback simulado.
- **Contato:** zod + honeypot + rate limit; mensagens vão para um KV (`INBOX`).
- **Stickers:** arte e efeito holográfico só nos stickers da tampa no Hero (`npm run stickers` regenera os webp a partir de `design/raw`).

## Local

```bash
npm install
cp .env.example .dev.vars
npm run dev
```

`GEMINI_API_KEY` em `.dev.vars` é opcional. Preview do build:

```bash
npm run build
npm start
```

## Produção

```bash
npm run deploy
```

Publica o Worker `pherls` em [pherls.dev](https://pherls.dev).
