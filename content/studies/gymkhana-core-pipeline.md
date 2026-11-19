---
slug: gymkhana-core-pipeline
title: Arquitetura modular do Gymkhana Core em Go
summary: Separação de responsabilidades em seis pacotes Go focados em normalização determinística, datas sem fuso, deduplicação por hash, OCR e chamadas a LLMs com RAG.
publishedAt: 2026-06-20
readingTime: 6 min
category: Arquitetura e Backend
tags: [Go, RAG, OCR, JSON Schema, Deduplicação]
---

O Gymkhana Core nasceu para concentrar a lógica de dados compartilhada pelo Gymkhana Database. Em vez de misturar validação de entrada, leitura de documentos e chamadas de IA dentro dos handlers HTTP, o repositório foi dividido em seis pacotes independentes e testáveis em isolamento.

## Fluxo de ingestão e consulta

Cada documento ou registro passa por normalização antes de gerar um hash determinístico. Isso garante que pequenas variações de formatação (acentos, espaços extras ou formatos diferentes de data) não produzam registros duplicados.

:::canvas
{
  "title": "Fluxo entre os 6 módulos do Gymkhana Core",
  "nodes": [
    { "id": "ocr", "label": "ocr", "detail": "Extração de texto de documentos", "x": 30, "y": 40 },
    { "id": "normalize", "label": "normalize", "detail": "Nomes, documentos, endereços e contatos", "x": 220, "y": 40 },
    { "id": "civiltime", "label": "civiltime", "detail": "Datas e períodos sem fuso horário", "x": 220, "y": 150 },
    { "id": "fingerprint", "label": "fingerprint", "detail": "Hashes determinísticos anti-duplicação", "x": 420, "y": 95 },
    { "id": "portablejson", "label": "portablejson", "detail": "Validação de JSON e schemas", "x": 420, "y": 200 },
    { "id": "assistant", "label": "assistant", "detail": "Chamadas a LLMs com tools e RAG", "x": 620, "y": 95 }
  ],
  "edges": [
    { "from": "ocr", "to": "normalize" },
    { "from": "normalize", "to": "fingerprint" },
    { "from": "civiltime", "to": "fingerprint" },
    { "from": "portablejson", "to": "assistant" },
    { "from": "fingerprint", "to": "assistant" }
  ]
}
:::

## Contratos entre módulos

Manter contratos simples entre pacotes reduz acoplamento e facilita reutilizar o mesmo núcleo tanto em pipelines de importação quanto no assistente de busca.

:::spec-tabs
{
  "title": "Contratos dos pacotes principais",
  "tabs": [
    {
      "id": "normalize",
      "label": "normalize + fingerprint",
      "language": "go",
      "content": "record := normalize.Person(rawInput)\ndate := civiltime.ParseDate(rawInput.Date)\nkey := fingerprint.Hash(record.Document, record.FullName, date.String())"
    },
    {
      "id": "portablejson",
      "label": "portablejson",
      "language": "json",
      "content": "{\n  \"schema\": \"gymkhana.account.v1\",\n  \"required\": [\"fingerprint\", \"name\", \"createdDate\"],\n  \"additionalProperties\": false\n}"
    },
    {
      "id": "assistant",
      "label": "assistant (RAG + tools)",
      "language": "text",
      "content": "1. Recebe consulta do usuário na interface web.\n2. Recupera registros relevantes indexados pelo fingerprint.\n3. Executa tools validadas por portablejson antes de responder."
    }
  ]
}
:::

## Benefícios práticos

Isolar datas civis no pacote `civiltime` eliminou bugs clássicos de deslocamento de um dia entre cliente e servidor, enquanto o `fingerprint` tornou reimportações de planilhas idempotentes por padrão.
