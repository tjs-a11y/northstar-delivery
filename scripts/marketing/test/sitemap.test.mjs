import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seoPageUrl, isPublishedSeoPage } from '../lib/site.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('NorthStar SEO slugs map to the tools directory', () => {
  assert.equal(
    seoPageUrl('ltl-pallet-density-calculator'),
    'https://northstardeliveryservice.com/tools/ltl-pallet-density-calculator/'
  );
  assert.equal(seoPageUrl('  rate-con-setoff-clause-checker  '),
    'https://northstardeliveryservice.com/tools/rate-con-setoff-clause-checker/');
});

test('NorthStar SEO slugs reject paths and unsafe characters', () => {
  assert.equal(seoPageUrl('../outside'), null);
  assert.equal(seoPageUrl('tools/inside'), null);
  assert.equal(seoPageUrl('slug?query'), null);
  assert.equal(seoPageUrl(''), null);
});

test('only published tool directories are eligible for the sitemap', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'northstar-sitemap-'));
  try {
    const publishedDir = path.join(root, 'tools', 'rate-con-setoff-clause-checker');
    await mkdir(publishedDir, { recursive: true });
    await writeFile(path.join(publishedDir, 'index.html'), '<!doctype html><title>Tool</title>');
    assert.equal(await isPublishedSeoPage(root, 'rate-con-setoff-clause-checker'), true);
    assert.equal(await isPublishedSeoPage(root, 'ltl-pallet-density-calculator'), false);
    assert.equal(await isPublishedSeoPage(root, '../outside'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('committed NorthStar tool sitemap URLs match published tool pages exactly', async () => {
  const toolsRoot = path.join(repoRoot, 'tools');
  const entries = await readdir(toolsRoot, { withFileTypes: true });
  const expected = [];
  try {
    await access(path.join(toolsRoot, 'index.html'));
    expected.push('https://northstardeliveryservice.com/tools/');
  } catch {}
  for (const entry of entries.filter((item) => item.isDirectory())) {
    try {
      await access(path.join(toolsRoot, entry.name, 'index.html'));
      expected.push(`https://northstardeliveryservice.com/tools/${entry.name}/`);
    } catch {}
  }
  const sitemap = await readFile(path.join(repoRoot, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(urls).size, urls.length, 'sitemap URLs must be unique');
  const actual = urls.filter((url) => url.startsWith('https://northstardeliveryservice.com/tools/')).sort();
  assert.deepEqual(actual, expected.sort());
});
