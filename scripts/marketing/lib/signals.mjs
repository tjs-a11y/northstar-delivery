// Turns the day's harvest into marketing signals. Pure and deterministic: the same data
// always yields the same signals, so a CTA appears only when the data supports it, never
// because the model decided to sell something.
//
// Each signal names its evidence (harvest ids), which is how a CTA gets placed next to the
// section of the brief that covers the same story.
import { weekdayOf } from './config.mjs';

export const FRAUD_RE = /\b(fraud|double[- ]?brokering|double[- ]?broker|cargo theft|stolen (?:load|cargo|freight|truck)|identity theft|impersonat\w*|fictitious pick-?up|scam\w*|hijack\w*|strategic theft)\b/i;
export const FMCSA_HEADLINE_RE = /\b(FMCSA|hours[- ]of[- ]service|ELD mandate|drug (?:and alcohol )?clearinghouse|English[- ]language proficiency|operating authority|broker transparency|MC number|USDOT number)\b/i;
export const TAX_RE = /\b(1099(?:-NEC|-MISC|-K)?|information returns?|backup withholding|reporting threshold)\b/i;

const hoursBetween = (a, b) => (new Date(a) - new Date(b)) / 36e5;

export function detectSignals(harvest, { thresholds, now = new Date(harvest.generatedAt || Date.now()) }) {
  const signals = [];
  const fuel = harvest.fuel;

  if (fuel && fuel.weeklyChangeCents !== null) {
    const weekly = fuel.weeklyChangeCents >= thresholds.fuelWeeklyCents;
    const four = fuel.fourWeekChangeCents !== null && fuel.fourWeekChangeCents >= thresholds.fuelFourWeekCents;
    if (weekly || four) {
      signals.push({
        key: 'fuel_spike',
        reason: weekly
          ? `EIA diesel average ${fuel.formatted.weeklyChange} week over week (threshold ${thresholds.fuelWeeklyCents} cents)`
          : `EIA diesel average ${fuel.formatted.fourWeekChange} over four weeks (threshold ${thresholds.fuelFourWeekCents} cents)`,
        evidence: [fuel.id],
      });
    }
  }

  const recent = (h) => h.published && hoursBetween(now, h.published) <= thresholds.fraudLookbackHours && hoursBetween(now, h.published) >= -24;
  const fraud = harvest.headlines.filter((h) => recent(h) && FRAUD_RE.test(`${h.title} ${h.snippet}`));
  if (fraud.length >= thresholds.fraudHeadlines) {
    signals.push({ key: 'fraud_trend', reason: `${fraud.length} fraud or theft headlines in the last ${thresholds.fraudLookbackHours} hours`, evidence: fraud.map((h) => h.id) });
  }

  const fmcsaDocs = harvest.regulatory.filter((d) => d.agency === 'FMCSA' && /rule/i.test(d.type));
  const fmcsaNews = harvest.headlines.filter((h) => recent(h) && FMCSA_HEADLINE_RE.test(h.title) && /\b(rule|final|proposed|regulation|deadline|enforce\w*|change\w*)\b/i.test(`${h.title} ${h.snippet}`));
  if (fmcsaDocs.length || fmcsaNews.length) {
    signals.push({
      key: 'fmcsa_change',
      reason: fmcsaDocs.length ? `${fmcsaDocs.length} new FMCSA rule document(s) in the Federal Register` : `${fmcsaNews.length} headline(s) on FMCSA rule changes`,
      evidence: [...fmcsaDocs, ...fmcsaNews].map((x) => x.id),
    });
  }

  const taxDocs = harvest.regulatory.filter((d) => d.agency === 'IRS' && TAX_RE.test(`${d.title} ${d.abstract}`));
  const taxNews = harvest.headlines.filter((h) => recent(h) && TAX_RE.test(`${h.title} ${h.snippet}`));
  if (taxDocs.length || taxNews.length) {
    signals.push({
      key: 'tax_change',
      reason: taxDocs.length ? `${taxDocs.length} IRS information-reporting document(s) in the Federal Register` : `${taxNews.length} headline(s) on 1099 reporting`,
      evidence: [...taxDocs, ...taxNews].map((x) => x.id),
    });
  }

  const day = weekdayOf(harvest.date);
  if (day === 'Friday' || day === 'Saturday') {
    signals.push({ key: 'weekend', reason: `${day} edition`, evidence: [] });
  }
  return signals;
}
