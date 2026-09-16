import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Parser from 'rss-parser';
import { config } from './lib/config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parser = new Parser({ timeout: 15000 });

async function loadSources() {
  const raw = await readFile(path.join(__dirname, 'sources.json'), 'utf8');
  return JSON.parse(raw).feeds;
}

async function fetchFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || [])
      .slice(0, config.maxHeadlinesPerFeed)
      .map((item) => ({
        source: feed.name,
        category: feed.category,
        title: (item.title || '').trim(),
        link: item.link || '',
        pubDate: item.isoDate || item.pubDate || null,
      }))
      .filter((item) => item.title);
  } catch (err) {
    console.warn(`[nsnn] WARN: failed to fetch feed "${feed.name}" (${feed.url}): ${err.message}`);
    return [];
  }
}

// EIA Open Data API v2 — weekly U.S. No. 2 Diesel Retail Prices series.
// Series ID and query shape per https://www.eia.gov/opendata/ docs; not verified live
// in this build (no internet egress in the build sandbox) — confirm before relying on it.
async function fetchDieselPrice() {
  if (!config.eiaApiKey) {
    console.warn('[nsnn] WARN: EIA_API_KEY not set — skipping diesel price lookup.');
    return null;
  }
  const url = new URL('https://api.eia.gov/v2/petroleum/pri/gnd/data/');
  url.searchParams.set('api_key', config.eiaApiKey);
  url.searchParams.set('frequency', 'weekly');
  url.searchParams.set('data[0]', 'value');
  url.searchParams.set('facets[series][]', 'EMD_EPD2D_PTE_NUS_DPG');
  url.searchParams.set('sort[0][column]', 'period');
  url.searchParams.set('sort[0][direction]', 'desc');
  url.searchParams.set('length', '1');

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`EIA API returned HTTP ${res.status}`);
    }
    const body = await res.json();
    const row = body?.response?.data?.[0];
    if (!row) return null;
    return { period: row.period, dollarsPerGallon: Number(row.value) };
  } catch (err) {
    console.warn(`[nsnn] WARN: EIA diesel price lookup failed: ${err.message}`);
    return null;
  }
}

export async function fetchHeadlines() {
  const feeds = await loadSources();
  const results = await Promise.all(feeds.map(fetchFeed));
  const headlines = results
    .flat()
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

  const dieselPrice = await fetchDieselPrice();

  return { headlines, dieselPrice };
}

// Allow running standalone for manual testing: node scripts/nsnn/fetch-headlines.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const { headlines, dieselPrice } = await fetchHeadlines();
  console.log(JSON.stringify({ headlines, dieselPrice }, null, 2));
}
