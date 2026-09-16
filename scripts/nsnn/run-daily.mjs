import { writeFile } from 'node:fs/promises';
import { fetchHeadlines } from './fetch-headlines.mjs';
import { writeScript } from './write-script.mjs';
import { loadEntries, buildNewsPages } from './build-news-page.mjs';
import { sendNewsletter } from './send-newsletter.mjs';

function todayEasternDate() {
  // en-CA locale gives YYYY-MM-DD directly.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

function parseArgs(argv) {
  return {
    publish: argv.includes('--publish'),
    send: argv.includes('--send'),
  };
}

async function main() {
  const { publish, send } = parseArgs(process.argv.slice(2));

  console.log('[nsnn] Fetching headlines...');
  const { headlines, dieselPrice } = await fetchHeadlines();

  if (headlines.length === 0) {
    console.error('[nsnn] ERROR: no headlines fetched from any source — refusing to write a brief with nothing to cover.');
    process.exitCode = 1;
    return;
  }
  console.log(`[nsnn] Got ${headlines.length} headlines from ${new Set(headlines.map((h) => h.source)).size} source(s).`);

  console.log('[nsnn] Writing script with Claude...');
  const { script, subject } = await writeScript({ headlines, dieselPrice });

  const entry = {
    date: todayEasternDate(),
    subject,
    script,
    dieselPrice,
    topHeadline: headlines[0].title,
    sources: headlines.slice(0, 5).map(({ source, title, link }) => ({ source, title, link })),
  };

  console.log('\n===== NSNN DRAFT =====');
  console.log(`Date:    ${entry.date}`);
  console.log(`Subject: ${entry.subject}`);
  console.log(`\n${entry.script}\n`);
  console.log('=======================\n');

  if (!publish) {
    console.log('[nsnn] Dry run only (no --publish flag) — nothing written to the repo or sent. Pass --publish to write news/data/entries.json and rebuild the news pages.');
    return;
  }

  const entries = await loadEntries();
  const withoutToday = entries.filter((e) => e.date !== entry.date);
  const updated = [entry, ...withoutToday];
  await writeFile(
    new URL('../../news/data/entries.json', import.meta.url),
    JSON.stringify(updated, null, 2) + '\n',
    'utf8'
  );
  await buildNewsPages(updated);
  console.log('[nsnn] Published: news/data/entries.json, news/index.html, and news/archive.html updated.');

  if (send) {
    console.log('[nsnn] Sending newsletter via Beehiiv...');
    const result = await sendNewsletter(entry);
    console.log('[nsnn] Beehiiv response:', JSON.stringify(result));
  } else {
    console.log('[nsnn] Skipped newsletter send (pass --send to enable once you\'ve manually verified a test send).');
  }
}

main()
  .catch((err) => {
    console.error('[nsnn] FATAL:', err.stack || err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    // Force-exit: rss-parser's underlying HTTP client can leave a keep-alive socket
    // open even after we're done with it, which would otherwise hang the process.
    process.exit(process.exitCode || 0);
  });
