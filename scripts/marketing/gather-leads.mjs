// Data harvester for the NorthStar Freight Brief (NSNN).
//
// Pulls three public, documented data sources. Nothing is scraped from HTML, and no
// personal data is collected: these are market and regulatory facts only.
//   1. EIA Open Data API v2: weekly U.S. No. 2 diesel retail price (needs a free EIA_API_KEY).
//   2. Freight RSS feeds listed in scripts/nsnn/sources.json.
//   3. Federal Register API (no key): FMCSA rules and IRS information-reporting documents.
//
// Every item gets a short id (F1, H3, R2). The writer cites those ids, the fact checker
// verifies them, and the CTA rules point at them, so every claim traces back to a source.
//
//   node scripts/marketing/gather-leads.mjs            prints the harvest as JSON
//   node scripts/marketing/gather-leads.mjs --signals  also prints the detected CTA signals
//
// A failing source is logged in harvest.errors and skipped; the run continues.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';
import { loadConfig, localDate } from './lib/config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_FILE = path.resolve(here, '../nsnn/sources.json');
const TIMEOUT_MS = 15000;
const EIA_SERIES = 'EMD_EPD2D_PTE_NUS_DPG'; // U.S. No 2 diesel retail price, dollars per gallon, weekly
const FR_API = 'https://www.federalregister.gov/api/v1/documents.json';

const clean = (s, max = 400) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const daysAgo = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

