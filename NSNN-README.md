# NSNN — NorthStar News Network

Automated daily freight brief for NorthStar Delivery Solutions. This covers build-brief
steps 1–4 (rate tools, fetch, script-writing, newsletter, and the daily schedule). **The
HeyGen AI-anchor video step (step 5 in the brief) is intentionally not built yet** —
stopped here per instructions.

## What's here

| Path | Purpose |
|---|---|
| `rate-tools.html` | Carrier rate calculator, linked from nav/footer (brief step 1). |
| `scripts/nsnn/sources.json` | RSS feed list (FreightWaves + one trade/tariff source). Edit freely. |
| `scripts/nsnn/fetch-headlines.mjs` | Pulls headlines from the RSS feeds above; optionally pulls the latest weekly diesel price from the EIA Open Data API v2 if `EIA_API_KEY` is set. Per-feed failures are logged and skipped rather than crashing the run. |
| `scripts/nsnn/write-script.mjs` | Sends the day's headlines to Claude (Anthropic Messages API) with the brief's exact prompt (original wording only, 60–90s / ~150–200 words, signs off as NSNN). |
| `scripts/nsnn/build-news-page.mjs` | Renders `news/index.html` (most recent entries) and `news/archive.html` (everything older) from `news/data/entries.json`. |
| `scripts/nsnn/send-newsletter.mjs` | Sends the brief via the Beehiiv API, with an affiliate footer (Summar Financial, Trucking365 TMS, RTS Fuel Card). |
| `scripts/nsnn/run-daily.mjs` | Orchestrates the above. **Defaults to a dry run** (fetch + write script, print to console, touch nothing else) unless you pass `--publish` (write `news/` + commit-ready files) and/or `--send` (also email via Beehiiv). |
| `.github/workflows/nsnn-daily.yml` | Scheduled run (~6am ET) plus a manual `workflow_dispatch` with `dry_run` / `send` toggles. Commits `news/` changes back to the repo when not a dry run. |

## Required secrets (GitHub → repo Settings → Secrets and variables → Actions)

- `ANTHROPIC_API_KEY` — required for the script-writing step.
- `EIA_API_KEY` — optional; without it, diesel price is simply omitted from the brief and ticker.
- `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID` — required only for `--send` / the scheduled email.

Nothing above is hardcoded anywhere in this repo — every script reads these from
environment variables, and the workflow maps them from GitHub secrets.

## Testing manually before trusting the schedule

```bash
npm install

# 1. Dry run: fetch + write the script, print it, touch nothing else.
ANTHROPIC_API_KEY=sk-... node scripts/nsnn/run-daily.mjs

# 2. Once that reads well, publish it to the site (writes news/data/entries.json,
#    regenerates news/index.html + news/archive.html) without emailing anyone:
ANTHROPIC_API_KEY=sk-... node scripts/nsnn/run-daily.mjs --publish

# 3. Only once you've checked a real send works, add --send:
ANTHROPIC_API_KEY=sk-... BEEHIIV_API_KEY=... BEEHIIV_PUBLICATION_ID=... \
  node scripts/nsnn/run-daily.mjs --publish --send
```

You can also trigger `.github/workflows/nsnn-daily.yml` manually from the Actions tab
(`workflow_dispatch`) with `dry_run: true` first, before ever letting the 6am schedule run
for real.

## Things to verify before going live (built without live internet access)

This was built in a sandboxed environment with no outbound internet access, so the
following were written against documented/standard API shapes but **could not be
exercised against a live account**:

1. **RSS feed URLs** in `scripts/nsnn/sources.json` — confirm `https://www.freightwaves.com/news/feed`
   and the Supply Chain Dive feed actually resolve and return the content you want; swap
   in a different tariff/trade source if you'd rather use one.
2. **EIA API query** in `fetch-headlines.mjs` (`fetchDieselPrice`) — the series ID and
   query params for weekly diesel prices should be checked against https://www.eia.gov/opendata/.
3. **Beehiiv API call** in `send-newsletter.mjs` — the endpoint/payload shape (particularly
   `status: 'confirmed'` for "publish + send now" vs. draft, and the `content.free.html`
   field) should be checked against https://developers.beehiiv.com and confirmed with one
   real test send before relying on the schedule to email your list unattended.

None of these affect the site itself (nav, rate tools, generated news pages already
render correctly and were tested locally) — they only affect the three external API
calls the pipeline makes.

## Next step (not built yet)

Step 5 from the brief — HeyGen AI-anchor video generation, embedding, and optional
YouTube auto-post — was explicitly held back for a later pass.
