export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.NSNN_MODEL || 'claude-sonnet-5',
  eiaApiKey: process.env.EIA_API_KEY || '',
  beehiivApiKey: process.env.BEEHIIV_API_KEY || '',
  beehiivPublicationId: process.env.BEEHIIV_PUBLICATION_ID || '',
  maxHeadlinesPerFeed: Number(process.env.NSNN_MAX_HEADLINES_PER_FEED || 8),
  recentEntriesOnIndex: Number(process.env.NSNN_RECENT_ENTRIES || 10),
};

export function requireKey(name, value) {
  if (!value) {
    throw new Error(`Missing required config: ${name}. Set it as an env var / GitHub Actions secret.`);
  }
  return value;
}
