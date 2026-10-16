#!/usr/bin/env node
// NSNN marketing pipeline: harvest -> signals -> Claude brief -> fact check -> CTA injection
// -> site page + Markdown -> Beehiiv post -> git push.
//
//   node scripts/marketing/pipeline.mjs --sources-only   fetch data and show the CTA signals (no Claude call, free)
//   node scripts/marketing/pipeline.mjs                  dry run: write and fact-check the brief, print it, touch nothing
//   node scripts/marketing/pipeline.mjs --publish        also write the web page, Markdown, index, archive and sitemap
//     --beehiiv=draft      create the post in Beehiiv as a draft for review (default: off)
//     --beehiiv=schedule   create it scheduled for NSNN_SEND_TIME (America/Chicago), no review
//     --git-push           commit the published files and push, so GitHub Pages republishes the site
//     --fixture=FILE       use a saved harvest JSON instead of fetching (tests, replays)
//     --force              rewrite today's brief even if it was already published
//
// Exit codes: 0 done, 1 error, 2 the fact check rejected the brief (nothing published or sent).
// Secrets: ANTHROPIC_API_KEY, EIA_API_KEY, BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID (env only).
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { gather } from './gather-leads.mjs';
import { loadConfig, zonedTimeToUtc } from './lib/config.mjs';
import { detectSignals } from './lib/signals.mjs';
import { selectCtas, injectCtas } from './lib/ctas.mjs';
import { writeBrief, BriefWriteError } from './lib/writer.mjs';
import { checkBrief } from './lib/factcheck.mjs';
import { renderEmailHtml, renderMarkdown } from './lib/render-brief.mjs';
import { publishSite, loadEntries, saveEntries } from './lib/site.mjs';
import { createPost } from './lib/beehiiv.mjs';
import { commitAndPush } from './lib/git.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, '../..');

export function parseArgs(argv) {
  const val = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') ?? null;
  const beehiiv = val('beehiiv') ?? 'off';
  if (!['off', 'draft', 'schedule'].includes(beehiiv)) throw new Error(`--beehiiv must be off, draft or schedule (got "${beehiiv}")`);
  return {
    sourcesOnly: argv.includes('--sources-only'),
    publish: argv.includes('--publish'),
    gitPush: argv.includes('--git-push'),
    force: argv.includes('--force'),
    beehiiv,
    fixture: val('fixture'),
    root: val('root') ?? REPO_ROOT,
  };
}

