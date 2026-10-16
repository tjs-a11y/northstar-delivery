# NSNN — NorthStar News Network

The daily **NorthStar Freight Brief**: a short, original market brief for owner-operators and
dispatchers, published on this site and sent through Beehiiv, with call-to-actions chosen by the
day's data.

## How a run works

```
gather-leads.mjs  ──>  signals.mjs  ──>  writer.mjs (Claude)  ──>  factcheck.mjs
 EIA diesel             fuel spike?        structured JSON brief      every number must be
 freight RSS            fraud trend?       citing source ids          in the source data;
 Federal Register       FMCSA rule?                                   no links or ads
 (FMCSA, IRS 1099)      1099 change?                                  (one rewrite allowed)
                        Friday?                     │
                                                    v
                ctas.mjs: inject CTAs next to the story that triggered them
                                                    │
               ┌────────────────────────────────────┼─────────────────────────┐
               v                                    v                         v
   news/briefs/DATE.html + .md          Beehiiv post (draft or         git commit + push,
   index, archive, sitemap.xml          scheduled send)                then IndexNow ping
```

| Path | Purpose |
|---|---|
| `scripts/marketing/gather-leads.mjs` | Harvester. EIA Open Data API v2 (weekly U.S. diesel), RSS feeds from `scripts/nsnn/sources.json`, Federal Register API (FMCSA rules; IRS documents about 1099s). No HTML scraping and no personal data. A failing source is logged and skipped. |
| `scripts/marketing/lib/signals.mjs` | Deterministic rules that decide which CTAs run. Thresholds are env-configurable (below). |
| `scripts/marketing/lib/ctas.mjs` | CTA catalog and the injection loop. |
| `scripts/marketing/lib/writer.mjs` | Claude call (Opus 5.5, structured JSON output, server-side refusal fallback). Source text is passed as escaped, id-tagged data; the model is told to write no links or promotions. |
| `scripts/marketing/lib/factcheck.mjs` | Fails closed: unknown source ids, numbers not found in the data, links or product names in model text. |
| `scripts/marketing/lib/render-brief.mjs` | Email HTML, web page (canonical URL, Open Graph, NewsArticle JSON-LD), Markdown. |
| `scripts/marketing/lib/site.mjs`, `beehiiv.mjs`, `git.mjs` | Site files, Beehiiv Create Post, commit and push (rebase and retry, never force). |
| `scripts/marketing/pipeline.mjs` | The orchestrator and CLI. |
| `.github/workflows/nsnn-daily.yml` | Daily run at 10:00 UTC, plus manual runs (`sources`, `dry`, `publish`). |

## CTA rules

| Signal (from the data) | CTA | Where it goes |
|---|---|---|
| EIA diesel up 5+ cents in a week, or 12+ cents in four weeks | Loadmark: "Secure your loads today" | Right after the lede (priority) |
| 2+ fraud or theft headlines in 72 hours | Loadmark: "Secure your loads today" | Right after the lede (priority) |
| New FMCSA rule in the Federal Register, or FMCSA rule-change headlines | Quickwell Audit Kit | After the section covering that rule |
| IRS 1099 document in the Federal Register, or 1099 headlines | Quickwell Vendor Check | After the section covering it |
| Friday (America/Chicago) | Riddlebound: "Unwind over the weekend with interactive thrillers" | End of the brief |

Each product appears at most once. Every CTA is labeled "From our network", and each brief ends
with a disclosure that the products come from affiliated companies. Links carry UTM tags
(`utm_source=nsnn`, `utm_medium=email|web`, `utm_campaign=freight-brief-DATE`, `utm_content=<signal>`).

## Running it

```bash
npm ci
npm test                                         # unit tests, no network

npm run nsnn:sources                             # fetch data, show signals and CTAs (no Claude call)
ANTHROPIC_API_KEY=... npm run nsnn               # dry run: write + fact-check, print the brief
ANTHROPIC_API_KEY=... npm run nsnn:publish       # write the site files
ANTHROPIC_API_KEY=... BEEHIIV_API_KEY=... BEEHIIV_PUBLICATION_ID=pub_... npm run nsnn:draft
```

Exit codes: `0` done, `1` error, `2` fact check rejected the brief (nothing published or sent).
Re-running on the same day reuses the published brief (no second Claude call) and never creates a
second Beehiiv post. `--force` rewrites the brief.

## Settings

**Secrets** (repo Settings → Secrets and variables → Actions → Secrets): `ANTHROPIC_API_KEY`,
`EIA_API_KEY`, `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`.

**Variables** (same page → Variables): `NSNN_BEEHIIV_MODE` = `draft` (default), `schedule` or `off`;
`NSNN_SEND_TIME` = local send time in America/Chicago, default `06:30`.

**Optional env**: `NSNN_MODEL` (default `claude-opus-5-5`), `NSNN_EFFORT` (default `medium`),
`NSNN_FUEL_SPIKE_WEEKLY_CENTS` (5), `NSNN_FUEL_SPIKE_4WK_CENTS` (12), `NSNN_FRAUD_MIN_HEADLINES` (2),
`NSNN_FRAUD_LOOKBACK_HOURS` (72), `NSNN_FMCSA_LOOKBACK_DAYS` (7), `NSNN_TAX_LOOKBACK_DAYS` (14).

## Not yet verified against live accounts

- **Beehiiv:** request fields come from Beehiiv's help center, not a live call. Beehiiv lists the
  Create Post endpoint for its Max and Enterprise plans. Run once in `draft` mode and check the post
  in the dashboard before switching `NSNN_BEEHIIV_MODE` to `schedule`.
- **Federal Register and EIA query shapes:** run the workflow manually in `sources` mode; its
  summary shows what each source returned.
