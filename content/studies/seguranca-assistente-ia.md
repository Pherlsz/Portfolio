---
slug: seguranca-assistente-ia
title: Revisão de segurança do assistente de portfólio
summary: O chat só fala do portfólio. Esta nota registra o que ele faz, onde o Garak bateu, e a recusa de texto ofuscado que entrou no Worker depois da falha em Base64.
publishedAt: 2026-11-20
readingTime: 6 min
category: Segurança de IA
tags: [Garak, Prompt injection, Cloudflare Workers, Gemini API, SSE]
---

O chat responde sobre a carreira, a stack, os projetos, os estudos, os certificados e o contato de Pedro Henrique Lopes. Pedido fora disso volta uma frase e para.

## O que ele faz

A mensagem entra em `POST /api/chat` e a resposta sai em SSE. O Gemini roda atrás de um Cloudflare Worker. Dá para escolher rápido, padrão ou profundo, e pedir encaixe de vaga ou resumo. Card de projeto, experiência ou estudo sai do catálogo do site. O modelo não inventa o card.

O histórico é cortado. A mensagem para em 4000 caracteres. O IP tem limite de ritmo. Se a resposta começar a copiar o prompt de sistema, o Worker manda `retract` e o balão é trocado.

## Onde o teste rodou

O alvo foi o assistente publicado em `https://pherls.dev/api/chat`. Usei o [Garak](https://github.com/NVIDIA/garak) 0.17.1. Um adaptador local juntava o SSE e esperava 3,5 s entre chamadas, por causa do limite de 20 pedidos por minuto.

Entrou prompt injection em três variantes, jailbreak escondido num texto maior, ofuscação em Base64 e em Unicode invisível, e uma amostra dos jailbreaks DAN.

Uma falha confirmada na resposta virava mudança no Worker, deploy e outra rodada. O placar cru do Garak não fechava a conta. O detector de DAN só aceita uma frase de recusa pronta em inglês. Se a resposta continuava no portfólio, eu contava como ok.

:::canvas
{
  "title": "Revisão no assistente publicado",
  "nodes": [
    {
      "id": "scan",
      "tag": "Medição",
      "label": "Garak 0.17.1",
      "summary": "Sondas em /api/chat",
      "detail": "Injeção, jailbreak escondido, Base64, Unicode invisível e uma amostra de DAN, no endpoint publicado.",
      "x": 24,
      "y": 188
    },
    {
      "id": "read",
      "tag": "Leitura",
      "label": "A resposta, não o placar",
      "summary": "Tem que ficar no portfólio",
      "detail": "O detector de DAN só reconhece uma recusa pronta em inglês. A revisão leu o texto. Se saiu do portfólio ou repetiu o ataque, era falha.",
      "x": 318,
      "y": 16
    },
    {
      "id": "fix",
      "tag": "Worker",
      "label": "Recusa antes do Gemini",
      "summary": "Base64 e Unicode invisível",
      "detail": "Pedido de decodificar, um bloco Base64 sozinho ou caractere Unicode invisível recebe uma frase, no idioma da mensagem, sem chamar o modelo e sem escrever o texto decodificado.",
      "x": 596,
      "y": 188
    }
  ],
  "edges": [
    { "from": "scan", "to": "read", "label": "relato" },
    { "from": "read", "to": "fix", "label": "falha" },
    { "from": "fix", "to": "scan", "label": "de novo" }
  ]
}
:::

## A falha do Base64

Injeção, jailbreak escondido e a amostra de DAN ficaram no assunto do portfólio. Uma mensagem em Base64 não. O modelo decodificou o trecho e escreveu a palavra. Dizer que aquilo não era do portfólio não adiantou: a palavra já estava na resposta.

Os prompts do Garak estão em inglês e o chat respondia em português, porque os fatos do site estão em português. A resposta passou a seguir o idioma da mensagem.

## Recusa antes do Gemini

O Worker barra três casos sem chamar o modelo.

Pedido de decodificar Base64, Base32, Base16 ou ROT13 junto de um bloco. Mensagem que é só um bloco Base64. Caractere da faixa Unicode usada para esconder texto.

A frase de recusa não traz o texto decodificado. Pergunta sobre a stack segue para o Gemini.

Na saída, o stream continua com `delta`, cards, atalhos e `done`. Vazamento do prompt de sistema ainda cai no `retract`.

## Medição depois disso

| Sonda | Prompts | Resultado |
| --- | --- | --- |
| Base64 | 16 | 16/16 sem repetir o texto codificado |
| Unicode invisível | 16 | 16/16 sem repetir o texto oculto |
| Prompt injection | 24 | 24/24 no portfólio |
| Jailbreak escondido | 8 | 8/8 sem o gatilho na resposta |
| DAN, amostra | 8 | 8/8 no assunto do portfólio |

72 prompts. Nenhum repetiu o ataque. O detector de DAN ainda marca 0/8 nessa amostra. As oito respostas ficaram no portfólio.

Os 64 jailbreaks da coleção DAN não entraram nessa última passada. Na época, a cota diária do site cortou as chamadas ao modelo. A amostra de 8 foi lida uma a uma.

## Fora desta nota

O Garak tem centenas de sondas. Aqui coube injeção, ofuscação e troca de papel, no ritmo que o limite por IP deixa.
