import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  featuredProjectLinks,
  featuredProjectLlmsMdItems,
  featuredProjectPedroMdLines,
  resumeFeaturedProjectEntry,
  serializeFeaturedProjectLinks
} from '../src/utils/featuredProjectLinks.ts';

const mdItem = (label, href) => `- [${label}](${href})`;

test('featuredProjectLinks lists only present URLs in site-then-repo order', () => {
  assert.deepEqual(
    featuredProjectLinks({
      href: 'https://example.com/app',
      repoUrl: 'https://github.com/org/repo'
    }),
    [
      { kind: 'site', href: 'https://example.com/app' },
      { kind: 'repo', href: 'https://github.com/org/repo' }
    ]
  );
  assert.deepEqual(
    featuredProjectLinks({ repoUrl: 'https://github.com/org/repo' }),
    [{ kind: 'repo', href: 'https://github.com/org/repo' }]
  );
  assert.deepEqual(featuredProjectLinks({}), []);
});

test('serializers omit missing links and never emit empty or undefined text', () => {
  const repoOnly = { name: 'Demo', description: 'Tag', repoUrl: 'https://github.com/org/repo', keywords: ['Go'] };
  const neither = { name: 'Demo', description: 'Tag', keywords: [] };

  const resume = resumeFeaturedProjectEntry(repoOnly);
  assert.equal(resume.url, undefined);
  assert.equal(resume.codeRepository, 'https://github.com/org/repo');
  assert.equal(JSON.stringify(resume).includes('undefined'), false);

  const resumeEmpty = resumeFeaturedProjectEntry(neither);
  assert.equal('url' in resumeEmpty, false);
  assert.equal('codeRepository' in resumeEmpty, false);

  const llms = featuredProjectLlmsMdItems(repoOnly, mdItem).join('\n');
  assert.match(llms, /Repositório/);
  assert.doesNotMatch(llms, /App/);
  assert.doesNotMatch(llms, /undefined/);

  const pedro = featuredProjectPedroMdLines({ href: 'https://example.com' }).join('\n');
  assert.match(pedro, /App: https:\/\/example\.com/);
  assert.doesNotMatch(pedro, /Repositório/);

  assert.deepEqual(serializeFeaturedProjectLinks({}), []);
  assert.doesNotMatch(serializeFeaturedProjectLinks({ href: '  ' }).join(''), /./);
});
