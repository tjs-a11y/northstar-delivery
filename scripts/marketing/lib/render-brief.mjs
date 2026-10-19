// Renders one brief (a list of blocks from injectCtas) three ways: Beehiiv email HTML,
// the public web page, and the Markdown copy committed next to it.
import { escapeHtml as esc, formatDateLong, pageShell, navHeader, footer } from '../../nsnn/lib/render.mjs';
import { CTA_TAG, PARTNER_TAG, DISCLOSURE, PARTNER_DISCLOSURE, trackedUrl } from './ctas.mjs';
import { SITE_ORIGIN } from './config.mjs';

const tagFor = (cta) => (cta.partner ? PARTNER_TAG : CTA_TAG);
const hasPartner = (blocks) => blocks.some((b) => b.type === 'cta' && b.cta.partner);

export const briefPath = (date) => `news/briefs/${date}.html`;
export const briefUrl = (date) => `${SITE_ORIGIN}/${briefPath(date)}`;

// id -> { label, title, link } for citations.
export function sourceIndex(harvest) {
  const idx = new Map();
  if (harvest.fuel) idx.set(harvest.fuel.id, { label: 'EIA', title: `Weekly U.S. diesel price, week of ${harvest.fuel.latest.period}`, link: harvest.fuel.link });
  for (const h of harvest.headlines) idx.set(h.id, { label: h.source, title: h.title, link: h.link });
  for (const r of harvest.regulatory) idx.set(r.id, { label: `Federal Register (${r.agency})`, title: r.title, link: r.link });
  return idx;
}

const citesFor = (section, idx) => section.source_ids.map((id) => idx.get(id)).filter(Boolean);
const ctaHref = (cta, medium, date, footer = false) => trackedUrl(cta, { medium, date, signal: cta.signal, footer });

export function renderEmailHtml({ brief, blocks, harvest, date }) {
  const idx = sourceIndex(harvest);
  const p = (t, style = '') => `<p style="font-size:16px;line-height:1.6;margin:0 0 14px;${style}">${esc(t)}</p>`;
  const parts = [
    `<p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#3d8bfd;margin:0 0 6px;">${esc(formatDateLong(date))} · NSNN Freight Brief</p>`,
    `<h1 style="font-size:24px;line-height:1.25;margin:0 0 10px;">${esc(brief.headline)}</h1>`,
  ];
  for (const b of blocks) {
    if (b.type === 'lede') parts.push(p(b.text, 'font-weight:600;'));
    if (b.type === 'section') {
      parts.push(`<h2 style="font-size:18px;margin:24px 0 6px;">${esc(b.section.heading)}</h2>`,
        `<ul style="font-size:16px;line-height:1.6;margin:0 0 10px;padding-left:20px;">${b.section.bullets.map((t) => `<li style="margin:0 0 6px;">${esc(t)}</li>`).join('')}</ul>`);
      const cites = citesFor(b.section, idx);
      if (cites.length) parts.push(`<p style="font-size:12px;color:#64748b;margin:0 0 14px;">Source: ${cites.map((c) => `<a href="${esc(c.link)}" style="color:#64748b;">${esc(c.label)}</a>`).join(', ')}</p>`);
    }
    if (b.type === 'cta') {
      parts.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-left:4px solid #f2994a;background:#f8fafc;"><tr><td style="padding:14px 16px;">
<p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#b45309;margin:0 0 4px;">${tagFor(b.cta)} · ${esc(b.cta.product)}</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 8px;">${esc(b.cta.copy)}</p>
<a href="${esc(ctaHref(b.cta, 'email', date))}" style="font-size:14px;font-weight:700;color:#1d4ed8;">${esc(b.cta.label)} →</a></td></tr></table>`);
    }
    if (b.type === 'footer') {
      parts.push(`<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0 14px;">`,
        `<p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#b45309;margin:0 0 6px;">${CTA_TAG}s</p>`,
        `<ul style="font-size:14px;line-height:1.6;margin:0;padding-left:20px;">${b.ctas.map((c) => `<li><a href="${esc(ctaHref(c, 'email', date, true))}" style="color:#1d4ed8;font-weight:700;">${esc(c.label)} →</a> ${esc(c.product)}</li>`).join('')}</ul>`);
    }
  }
  parts.push(
    `<p style="font-size:13px;margin:24px 0 6px;"><a href="${esc(briefUrl(date))}?utm_source=nsnn&amp;utm_medium=email&amp;utm_campaign=freight-brief-${esc(date)}">Read this brief on the web</a></p>`,
    `<p style="font-size:12px;color:#475569;line-height:1.6;margin:16px 0 0;"><strong>${esc(DISCLOSURE)}</strong> NSNN summarizes public reporting in its own words and links every source.</p>`,
    ...(hasPartner(blocks) ? [`<p style="font-size:12px;color:#475569;line-height:1.6;margin:8px 0 0;">${esc(PARTNER_DISCLOSURE)}</p>`] : []),
    `<p style="font-size:11px;color:#94a3b8;margin:6px 0 0;">NSNN — NorthStar News Network, a production of NorthStar Delivery Solutions LLC.</p>`,
  );
  return parts.join('\n');
}

