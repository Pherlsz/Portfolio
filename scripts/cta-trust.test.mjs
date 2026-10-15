import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const portfolio = readFileSync(new URL('../src/data/portfolioData.ts', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ctaSource = readFileSync(new URL('../src/components/CTA.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const heroSource = readFileSync(new URL('../src/components/Hero.tsx', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../src/components/SiteHeader.tsx', import.meta.url), 'utf8');

test('Pedro-approved trust copy is in portfolio data', () => {
  assert.match(
    portfolio,
    /São cerca de 5 anos construindo front-end em produção, de estágio a júnior, usando IA no dia a dia para entregar mais e melhor\. Estou aberto a vagas pleno quando houver fit\./
  );
});

test('meta description aligns experience years with trust copy', () => {
  assert.match(indexHtml, /cerca de 5 anos/);
  assert.doesNotMatch(indexHtml, /mais de 4 anos/i);
});

test('CTA component declares primary, secondary and tertiary variants', () => {
  assert.match(ctaSource, /'primary' \| 'secondary' \| 'tertiary'/);
  assert.match(ctaSource, /cta-\$\{variant\}/);
  assert.match(cssSource, /\.cta-primary/);
  assert.match(cssSource, /\.cta-secondary/);
  assert.match(cssSource, /\.cta-tertiary/);
});

test('Hero uses CTA hierarchy without ad-hoc btn-primary', () => {
  assert.match(heroSource, /variant="primary"/);
  assert.match(heroSource, /JobFitCta/);
  assert.match(heroSource, /variant="tertiary"/);
  assert.doesNotMatch(heroSource, /btn-primary/);
});

test('indexable contato shell includes trustCopy', () => {
  const shell = readFileSync(new URL('../src/data/machineDocuments.ts', import.meta.url), 'utf8');
  assert.match(shell, /profile\.trustCopy/);
  assert.match(shell, /id="contato"/);
});

test('contact section uses one email pattern and a single copy control', () => {
  const contact = readFileSync(new URL('../src/components/ContactSection.tsx', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../src/components/ui.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(contact, /Falar por e-mail/);
  assert.match(contact, /mailto:\$\{profile\.email\}/);
  assert.match(contact, /CopyEmailButton/);
  assert.match(contact, /label="Copiar e-mail"/);
  assert.match(contact, /variant="primary"/);
  assert.match(contact, /JobFitCta/);
  assert.match(ui, /inline-flex items-center gap-1\.5 whitespace-nowrap/);
});

test('section anchors clear the sticky header and the spy watches every nav target', () => {
  const header = readFileSync(new URL('../src/components/SiteHeader.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(cssSource, /scroll-padding-top:\s*4\.25rem/);
  assert.match(cssSource, /\.d20-face[\s\S]*z-index:\s*2/);
  assert.match(cssSource, /\.d20-face[\s\S]*top:\s*52%/);
  assert.match(header, /new IntersectionObserver/);
  assert.doesNotMatch(app, /scroll-mt-20/);
  for (const id of ['experiencia', 'projeto', 'formacao', 'sobre', 'contato']) {
    assert.match(header, new RegExp(`id: '${id}'`));
  }
});

test('contact section does not render a decorative sticker', () => {
  const contact = readFileSync(new URL('../src/components/ContactSection.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(contact, /StaticSticker|from '\.\/stickers'/);
});

test('sticky header does not use solid primary CV button', () => {
  assert.doesNotMatch(headerSource, /btn-primary/);
  assert.match(headerSource, /variant="tertiary"/);
});

test('profile marketing copy avoids senior self-declaration', () => {
  const profileBlock = portfolio.slice(portfolio.indexOf('profile:'), portfolio.indexOf('experiences:'));
  assert.doesNotMatch(profileBlock, /\bsênior\b|\bsenior\b|\blead\b|\bespecialista\b/i);
});
