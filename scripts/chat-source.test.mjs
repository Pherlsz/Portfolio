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
  SUGGESTED_PRESET_IDS,
  buildPresetFallback,
  presetChipText,
  presetIdForChipText
} from '../src/utils/presetQuestions.ts';
import { buildLocalFallback } from '../src/utils/localChatFallback.ts';

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

function normalizedFallbackFragments(text) {
  const stripped = text
    .replace(/\*\*/g, '')
    .replace(/^[-*•]\s*/gm, '')
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= 12);
  return stripped;
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
});

test('preset fallbacks share no normalized sentence or bullet', () => {
  const ownersByFragment = new Map();
  for (const preset of PRESET_QUESTIONS) {
    const answer = buildPresetFallback(preset.id);
    for (const fragment of normalizedFallbackFragments(answer)) {
      const owners = ownersByFragment.get(fragment) ?? [];
      owners.push(preset.id);
      ownersByFragment.set(fragment, owners);
    }
  }
  for (const [fragment, owners] of ownersByFragment) {
    assert.equal(
      owners.length,
      1,
      `shared fragment across ${owners.join(', ')}: ${fragment.slice(0, 100)}`
    );
  }
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

test('removed legacy preset id falls back to keyword matcher with 200', async () => {
  const legacyExperiencePresetId = ['ex', 'perience'].join('');
  const data = await chatJson({
    mode: 'chat',
    message: 'Conte a experiência profissional',
    presetId: legacyExperiencePresetId,
    history: []
  });
  const parsed = ChatResponseSchema.safeParse(data);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.source, 'local');
  assert.ok(parsed.data.reply.includes('Pedro') || parsed.data.reply.includes('Atlas'));
  assert.notEqual(data.reply, buildPresetFallback('recruiter_summary'));
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

/** Independent of PresetQuestionIdSchema / PRESET_QUESTIONS — tests fail if registry drifts. */
const EXPECTED_PRESET_IDS = Object.freeze([
  'recruiter_summary',
  'stack',
  'atlas_ai',
  'compare_job_fit'
]);

/** Must match free-text chips in src/utils/followUps.ts (jobfit ~54-71, chat ~77). */
const FREE_TEXT_CHIPS = Object.freeze([
  'E se a vaga for sênior?',
  'A vaga pede testes automatizados?',
  'O híbrido é em Porto Alegre?',
  'A IA é function calling em fluxo real?',
  'Quais perguntas eu faço na entrevista?',
  'Resume em 5 linhas para colar no LinkedIn.',
  'Qual a stack desse projeto?',
  'Ele usa isso em produção?'
]);

const stackFollowUpInput = () => ({
  mode: 'chat',
  asked: presetChipText('stack'),
  reply: buildPresetFallback('stack'),
  data: DEFAULT_PORTFOLIO_DATA
});

function assertChipsMapToExpectedPresetsOrFreeText(chips) {
  const knownPresets = new Set(EXPECTED_PRESET_IDS);
  const knownFreeText = new Set(FREE_TEXT_CHIPS);
  for (const chip of chips) {
    const presetId = presetIdForChipText(chip);
    if (presetId !== undefined) {
      assert.ok(knownPresets.has(presetId), `chip "${chip}" maps to unexpected preset id: ${presetId}`);
      assert.ok(
        buildPresetFallback(presetId).trim().length > 0,
        `preset ${presetId} has no fallback text`
      );
      continue;
    }
    assert.ok(
      knownFreeText.has(chip),
      `chip "${chip}" is not a preset chip text nor listed in FREE_TEXT_CHIPS`
    );
  }
}

test('initial assistant preset chips map to expected presets', () => {
  const chips = SUGGESTED_PRESET_IDS.map((id) => presetChipText(id));
  assertChipsMapToExpectedPresetsOrFreeText(chips);
});

test('preset ids match independent expected list and each has fallback', () => {
  assert.equal(PRESET_QUESTIONS.length, EXPECTED_PRESET_IDS.length);
  const fromQuestions = PRESET_QUESTIONS.map((preset) => preset.id).sort();
  const expected = [...EXPECTED_PRESET_IDS].sort();
  assert.deepEqual(fromQuestions, expected);
  for (const id of EXPECTED_PRESET_IDS) {
    assert.equal(PresetQuestionIdSchema.safeParse(id).success, true, id);
    assert.ok(buildPresetFallback(id).trim().length > 0, `missing fallback for ${id}`);
  }
});

test('stack question follow-ups suggest only valid presets or free-text chips', () => {
  const chips = suggestFollowUps(stackFollowUpInput());
  assertChipsMapToExpectedPresetsOrFreeText(chips);
  assert.ok(chips.some((c) => presetIdForChipText(c) === 'atlas_ai' || c.includes('IA')));
});

test('availability follow-up suggests compare_job_fit chip', () => {
  const asked = 'Qual a pretensão salarial e se aceita remoto?';
  const reply = `**Disponibilidade**\n- Senioridade Júnior/Pleno. Remoto.`;
  const chips = suggestFollowUps({ mode: 'chat', asked, reply, data: DEFAULT_PORTFOLIO_DATA });
  assert.ok(chips.includes(presetChipText('compare_job_fit')));
});

test('Gymkhana local fallback lists repo only without vercel or undefined', () => {
  const reply = buildLocalFallback('Fale do projeto Gymkhana Database', 'chat');
  assert.match(reply, /Gymkhana Database/);
  assert.match(reply, /github\.com\/Pherlsz\/Gymkhana-Database/);
  assert.doesNotMatch(reply, /vercel/i);
  assert.doesNotMatch(reply, /undefined/);
});

test('every suggestFollowUps chip maps to a preset or free text across modes', () => {
  const scenarios = [
    stackFollowUpInput(),
    {
      mode: 'chat',
      asked: presetChipText('recruiter_summary'),
      reply: buildPresetFallback('recruiter_summary'),
      data: DEFAULT_PORTFOLIO_DATA
    },
    {
      mode: 'chat',
      asked: 'Gymkhana',
      reply: buildLocalFallback('Gymkhana', 'chat'),
      data: DEFAULT_PORTFOLIO_DATA
    },
    {
      mode: 'jobfit',
      asked: 'Vaga React',
      reply: 'Fit parcial.',
      job: 'React TypeScript remoto',
      data: DEFAULT_PORTFOLIO_DATA
    }
  ];
  for (const input of scenarios) {
    assertChipsMapToExpectedPresetsOrFreeText(suggestFollowUps(input));
  }
});
