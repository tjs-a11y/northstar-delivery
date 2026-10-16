// Fact check for a generated brief. Fails closed: if any check fails, nothing is published.
//
// Checks: required fields and lengths; every section cites ids that exist; every number in
// the text appears in the source data (so no invented statistics); no links, emails or product
// mentions from the model (promotions are only ever added by ctas.mjs).

const NUMBER_RE = /\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\$?\d+(?:\.\d+)?/g;
const BANNED_RE = /(https?:\/\/|www\.|\b[\w.+-]+@[\w-]+\.[\w.]+\b|\bloadmark\b|\bquickwell\b|\briddlebound\b|\bnorthstar delivery solutions\b)/i;

// "3.70" and "3.7" and "$3.700" all become "3.7"; "1,250" becomes "1250".
export const canon = (raw) => {
  const n = Number(String(raw).replace(/[$,]/g, ''));
  return Number.isFinite(n) ? String(n) : null;
};
export const numbersIn = (text) => [...String(text ?? '').matchAll(NUMBER_RE)].map((m) => canon(m[0].replace(/\.$/, ''))).filter((x) => x !== null);

function dateParts(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d ?? ''));
  return m ? [m[1], String(Number(m[2])), String(Number(m[3]))] : [];
}

// Every number a brief may legitimately use today.
export function allowedNumbers(harvest) {
  const ok = new Set();
  const add = (text) => numbersIn(text).forEach((n) => ok.add(n));
  const addDate = (d) => dateParts(d).forEach((n) => ok.add(n));
  addDate(harvest.date);
  const f = harvest.fuel;
  if (f) {
    Object.values(f.formatted).forEach(add);
    addDate(f.latest.period);
    if (f.previous) addDate(f.previous.period);
  }
  for (const h of harvest.headlines) { add(h.title); add(h.snippet); addDate(h.published); }
  for (const r of harvest.regulatory) { add(r.title); add(r.abstract); add(r.documentNumber); addDate(r.published); }
  return ok;
}

export function checkBrief(brief, harvest) {
  const problems = [];
  const str = (k, max) => {
    if (typeof brief?.[k] !== 'string' || !brief[k].trim()) problems.push(`"${k}" is missing`);
    else if (brief[k].length > max) problems.push(`"${k}" is ${brief[k].length} characters (limit ${max})`);
  };
  str('subject', 80); str('headline', 110); str('dek', 200); str('lede', 700); str('seo_description', 170);
  const sections = Array.isArray(brief?.sections) ? brief.sections : [];
  if (sections.length < 1 || sections.length > 6) problems.push(`brief has ${sections.length} sections (expected 2 to 5)`);

  const ids = new Set([...(harvest.fuel ? [harvest.fuel.id] : []), ...harvest.headlines.map((h) => h.id), ...harvest.regulatory.map((r) => r.id)]);
  sections.forEach((s, i) => {
    if (!s?.heading) problems.push(`section ${i + 1} is missing a heading`);
    if (!Array.isArray(s?.bullets) || s.bullets.length < 1 || s.bullets.length > 5) problems.push(`section ${i + 1} has ${s?.bullets?.length ?? 0} bullets (expected 2 to 4)`);
    for (const [j, t] of (s?.bullets ?? []).entries()) if (String(t).length > 220) problems.push(`section ${i + 1} bullet ${j + 1} is too long (${String(t).length} characters)`);
    if (!Array.isArray(s?.source_ids) || s.source_ids.length === 0) problems.push(`section ${i + 1} cites no sources`);
    for (const id of s?.source_ids ?? []) if (!ids.has(id)) problems.push(`section ${i + 1} cites unknown source "${id}"`);
  });

  const texts = [brief?.subject, brief?.headline, brief?.dek, brief?.lede, brief?.seo_description, ...sections.flatMap((s) => [s?.heading, ...(s?.bullets ?? [])])];
  const allowed = allowedNumbers(harvest);
  const unknown = new Set();
  for (const t of texts) {
    for (const n of numbersIn(t)) if (!allowed.has(n)) unknown.add(n);
    const banned = BANNED_RE.exec(String(t ?? ''));
    if (banned) problems.push(`model text contains "${banned[0]}" (links and product mentions are added by code only)`);
  }
  for (const n of unknown) problems.push(`number ${n} does not appear in the source data`);
  return { ok: problems.length === 0, problems };
}