const log = (msg) => console.log(`[nsnn] ${msg}`);
const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `[nsnn] WARNING: ${msg}`);
async function ghOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}
async function ghSummary(md) {
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${md}\n`);
}

// Writes the brief, then fact-checks it. One rewrite is allowed with the checker's notes.
export async function writeCheckedBrief({ harvest, signals, cfg, client, attempts = 2 }) {
  let previous = null;
  let problems = null;
  for (let i = 0; i < attempts; i++) {
    const { brief, model, usage } = await writeBrief({ harvest, signals, model: cfg.anthropicModel, effort: cfg.anthropicEffort, client, feedback: problems, previous });
    const check = checkBrief(brief, harvest);
    log(`draft ${i + 1} by ${model}: ${check.ok ? 'passed the fact check' : `${check.problems.length} problem(s)`} (${usage?.input_tokens ?? '?'} in / ${usage?.output_tokens ?? '?'} out tokens)`);
    if (check.ok) return { ok: true, brief, model };
    previous = brief;
    problems = check.problems;
  }
  return { ok: false, problems, brief: previous };
}

export async function run(opts, { env = process.env, now = new Date(), client, fetchImpl = fetch, git } = {}) {
  const cfg = loadConfig(env);

  // 1. Harvest
  const harvest = opts.fixture
    ? JSON.parse(await readFile(path.resolve(opts.fixture), 'utf8'))
    : await gather({ env, now, fetchImpl });
  const { date } = harvest;
  log(`${date}: ${harvest.headlines.length} headlines, ${harvest.regulatory.length} Federal Register documents, diesel ${harvest.fuel ? harvest.fuel.formatted.latest : 'unavailable'}`);
  for (const e of harvest.errors ?? []) warn(`source failed: ${e.source}: ${e.message}`);

  // 2. Signals and CTAs
  const signals = detectSignals(harvest, { thresholds: cfg.thresholds, now });
  const ctas = selectCtas(signals);
  log(`signals: ${signals.map((s) => `${s.key} (${s.reason})`).join('; ') || 'none'}`);
  log(`CTAs: ${ctas.map((c) => `${c.product} [${c.signal}]`).join(', ') || 'none'}`);

  if (opts.sourcesOnly) {
    const f = harvest.fuel;
    if (f) log(`diesel by week: ${f.weeks.map((w) => `${w.period} $${w.value.toFixed(3)}`).join(', ')}`);
    for (const r of harvest.regulatory) log(`${r.id} ${r.agency} ${r.type} ${r.published}: ${r.title}`);
    for (const h of harvest.headlines) log(`${h.id} [${h.source}] ${h.published?.slice(0, 16) ?? '?'} ${h.title} | by: ${h.creator || '-'} | tags: ${(h.categories ?? []).join(', ') || '-'} | ${h.link}`);
    await ghSummary([`### NSNN sources check, ${date}`, '', `- Headlines: ${harvest.headlines.length}`, `- Federal Register documents: ${harvest.regulatory.length}`,
      `- Diesel: ${harvest.fuel ? `${harvest.fuel.formatted.latest} (week of ${harvest.fuel.latest.period}, ${harvest.fuel.formatted.weeklyChange ?? 'no prior week'})` : 'unavailable'}`,
      `- Source errors: ${(harvest.errors ?? []).map((e) => `${e.source}: ${e.message}`).join('; ') || 'none'}`,
      `- Signals: ${signals.map((s) => s.key).join(', ') || 'none'}`, `- CTAs: ${ctas.map((c) => c.product).join(', ') || 'none'}`].join('\n'));
    return { code: 0, harvest, signals, ctas };
  }
  if (harvest.headlines.length === 0 && !harvest.fuel && harvest.regulatory.length === 0) {
    console.error('[nsnn] No source returned any data; refusing to write a brief about nothing.');
    return { code: 1 };
  }

  // 3. Brief: reuse today's published one unless --force, so a re-run never pays twice or double-sends.
  const savedPath = path.join(opts.root, `news/data/briefs/${date}.json`);
  let saved = null;
  if (!opts.force) saved = await readFile(savedPath, 'utf8').then(JSON.parse).catch(() => null);
  let brief;
  if (saved) {
    log(`reusing the brief already published for ${date} (pass --force to rewrite it)`);
    brief = saved.brief;
  } else {
    const result = await writeCheckedBrief({ harvest, signals, cfg, client: client ?? new Anthropic() });
    if (!result.ok) {
      console.error(`[nsnn] Fact check failed twice; nothing published or sent:\n${result.problems.map((p) => `  - ${p}`).join('\n')}`);
      await ghSummary(`### NSNN brief rejected by the fact check (${date})\n\n${result.problems.map((p) => `- ${p}`).join('\n')}`);
      return { code: 2, problems: result.problems };
    }
    brief = result.brief;
  }
  const useHarvest = saved?.harvest ?? harvest;
  const useCtas = saved?.ctas ?? ctas;
  const blocks = injectCtas(brief, useCtas);
  const ctx = { brief, blocks, harvest: useHarvest, date };

  if (!opts.publish) {
    console.log(`\n===== NSNN FREIGHT BRIEF (dry run) =====\nSubject: ${brief.subject}\n\n${renderMarkdown(ctx)}========================================`);
    log('Dry run: nothing written or sent. Add --publish to update the site.');
    return { code: 0, brief, blocks };
  }

  // 4. Site
  const changed = [];
  if (!saved) {
    const { paths } = await publishSite({ root: opts.root, ...ctx, recentCount: cfg.recentEntriesOnIndex });
    await mkdir(path.dirname(savedPath), { recursive: true });
    await writeFile(savedPath, JSON.stringify({ brief, harvest, signals, ctas }, null, 2) + '\n', 'utf8');
    changed.push(...paths, path.relative(opts.root, savedPath));
    log(`published news/briefs/${date}.html and .md; index, archive and sitemap updated`);
  }

  // 5. Beehiiv (before the push, so the post id is committed and a re-run can't send twice)
  if (opts.beehiiv !== 'off') {
    const entries = await loadEntries(opts.root);
    const entry = entries.find((e) => e.date === date);
    if (!cfg.beehiivApiKey || !cfg.beehiivPublicationId) {
      warn('Beehiiv skipped: BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID is not set.');
    } else if (entry?.beehiiv?.id) {
      log(`Beehiiv post ${entry.beehiiv.id} already exists for ${date}; not creating another.`);
    } else {
      let scheduledAt = zonedTimeToUtc(date, cfg.sendTime);
      const soonest = new Date(now.getTime() + 10 * 60 * 1000);
      if (scheduledAt < soonest) scheduledAt = soonest;
      const post = await createPost({
        apiKey: cfg.beehiivApiKey, publicationId: cfg.beehiivPublicationId, fetchImpl,
        title: brief.subject, subtitle: brief.dek, html: renderEmailHtml(ctx), mode: opts.beehiiv, scheduledAt,
      });
      log(`Beehiiv post created: ${post.id ?? '(no id returned)'} as ${opts.beehiiv === 'schedule' ? `scheduled for ${scheduledAt.toISOString()}` : 'a draft'}`);
      if (entry) {
        entry.beehiiv = { id: post.id, mode: opts.beehiiv, scheduledAt: opts.beehiiv === 'schedule' ? scheduledAt.toISOString() : null };
        await saveEntries(opts.root, entries);
        changed.push('news/data/entries.json');
      }
    }
  }

  // 6. Git
  if (opts.gitPush && changed.length) {
    const r = await commitAndPush({ root: opts.root, paths: [...new Set(changed)], message: `NSNN freight brief: ${date}`, ...(git ? { git } : {}) });
    log(r.pushed ? `pushed to ${r.branch}` : 'nothing new to commit');
    await ghOutput('pushed', r.pushed ? 'true' : 'false');
  }
  await ghSummary(`### NSNN freight brief, ${date}\n\n**${brief.headline}**\n\nCTAs: ${useCtas.map((c) => `${c.product} (${c.signal})`).join(', ') || 'none'}`);
  return { code: 0, brief, blocks, changed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let code = 1;
  try {
    ({ code } = await run(parseArgs(process.argv.slice(2))));
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error('[nsnn] Anthropic rejected the API key (401). Replace the ANTHROPIC_API_KEY secret.');
    else if (e instanceof Anthropic.RateLimitError) console.error('[nsnn] Anthropic rate limit; try again later.');
    else if (e instanceof Anthropic.APIError) console.error(`[nsnn] Anthropic API error ${e.status}: ${e.message}`);
    else if (e instanceof BriefWriteError) console.error(`[nsnn] Could not write the brief: ${e.message}`);
    else console.error('[nsnn] FATAL:', e?.stack || e);
  }
  process.exit(code); // rss-parser can leave a keep-alive socket open
}