async function getJson(url, fetchImpl) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// EIA: the latest nine weekly prices, newest first, so we can compute 1-week and 4-week moves.
export async function fetchFuel({ apiKey, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('EIA_API_KEY is not set');
  const url = new URL('https://api.eia.gov/v2/petroleum/pri/gnd/data/');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('frequency', 'weekly');
  url.searchParams.set('data[0]', 'value');
  url.searchParams.set('facets[series][]', EIA_SERIES);
  url.searchParams.set('sort[0][column]', 'period');
  url.searchParams.set('sort[0][direction]', 'desc');
  url.searchParams.set('length', '9');
  const body = await getJson(url, fetchImpl);
  const weeks = (body?.response?.data ?? [])
    .map((r) => ({ period: String(r.period), value: Number(r.value) }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.period) && Number.isFinite(r.value) && r.value > 0)
    .sort((a, b) => (a.period < b.period ? 1 : -1));
  if (weeks.length === 0) throw new Error('EIA returned no diesel rows');
  return summarizeFuel(weeks);
}

// Pure: turns weekly rows (newest first) into the fuel block, with every derived number pre-formatted
// so the writer quotes exactly these strings and the fact checker can verify them.
export function summarizeFuel(weeks) {
  const [latest, prev] = weeks;
  const four = weeks[4];
  const cents = (a, b) => Math.round((a - b) * 1000) / 10; // one decimal, in cents
  const change = prev ? cents(latest.value, prev.value) : null;
  const pct = prev ? Math.round(((latest.value - prev.value) / prev.value) * 1000) / 10 : null;
  const fourWeek = four ? cents(latest.value, four.value) : null;
  return {
    id: 'F1',
    series: EIA_SERIES,
    source: 'U.S. Energy Information Administration (EIA)',
    link: 'https://www.eia.gov/petroleum/gasdiesel/',
    unit: 'dollars per gallon',
    latest,
    previous: prev ?? null,
    weeklyChangeCents: change,
    weeklyChangePct: pct,
    fourWeekChangeCents: fourWeek,
    formatted: {
      latest: `$${latest.value.toFixed(3)}`,
      weeklyChange: change === null ? null : `${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)} cents`,
      weeklyChangePct: pct === null ? null : `${Math.abs(pct).toFixed(1)}%`,
      fourWeekChange: fourWeek === null ? null : `${fourWeek >= 0 ? 'up' : 'down'} ${Math.abs(fourWeek).toFixed(1)} cents`,
    },
    weeks,
  };
}

export async function loadFeeds() {
  return JSON.parse(await readFile(SOURCES_FILE, 'utf8')).feeds;
}

export async function fetchFeed(feed, { max, parser = new Parser({ timeout: TIMEOUT_MS }) }) {
  const parsed = await parser.parseURL(feed.url);
  return (parsed.items ?? [])
    .slice(0, max)
    .map((item) => ({
      source: feed.name,
      category: feed.category,
      title: clean(item.title, 240),
      link: item.link || '',
      published: item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : null),
      snippet: clean(item.contentSnippet || item.summary || '', 400),
    }))
    .filter((i) => i.title && /^https?:\/\//.test(i.link));
}

// Federal Register: newest documents for one agency since a date, optionally matching a search term.
export async function fetchFederalRegister({ agency, label, since, term, types, fetchImpl = fetch }) {
  const url = new URL(FR_API);
  url.searchParams.set('per_page', '20');
  url.searchParams.set('order', 'newest');
  url.searchParams.append('conditions[agencies][]', agency);
  url.searchParams.set('conditions[publication_date][gte]', since);
  if (term) url.searchParams.set('conditions[term]', term);
  for (const t of types ?? []) url.searchParams.append('conditions[type][]', t);
  for (const f of ['title', 'type', 'abstract', 'html_url', 'publication_date', 'document_number']) url.searchParams.append('fields[]', f);
  const body = await getJson(url, fetchImpl);
  return (body?.results ?? [])
    .map((d) => ({
      agency: label,
      type: clean(d.type, 40),
      title: clean(d.title, 300),
      abstract: clean(d.abstract, 500),
      link: d.html_url || '',
      published: d.publication_date || null,
      documentNumber: clean(d.document_number, 40),
    }))
    .filter((d) => d.title && /^https:\/\/www\.federalregister\.gov\//.test(d.link));
}

// Keeps items published within maxAgeDays of now (allowing a day of clock skew ahead).
export function freshOnly(items, { now, maxAgeDays }) {
  return items.filter((h) => {
    const t = Date.parse(h.published ?? '');
    if (!Number.isFinite(t)) return false;
    const ageDays = (now.getTime() - t) / 864e5;
    return ageDays <= maxAgeDays && ageDays >= -1;
  });
}

// Collects everything. Each source fails independently.
export async function gather({ env = process.env, now = new Date(), fetchImpl = fetch, parser } = {}) {
  const cfg = loadConfig(env);
  const date = localDate(now);
  const errors = [];
  const attempt = async (source, fn, fallback) => {
    try { return await fn(); } catch (e) {
      errors.push({ source, message: String(e?.message || e).slice(0, 200) });
      return fallback;
    }
  };

  const feeds = await attempt('sources.json', loadFeeds, []);
  const [fuel, feedItems, fmcsa, irs] = await Promise.all([
    attempt('EIA diesel', () => fetchFuel({ apiKey: cfg.eiaApiKey, fetchImpl }), null),
    Promise.all(feeds.map((f) => attempt(`RSS: ${f.name}`, () => fetchFeed(f, { max: cfg.maxHeadlinesPerFeed, parser }), []))),
    attempt('Federal Register: FMCSA', () => fetchFederalRegister({
      agency: 'federal-motor-carrier-safety-administration', label: 'FMCSA',
      since: daysAgo(date, cfg.thresholds.fmcsaLookbackDays), types: ['RULE', 'PRORULE'], fetchImpl,
    }), []),
    attempt('Federal Register: IRS', () => fetchFederalRegister({
      agency: 'internal-revenue-service', label: 'IRS',
      since: daysAgo(date, cfg.thresholds.taxLookbackDays), term: '1099', fetchImpl,
    }), []),
  ]);

  const seen = new Set();
  const headlines = freshOnly(feedItems.flat(), { now, maxAgeDays: cfg.maxHeadlineAgeDays })
    .filter((h) => (seen.has(h.link) ? false : seen.add(h.link)))
    .sort((a, b) => String(b.published ?? '').localeCompare(String(a.published ?? '')))
    .map((h, i) => ({ id: `H${i + 1}`, ...h }));
  const regulatory = [...fmcsa, ...irs].map((d, i) => ({ id: `R${i + 1}`, ...d }));

  return { generatedAt: now.toISOString(), date, timezone: 'America/Chicago', fuel, headlines, regulatory, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const harvest = await gather();
  const out = { ...harvest };
  if (process.argv.includes('--signals')) {
    const { detectSignals } = await import('./lib/signals.mjs');
    out.signals = detectSignals(harvest, { thresholds: loadConfig().thresholds });
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(0); // rss-parser can leave a keep-alive socket open
}
