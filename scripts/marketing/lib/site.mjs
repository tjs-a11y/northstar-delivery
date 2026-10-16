// Writes the day's brief into the static NorthStar site: the web page, its Markdown copy,
// the NSNN index and archive, and sitemap.xml (so search engines and IndexNow find it).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderIndexPage, renderArchivePage } from '../../nsnn/lib/render.mjs';
import { renderWebPage, renderMarkdown, briefPath, briefUrl } from './render-brief.mjs';

export async function loadEntries(root) {
  try {
    const entries = JSON.parse(await readFile(path.join(root, 'news/data/entries.json'), 'utf8'));
    return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

export async function saveEntries(root, entries) {
  await writeFile(path.join(root, 'news/data/entries.json'), JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

// Adds or refreshes a <url> in sitemap.xml and bumps lastmod on the NSNN index pages.
export function updateSitemap(xml, { url, date }) {
  let out = xml;
  const bump = (loc) => {
    const re = new RegExp(`(<url><loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc><lastmod>)[^<]*(</lastmod></url>)`);
    out = out.replace(re, `$1${date}$2`);
  };
  if (out.includes(`<loc>${url}</loc>`)) bump(url);
  else out = out.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${date}</lastmod></url>\n</urlset>`);
  const origin = new URL(url).origin;
  bump(`${origin}/news/index.html`);
  bump(`${origin}/news/archive.html`);
  return out;
}

// Returns the repo-relative paths it wrote.
export async function publishSite({ root, date, brief, blocks, harvest, recentCount = 10, extra = {} }) {
  const page = briefPath(date);
  const mdPath = page.replace(/\.html$/, '.md');
  await mkdir(path.join(root, path.dirname(page)), { recursive: true });
  await writeFile(path.join(root, page), renderWebPage({ brief, blocks, harvest, date }), 'utf8');
  await writeFile(path.join(root, mdPath), renderMarkdown({ brief, blocks, harvest, date }), 'utf8');

  const entries = await loadEntries(root);
  const previous = entries.find((e) => e.date === date) ?? {};
  const entry = {
    ...previous,
    ...extra,
    date,
    subject: brief.subject,
    headline: brief.headline,
    // The index page shows this short text and links to the full brief.
    script: `${brief.dek}\n\n${brief.lede}`,
    url: `briefs/${date}.html`,
    dieselPrice: harvest.fuel ? { period: harvest.fuel.latest.period, dollarsPerGallon: harvest.fuel.latest.value } : null,
    topHeadline: brief.headline,
    sources: [...new Set(brief.sections.flatMap((s) => s.source_ids))]
      .map((id) => harvest.headlines.find((h) => h.id === id) ?? harvest.regulatory.find((r) => r.id === id))
      .filter(Boolean).slice(0, 6)
      .map((x) => ({ source: x.source ?? `Federal Register (${x.agency})`, title: x.title, link: x.link })),
    ctas: blocks.filter((b) => b.type === 'cta').map((b) => ({ id: b.cta.id, signal: b.cta.signal })),
  };
  const updated = [entry, ...entries.filter((e) => e.date !== date)];
  await saveEntries(root, updated);
  await writeFile(path.join(root, 'news/index.html'), renderIndexPage(updated, recentCount), 'utf8');
  await writeFile(path.join(root, 'news/archive.html'), renderArchivePage(updated, recentCount), 'utf8');

  const smPath = path.join(root, 'sitemap.xml');
  const xml = await readFile(smPath, 'utf8');
  await writeFile(smPath, updateSitemap(xml, { url: briefUrl(date), date }), 'utf8');

  return { entry, paths: [page, mdPath, 'news/data/entries.json', 'news/index.html', 'news/archive.html', 'sitemap.xml'] };
}
