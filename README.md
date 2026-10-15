# [pherls.dev](https://pherls.dev)

Portfólio de Pedro Henrique Lopes, frontend engineer. SPA em React 19, TypeScript, Vite e Tailwind CSS, servida por um Cloudflare Worker.

O Worker responde o site e as rotas `/api/chat`, `/api/contact`, `/llms.txt`, `/ai.json`, `/pedro.md`, `/AGENTS.md`, `/resume.json`, `/robots.txt` e `/sitemap.xml`. `GET` e `HEAD` desses documentos devolvem 200, com o mesmo `Content-Type` e `Content-Length`; `HEAD` vai sem corpo. Sem chave de IA, o assistente usa o resumo local do currículo.

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
