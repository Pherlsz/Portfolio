import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildContactEmail, sanitizeHeaderValue } from '../src/server/contactEmail.ts';
import { handlePortfolioRequest } from '../src/server/portfolioApi.ts';

const message = 'Quero falar sobre uma vaga de frontend.';

test('sanitizeHeaderValue strips CR, LF, and other control characters', () => {
  assert.equal(sanitizeHeaderValue('Ana\r\nBcc: evil@example.com'), 'AnaBcc: evil@example.com');
  assert.equal(sanitizeHeaderValue('a\u0000na\u007F@ex\u0085ample.com'), 'ana@example.com');
  assert.equal(sanitizeHeaderValue('Pedro Lopes'), 'Pedro Lopes');
});

test('contact email headers use sanitized name and reply-to, and stay plain text', () => {
  const email = buildContactEmail({
    at: '2026-10-16T03:00:00.000Z',
    name: 'Ana\r\nBcc: evil@example.com',
    email: 'ana@example.com\r\n',
    message,
    source: 'agent'
  });

  assert.deepEqual(email.from, { email: 'contato@pherls.dev', name: 'Pedro Lopes' });
  assert.equal(email.to, 'phpherls@gmail.com');
  assert.equal(email.subject, '[pherls.dev] Nova mensagem de AnaBcc: evil@example.com');
  assert.equal(email.replyTo, 'ana@example.com');
  assert.doesNotMatch(email.subject, /[\r\n\u0000-\u001F\u007F-\u009F]/);
  assert.doesNotMatch(email.replyTo, /[\r\n\u0000-\u001F\u007F-\u009F]/);
  assert.equal('html' in email, false);
  assert.match(email.text, /Nome: Ana/);
  assert.match(email.text, /E-mail: ana@example.com/);
  assert.match(email.text, /Origem: agent/);
  assert.match(email.text, /Quando: 2026-10-16T03:00:00.000Z/);
  assert.match(email.text, new RegExp(message));
});

test('email send failure still stores the message and returns 200', async () => {
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  const stored: string[] = [];
  let sentSubject = '';

  try {
    const response = await handlePortfolioRequest(
      new Request('https://pherls.dev/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Ana\r\nBcc: evil@example.com',
          email: 'ana@example.com',
          message,
          source: 'form'
        })
      }),
      {
        INBOX: {
          async put(_key: string, value: string) {
            stored.push(value);
          }
        },
        SEND_EMAIL: {
          async send(email) {
            assert.equal(stored.length, 1);
            sentSubject = email.subject;
            assert.equal(email.replyTo, 'ana@example.com');
            assert.equal('html' in email, false);
            throw new Error('smtp down');
          }
        }
      }
    );

    assert.ok(response);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(stored.length, 1);
    assert.equal(sentSubject, '[pherls.dev] Nova mensagem de AnaBcc: evil@example.com');
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0]?.[0]), /contact_email_failed/);
    assert.match(String(warnings[0]?.[0]), /smtp down/);
  } finally {
    console.warn = originalWarn;
  }
});

test('a missing SEND_EMAIL binding skips sending and still returns 200', async () => {
  const originalWarn = console.warn;
  let warned = false;
  console.warn = () => {
    warned = true;
  };

  try {
    const response = await handlePortfolioRequest(
      new Request('https://pherls.dev/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Ana Silva',
          email: 'ana@example.com',
          message,
          source: 'form'
        })
      }),
      {
        INBOX: {
          async put() {
            return undefined;
          }
        }
      }
    );

    assert.ok(response);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(warned, false);
  } finally {
    console.warn = originalWarn;
  }
});
