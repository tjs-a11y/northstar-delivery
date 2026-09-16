import { config, requireKey } from './lib/config.mjs';
import { escapeHtml, formatDateLong, PARTNERS } from './lib/render.mjs';

function buildPartnersHtml() {
  const rows = PARTNERS.map(
    (p) =>
      `<li style="margin-bottom:6px;"><a href="${escapeHtml(p.href)}" style="color:#3d8bfd;">${escapeHtml(p.name)}</a> — ${escapeHtml(p.blurb)}</li>`
  ).join('');

  return `
  <hr>
  <p style="font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Recommended Partners</p>
  <ul style="font-size:13px;color:#64748b;padding-left:18px;margin:0 0 10px;">${rows}</ul>
  <p style="font-size:11px;color:#94a3b8;">NorthStar Delivery Solutions may earn a commission if you sign up through these links, at no extra cost to you. (Placeholder links — swap in the real affiliate URLs before this goes live.)</p>
  <p style="font-size:12px;color:#94a3b8;">NSNN — NorthStar News Network, a production of NorthStar Delivery Solutions LLC.</p>
`;
}

function buildEmailHtml(entry) {
  const sourcesList = (entry.sources || [])
    .map((s) => `<li>${escapeHtml(s.source)} — <a href="${escapeHtml(s.link)}">${escapeHtml(s.title)}</a></li>`)
    .join('');

  return `
    <h1>${escapeHtml(entry.subject)}</h1>
    <p style="font-size:12px;text-transform:uppercase;color:#3d8bfd;">${escapeHtml(formatDateLong(entry.date))}</p>
    <p style="font-size:16px;line-height:1.6;white-space:pre-line;">${escapeHtml(entry.script)}</p>
    ${sourcesList ? `<p style="font-size:12px;color:#94a3b8;">Sources referenced:</p><ul style="font-size:13px;">${sourcesList}</ul>` : ''}
    ${buildPartnersHtml()}
  `;
}

// Beehiiv API v2 — create-and-publish a post to a publication.
// Endpoint/payload shape follows the documented pattern at https://developers.beehiiv.com
// (POST /v2/publications/{publication_id}/posts) but was NOT exercised against a live
// account in this build (no internet egress in the build sandbox, and no Beehiiv key was
// provided). Confirm the field names below (particularly `content.free.html` and the
// `status`/`publish_date` fields governing "send now" vs. draft) against current docs,
// and do a manual test send before trusting the scheduled workflow with this.
export async function sendNewsletter(entry) {
  const apiKey = requireKey('BEEHIIV_API_KEY', config.beehiivApiKey);
  const publicationId = requireKey('BEEHIIV_PUBLICATION_ID', config.beehiivPublicationId);

  const res = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: entry.subject,
      status: 'confirmed',
      content_tags: ['nsnn', 'daily-brief'],
      content: {
        free: {
          html: buildEmailHtml(entry),
        },
      },
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Beehiiv API returned HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}
