// Call-to-action catalog and the injection step.
//
// The model never writes promotions or links. After the brief is written and fact-checked,
// injectCtas() walks its sections and places each CTA right after the section that covers
// the story that triggered it (the "anchor"), or after the lede for priority CTAs.
//
// Every CTA is labeled as coming from an affiliated company. The copy only claims what each
// product actually does today.

export const DISCLOSURE = 'Loadmark, Quickwell and Riddlebound are made by companies affiliated with NorthStar Delivery Solutions. Links marked "From our network" promote those products.';

export const CATALOG = {
  loadmark: {
    product: 'Loadmark',
    url: 'https://loadmark.io/',
    label: 'Secure your loads today',
    priority: 1,
    placement: 'top',
    copy: {
      fraud_trend: 'Fraud and theft keep hitting freight. Loadmark gives every load one shared status, confirmed by independent witnesses, so a fake pickup or a ghost carrier stands out. Free for carriers, drivers and receivers.',
      fuel_spike: 'With diesel climbing, a load that goes sideways costs more than ever. Loadmark gives every load one shared, witness-confirmed status that shipper, carrier and receiver all see. Free for carriers, drivers and receivers.',
    },
  },
  'audit-kit': {
    product: 'Quickwell Audit Kit',
    url: 'https://quickwell.app/audit-kit/',
    ref: true,
    label: 'Check yourself against the new entrant audit',
    priority: 2,
    placement: 'anchor',
    copy: {
      fmcsa_change: 'FMCSA rules moved this week. New authority? Run the free self-check against the 16 violations that automatically fail a new entrant safety audit.',
    },
  },
  'vendor-check': {
    product: 'Quickwell Vendor Check',
    url: 'https://quickwell.app/vendor-check/',
    ref: true,
    label: 'See who needs a 1099',
    priority: 3,
    placement: 'anchor',
    copy: {
      tax_change: '1099 reporting is in the news. Year-End Vendor Check reads your bank or QuickBooks export and flags who likely needs a 1099 under the $2,000 rule. Nothing is uploaded.',
    },
  },
  riddlebound: {
    product: 'Riddlebound',
    url: 'https://riddlebound.app/',
    label: 'Unwind over the weekend with interactive thrillers',
    priority: 9,
    placement: 'end',
    copy: {
      friday: 'Off the clock this weekend? Riddlebound novels hide codes and clues inside the story. Crack them to unlock what happens next. The first books are coming soon; start now with the free SIGNAL 309 audio drama.',
    },
  },
};

const TRIGGERS = { fuel_spike: 'loadmark', fraud_trend: 'loadmark', fmcsa_change: 'audit-kit', tax_change: 'vendor-check', friday: 'riddlebound' };

// Adds tracking parameters. Quickwell also reads ?ref= to attribute the channel.
export function trackedUrl(cta, { medium, date, signal }) {
  const u = new URL(cta.url);
  u.searchParams.set('utm_source', 'nsnn');
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', `freight-brief-${date}`);
  u.searchParams.set('utm_content', signal);
  if (cta.ref) u.searchParams.set('ref', `nsnn-${medium}`);
  return u.toString();
}

// One CTA per product. When two signals point at the same product (fuel and fraud both point
// to Loadmark), the first signal in priority order supplies the copy and the anchor.
export function selectCtas(signals) {
  const byProduct = new Map();
  const order = ['fraud_trend', 'fuel_spike', 'fmcsa_change', 'tax_change', 'friday'];
  for (const key of order) {
    const sig = signals.find((s) => s.key === key);
    if (!sig) continue;
    const id = TRIGGERS[key];
    if (byProduct.has(id)) { byProduct.get(id).evidence.push(...sig.evidence); continue; }
    const c = CATALOG[id];
    byProduct.set(id, { id, product: c.product, url: c.url, ref: !!c.ref, label: c.label, copy: c.copy[key], signal: key, priority: c.priority, placement: c.placement, evidence: [...sig.evidence] });
  }
  return [...byProduct.values()].sort((a, b) => a.priority - b.priority);
}

// The structural injection loop. Returns the brief as an ordered list of blocks that every
// renderer (email, web page, Markdown) walks the same way.
export function injectCtas(brief, ctas) {
  const blocks = [{ type: 'lede', text: brief.lede }];
  const pending = [...ctas];
  const take = (pred) => {
    const out = [];
    for (let i = pending.length - 1; i >= 0; i--) if (pred(pending[i])) out.unshift(...pending.splice(i, 1));
    return out;
  };
  for (const cta of take((c) => c.placement === 'top')) blocks.push({ type: 'cta', cta });
  for (const section of brief.sections) {
    blocks.push({ type: 'section', section });
    const ids = new Set(section.source_ids);
    for (const cta of take((c) => c.placement === 'anchor' && c.evidence.some((e) => ids.has(e)))) blocks.push({ type: 'cta', cta });
  }
  // Anchored CTAs whose story didn't make the brief, then end-of-brief CTAs (Friday plug last).
  for (const cta of take(() => true).sort((a, b) => a.priority - b.priority)) blocks.push({ type: 'cta', cta });
  return blocks;
}
