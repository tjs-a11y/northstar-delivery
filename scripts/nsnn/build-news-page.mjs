import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from './lib/config.mjs';
import { renderIndexPage, renderArchivePage } from './lib/render.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const entriesPath = path.join(repoRoot, 'news/data/entries.json');
const indexPath = path.join(repoRoot, 'news/index.html');
const archivePath = path.join(repoRoot, 'news/archive.html');

export async function loadEntries() {
  const raw = await readFile(entriesPath, 'utf8');
  const entries = JSON.parse(raw);
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function buildNewsPages(entries) {
  const recentCount = config.recentEntriesOnIndex;
  await writeFile(indexPath, renderIndexPage(entries, recentCount), 'utf8');
  await writeFile(archivePath, renderArchivePage(entries, recentCount), 'utf8');
}

// Allow running standalone to regenerate pages from the current entries.json:
//   node scripts/nsnn/build-news-page.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const entries = await loadEntries();
  await buildNewsPages(entries);
  console.log(`[nsnn] Rebuilt news/index.html and news/archive.html from ${entries.length} entries.`);
}
