// Beehiiv API v2: create a newsletter post.
//
//   POST https://api.beehiiv.com/v2/publications/{publication_id}/posts
//   Authorization: Bearer <BEEHIIV_API_KEY>
//
// Field names follow Beehiiv's help center (title, body_content as custom HTML, status,
// scheduled_at, content_tags). Since 2026-08-06 a post without a status is a draft; a
// scheduled send needs status "confirmed" plus scheduled_at. Beehiiv documents the Create
// Post endpoint as available on its Max and Enterprise plans.
//
// mode "draft":    the post waits in Beehiiv for a human to review and send.
// mode "schedule": the post goes out at scheduledAt with no further review.
const API = 'https://api.beehiiv.com/v2';

export class BeehiivError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export function postPayload({ title, subtitle, html, mode, scheduledAt, tags = ['nsnn', 'freight-brief'] }) {
  if (mode !== 'draft' && mode !== 'schedule') throw new Error(`unknown Beehiiv mode "${mode}"`);
  const body = { title, subtitle, body_content: html, content_tags: tags, status: mode === 'schedule' ? 'confirmed' : 'draft' };
  if (mode === 'schedule') {
    if (!(scheduledAt instanceof Date) || Number.isNaN(scheduledAt.getTime())) throw new Error('schedule mode needs a valid scheduledAt');
    body.scheduled_at = scheduledAt.toISOString();
  }
  return body;
}

export async function createPost({ apiKey, publicationId, fetchImpl = fetch, retries = 3, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), ...post }) {
  if (!apiKey || !publicationId) throw new BeehiivError('BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID are required', 0);
  if (!/^pub_[A-Za-z0-9-]+$/.test(publicationId)) throw new BeehiivError('BEEHIIV_PUBLICATION_ID should look like pub_...', 0);
  const payload = JSON.stringify(postPayload(post));
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetchImpl(`${API}/publications/${publicationId}/posts`, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(30000),
      });
    } catch (e) {
      // A network error after the request left could still have created the post. Don't retry
      // blindly into a duplicate send: surface it so a human checks the Beehiiv dashboard.
      throw new BeehiivError(`network error talking to Beehiiv (check the dashboard before re-running): ${e.message}`, 0);
    }
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      const data = body?.data ?? body;
      return { id: data?.id ?? null, status: data?.status ?? null, webUrl: data?.web_url ?? null };
    }
    last = new BeehiivError(`Beehiiv returned HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`, res.status);
    // Retry only answers that mean "not accepted": rate limited or temporarily unavailable.
    // Other 5xx errors may have created the post, so they surface instead of risking a duplicate.
    if (res.status !== 429 && res.status !== 503) throw last;
    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** attempt;
    if (attempt < retries) await sleep(wait);
  }
  throw last;
}
