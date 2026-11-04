import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { seoPageUrl, isPublishedSeoPage } from '../lib/site.mjs';

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