export function renderWebPage({ brief, blocks, harvest, date }) {
  const idx = sourceIndex(harvest);
  const body = [];
  for (const b of blocks) {
    if (b.type === 'lede') body.push(`<p><strong>${esc(b.text)}</strong></p>`);
    if (b.type === 'section') {
      const cites = citesFor(b.section, idx);
      body.push(`<h2>${esc(b.section.heading)}</h2>`, `<ul>${b.section.bullets.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`);
      if (cites.length) body.push(`<p class="cites">Source: ${cites.map((c) => `<a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.label)}: ${esc(c.title)}</a>`).join(' · ')}</p>`);
    }
    if (b.type === 'cta') {
      body.push(`<aside class="cta-card"><span class="cta-tag">${tagFor(b.cta)} · ${esc(b.cta.product)}</span><p>${esc(b.cta.copy)}</p><a href="${esc(ctaHref(b.cta, 'web', date))}" rel="noopener sponsored">${esc(b.cta.label)} →</a></aside>`);
    }
    if (b.type === 'footer') {
      body.push(`<aside class="cta-card"><span class="cta-tag">${CTA_TAG}s</span><ul>${b.ctas.map((c) => `<li><a href="${esc(ctaHref(c, 'web', date, true))}" rel="noopener">${esc(c.label)} →</a> ${esc(c.product)}</li>`).join('')}</ul></aside>`);
    }
  }
  const url = briefUrl(date);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: brief.headline,
    description: brief.seo_description,
    datePublished: harvest.generatedAt,
    dateModified: harvest.generatedAt,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'NSNN — NorthStar News Network' },
    publisher: { '@type': 'Organization', name: 'NorthStar Delivery Solutions LLC' },
  };
  const head = [
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${esc(brief.headline)}">`,
    `<meta property="og:description" content="${esc(brief.seo_description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n');
  const html = `
${navHeader('', '../')}
<section class="wrap">
  <div class="page-head">
    <span class="eyebrow">${esc(formatDateLong(date))} · NorthStar Freight Brief</span>
    <h1>${esc(brief.headline)}</h1>
    <p class="lede">${esc(brief.dek)}</p>
  </div>
  <article class="full-brief">
    ${body.join('\n    ')}
    <p class="disclosure"><strong>${esc(DISCLOSURE)}</strong> NSNN summarizes public reporting in its own words and links every source.</p>
    ${hasPartner(blocks) ? `<p class="disclosure">${esc(PARTNER_DISCLOSURE)}</p>` : ''}
  </article>
</section>
${footer('../')}`;
  return pageShell({ title: `${brief.headline} | NSNN Freight Brief ${date}`, description: brief.seo_description, active: '', body: html, head });
}

export function renderMarkdown({ brief, blocks, harvest, date }) {
  const idx = sourceIndex(harvest);
  const md = (s) => String(s).replace(/([\\`*_[\]<>])/g, '\\$1');
  const out = [`# ${md(brief.headline)}`, '', `*${md(formatDateLong(date))} · NorthStar Freight Brief*`, '', md(brief.dek), ''];
  for (const b of blocks) {
    if (b.type === 'lede') out.push(`**${md(b.text)}**`, '');
    if (b.type === 'section') {
      out.push(`## ${md(b.section.heading)}`, '', ...b.section.bullets.map((t) => `- ${md(t)}`), '');
      const cites = citesFor(b.section, idx);
      if (cites.length) out.push(`Source: ${cites.map((c) => `[${md(c.label)}: ${md(c.title)}](${c.link})`).join(' · ')}`, '');
    }
    if (b.type === 'footer') out.push(`**${CTA_TAG}s:**`, '', ...b.ctas.map((c) => `- [${md(c.label)} →](${ctaHref(c, 'web', date, true)}) ${md(c.product)}`), '');
    if (b.type === 'cta') out.push(`> **${tagFor(b.cta)} · ${md(b.cta.product)}:** ${md(b.cta.copy)} [${md(b.cta.label)} →](${ctaHref(b.cta, 'web', date)})`, '');
  }
  out.push('---', '', `**${md(DISCLOSURE)}**`, ...(hasPartner(blocks) ? ['', md(PARTNER_DISCLOSURE)] : []), '', `Web version: ${briefUrl(date)}`, '');
  return out.join('\n');
}
