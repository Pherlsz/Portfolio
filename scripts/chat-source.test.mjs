import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { handlePortfolioRequest } from '../src/server/portfolioApi.ts';
import { ChatRequestSchema } from '../src/utils/chatGuardrails.ts';
import { ChatResponseSchema, ChatSourceSchema } from '../src/utils/chatResponseSchema.ts';
import { suggestFollowUps } from '../src/utils/followUps.ts';
import { DEFAULT_PORTFOLIO_DATA } from '../src/data/portfolioData.ts';
import {
  PRESET_QUESTIONS,
  PresetQuestionIdSchema,
  buildPresetFallback,
  presetChipText
} from '../src/utils/presetQuestions.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function chatRequest(body) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function chatJson(body, env = {}) {
  const response = await handlePortfolioRequest(chatRequest(body), env);
  assert.equal(response?.status, 200);
  const json = await response.json();
  return json;
}

test('chat response schema accepts valid payloads and rejects invalid source', () => {
  const valid = ChatResponseSchema.safeParse({
    reply: 'ok',
    source: 'ai',
    actions: [{ label: 'Ver', type: 'navigate', value: '#x' }]
  });
  assert.equal(valid.success, true);

  assert.equal(ChatResponseSchema.safeParse({ reply: 'x' }).success, false);
  assert.equal(ChatResponseSchema.safeParse({ reply: 'x', source: 'gemini' }).success, false);
  assert.equal(ChatSourceSchema.safeParse('local').success, true);
});

test('local chat path returns source local without Gemini key', async () => {
  const data = await chatJson({
    mode: 'chat',
    message: 'Qual a stack principal?',
    history: []
  });
  const parsed = ChatResponseSchema.safeParse(data);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.source, 'local');
  assert.ok(parsed.data.reply.length > 0);
});

test('ai chat path returns source ai with mocked Gemini', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('generativelanguage.googleapis.com')) {
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Resposta simulada da IA.' }] } }]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return originalFetch(url);
  };

  const data = await chatJson(
    { mode: 'chat', message: 'Conte sobre a Atlas', history: [] },
    { GEMINI_API_KEY: 'test-key' }
  );
  assert.equal(data.source, 'ai');
  assert.match(data.reply, /Resposta simulada/);
});

test('every preset id has a non-empty distinct fallback', () => {
  const seen = new Set();
  for (const preset of PRESET_QUESTIONS) {
    assert.equal(PresetQuestionIdSchema.safeParse(preset.id).success, true);
    const answer = buildPresetFallback(preset.id);
    assert.ok(answer.trim().length > 0, preset.id);
    assert.equal(seen.has(answer), false, `duplicate fallback for ${preset.id}`);
    seen.add(answer);
  }
  const design = buildPresetFallback('design_system_wcag');
  assert.doesNotMatch(design, /10\.000\+ usuários/i);
  assert.doesNotMatch(design, /5\.000\+ registros/i);
});

test('preset chip uses dedicated fallback when AI is unavailable', async () => {
  const data = await chatJson({
    mode: 'chat',
    message: PRESET_QUESTIONS[0].text,
    presetId: PRESET_QUESTIONS[0].id,
    history: []
  });
  assert.equal(data.source, 'local');
  assert.equal(data.reply, buildPresetFallback(PRESET_QUESTIONS[0].id));
});

test('unknown preset id does not crash and falls back to keyword matcher', async () => {
  const data = await chatJson({
    mode: 'chat',
    message: 'Qual a stack principal?',
    presetId: 'not-a-real-preset',
    history: []
  });
  const parsed = ChatResponseSchema.safeParse(data);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.source, 'local');
  assert.ok(parsed.data.reply.includes('Stack'));
});

test('invalid preset id type is stripped at parse and uses keyword matcher', async () => {
  const parsed = ChatRequestSchema.safeParse({
    mode: 'chat',
    message: 'Qual a stack principal?',
    presetId: 'x'.repeat(41),
    history: []
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.presetId, undefined);

  const data = await chatJson({
    mode: 'chat',
    message: 'Qual a stack principal?',
    presetId: 123,
    history: []
  });
  assert.equal(data.source, 'local');
  assert.ok(data.reply.includes('Stack'));
  assert.equal(data.blockedByZod, false);
});

test('jobfit local fallback is tagged local', async () => {
  const data = await chatJson({
    mode: 'jobfit',
    message: 'Vaga frontend React TypeScript remoto',
    history: []
  });
  assert.equal(data.source, 'local');
  assert.ok(data.reply.length > 20);
});

const stackFollowUpInput = () => ({
  mode: 'chat',
  asked: presetChipText('stack'),
  reply: buildPresetFallback('stack'),
  data: DEFAULT_PORTFOLIO_DATA
});

test('stack question follow-ups can suggest production_backend chip', () => {
  const chips = suggestFollowUps(stackFollowUpInput());
  assert.ok(chips.includes(presetChipText('production_backend')));
});

test('availability follow-up suggests compare_job_fit chip', () => {
  const asked = 'Qual a pretensão salarial e se aceita remoto?';
  const reply = `**Disponibilidade**\n- Senioridade Júnior/Pleno. Remoto.`;
  const chips = suggestFollowUps({ mode: 'chat', asked, reply, data: DEFAULT_PORTFOLIO_DATA });
  assert.ok(chips.includes(presetChipText('compare_job_fit')));
});

test('stack question follow-ups can suggest atlas_testing chip', () => {
  const chips = suggestFollowUps(stackFollowUpInput());
  assert.ok(chips.includes(presetChipText('atlas_testing')));
});
