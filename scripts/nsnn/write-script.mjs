import Anthropic from '@anthropic-ai/sdk';
import { config, requireKey } from './lib/config.mjs';

const SYSTEM_PROMPT = `You are the writer for NSNN (NorthStar News Network), a daily freight industry brief produced by NorthStar Delivery Solutions LLC. Write a 60-90 second anchor script (about 150-200 words) covering the headlines you're given, in your own original words — never quote or closely paraphrase the source text, this is a hard rule, not a style preference. Tone: direct, professional, built for owner-operators and dispatchers. Sign off every script as "NSNN — NorthStar News Network."

After the script, on a new line starting with "SUBJECT:", write a short newsletter subject line (under 60 characters, no quotation marks).`;

function buildUserPrompt(headlines, dieselPrice) {
  const headlineLines = headlines
    .map((h, i) => `${i + 1}. [${h.source}] ${h.title}`)
    .join('\n');

  const dieselLine = dieselPrice
    ? `\nLatest EIA weekly diesel price: $${dieselPrice.dollarsPerGallon.toFixed(3)}/gal (week of ${dieselPrice.period}).`
    : '';

  return `Today's freight headlines:\n${headlineLines}${dieselLine}\n\nWrite today's NSNN script now.`;
}

function parseResponse(text) {
  const subjectMatch = text.match(/^SUBJECT:\s*(.+)$/m);
  const subject = subjectMatch ? subjectMatch[1].trim() : 'NSNN Daily Freight Brief';
  const script = text.replace(/^SUBJECT:\s*(.+)$/m, '').trim();
  return { script, subject };
}

export async function writeScript({ headlines, dieselPrice }) {
  if (!headlines || headlines.length === 0) {
    throw new Error('writeScript: no headlines provided — refusing to call the model with an empty brief.');
  }

  const apiKey = requireKey('ANTHROPIC_API_KEY', config.anthropicApiKey);
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(headlines, dieselPrice) },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return parseResponse(text);
}

// Allow running standalone for manual testing:
//   node scripts/nsnn/write-script.mjs < headlines.json
// where headlines.json is the JSON output of fetch-headlines.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const { fetchHeadlines } = await import('./fetch-headlines.mjs');
  const data = await fetchHeadlines();
  const result = await writeScript(data);
  console.log(JSON.stringify(result, null, 2));
}
