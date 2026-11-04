// Writes the day's brief into the static NorthStar site: the web page, its Markdown copy,
// the NSNN index and archive, and sitemap.xml (so search engines and IndexNow find it).
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
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


// Fetches public SEO slugs from Supabase using GitHub Actions secrets.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are supplied only to the workflow;
// the key is never written to the repository or sitemap.
export async function fetchNorthstarSeoPages({ env = process.env, fetchImpl = fetch } = {}) {
  const supabaseUrl = env.SUPABASE_URL;
  const apiKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !apiKey) {
    console.warn('[sitemap] Supabase credentials missing; NorthStar SEO matrix URLs were not added.');
    return [];
  }

  const base = supabaseUrl.replace(/\\/+$/, '');
  const pages = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const endpoint = new URL(`${base}/rest/v1/northstar_seo_matrix`);
    endpoint.searchParams.set('select', 'slug,created_at');
    endpoint.searchParams.set('slug', 'not.is.null');
    const response = await fetchImpl(endpoint, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        Range: `${offset}-${offset + pageSize - 1}`,
        'Range-Unit': 'items',
      },
    });
    if (!response.ok) {
      throw new Error(`Supabase sitemap query failed: HTTP ${response.status} ${response.statusText}`);
    }
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Supabase sitemap query returned a non-array response.');
    pages.push(...batch);
    if (batch.length < pageSize) break;
  }
  return pages;
}

function normalizeSeoSlug(slug) {
  if (typeof slug !== 'string') return null;
  const clean = slug.trim().replace(/^\/+|\/+$/g, '');
  if (!clean || clean.includes('/') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(clean)) return null;
  return clean;
}

// NorthStar SEO matrix slugs map to real generated tool directories, not site-root slugs.
export function seoPageUrl(slug) {
  const clean = normalizeSeoSlug(slug);
  return clean ? `https://northstardeliveryservice.com/tools/${clean}/` : null;
}

export async function isPublishedSeoPage(root, slug) {
  const clean = normalizeSeoSlug(slug);
  if (!clean) return false;
  try {
    await access(path.join(root, 'tools', clean, 'index.html'));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

function removeSitemapUrl(xml, url) {
  const start = xml.indexOf(`<url><loc>${url}</loc>`);
  if (start < 0) return xml;
  const end = xml.indexOf('</url>', start);
  if (end < 0) return xml;
  return xml.slice(0, start) + xml.slice(end + '</url>'.length);
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
  let xml = await readFile(smPath, 'utf8');
  const seoPages = await fetchNorthstarSeoPages();
  let addedSeoUrls = 0;
  let skippedUnpublished = 0;
  let removedStaleUrls = 0;
  for (const item of seoPages) {
    const url = seoPageUrl(item.slug);
    if (!url) continue;
    if (!(await isPublishedSeoPage(root, item.slug))) {
      if (xml.includes(`<loc>${url}</loc>`)) removedStaleUrls += 1;
      xml = removeSitemapUrl(xml, url);
      skippedUnpublished += 1;
      continue;
    }
    const lastmod = item.created_at && !Number.isNaN(Date.parse(item.created_at))
      ? new Date(item.created_at).toISOString().slice(0, 10)
      : date;
    const alreadyPresent = xml.includes(`<loc>${url}</loc>`);
    xml = updateSitemap(xml, { url, date: lastmod });
    if (!alreadyPresent) addedSeoUrls += 1;
  }
  xml = updateSitemap(xml, { url: briefUrl(date), date });
  console.log(`[sitemap] Supabase SEO matrix: ${seoPages.length} rows read, ${addedSeoUrls} new URLs added, ${skippedUnpublished} unpublished rows skipped, ${removedStaleUrls} stale URLs removed.`);
  await writeFile(smPath, xml, 'utf8');

  return { entry, paths: [page, mdPath, 'news/data/entries.json', 'news/index.html', 'news/archive.html', 'sitemap.xml'] };
}
