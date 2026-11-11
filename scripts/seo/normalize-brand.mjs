import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BRAND = 'NorthStar Freight Solutions / NorthStar Delivery Solutions';
const PRESERVED = [
  'NorthStar Delivery Solutions may earn a commission',
  'NorthStar Delivery Solutions may earn a commission when you book',
];
const BRAND_TOKEN = '__NORTHSTAR_PUBLIC_BRAND_TOKEN__';

function brandText(html) {
  let out = html.replaceAll(BRAND, BRAND_TOKEN);
  const saved = [];
  for (let i = 0; i < PRESERVED.length; i += 1) {
    const token = '__NORTHSTAR_DISCLOSURE_' + i + '__';
    out = out.replaceAll(PRESERVED[i], token);
    saved.push([token, PRESERVED[i]]);
  }
  out = out.replace(/NorthStar Freight Solutions/g, BRAND);
  out = out.replace(/NorthStar Delivery Solutions(?! LLC)/g, BRAND);
  out = out.replace(/Northstar Delivery(?! Solutions LLC)/g, BRAND);
  out = out.replace(/NorthStar Freight(?! Solutions)/g, BRAND);
  out = out.replaceAll(BRAND_TOKEN, BRAND);
  for (const [token, phrase] of saved) out = out.replaceAll(token, phrase);
  return out;
}

function updateTag(html, selector, attr, transform) {
  const re = new RegExp('<meta\\\\b(?=[^>]*' + selector + ')[^>]*>', 'i');
  return html.replace(re, (tag) => {
    const valueRe = new RegExp(attr + '=["\\']([^"\\']*)["\\']', 'i');
    const match = tag.match(valueRe);
    if (!match) return tag;
    const next = transform(match[1]);
    return tag.replace(valueRe, attr + '="' + next.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"');
  });
}

function withBrandMetadata(html, relativePath) {
  const titleMatch = html.match(/<title[^>]*>([\\s\\S]*?)<\\/title>/i);
  const fallback = path.basename(relativePath, '.html').replace(/[-_]/g, ' ');
  const originalTitle = titleMatch ? titleMatch[1].trim() : fallback;
  const cleanTitle = originalTitle
    .replace(/\\s*\\|\\s*North[Ss]tar(?:\\s+(?:Freight|Delivery)(?:\\s+Solutions)?)?$/i, '')
    .trim();
  const title = cleanTitle + ' | ' + BRAND;
  if (titleMatch) html = html.replace(titleMatch[0], '<title>' + title + '</title>');
  else html = html.replace(/<\\/head>/i, '<title>' + title + '</title>\\n</head>');

  html = updateTag(html, 'name=["\\']description["\\']', 'content', (value) =>
    value.includes(BRAND) ? value : value.replace(/\\s*$/, '') + ' ' + BRAND + '.'
  );
  html = updateTag(html, 'property=["\\']og:title["\\']', 'content', () => title);
  if (!/<meta\\b[^>]*property=["\\']og:title["\\']/i.test(html)) {
    html = html.replace(/<\\/head>/i, '<meta property="og:title" content="' + title + '">\\n</head>');
  }
  if (!/<meta\\b[^>]*property=["\\']og:site_name["\\']/i.test(html)) {
    html = html.replace(/<\\/head>/i, '<meta property="og:site_name" content="' + BRAND + '">\\n</head>');
  }
  return brandText(html);
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\\/loc>/g)].map((match) => match[1]);
const paths = [...new Set(urls.map((url) => {
  const pathname = new URL(url).pathname;
  const relative = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  return relative.replace(/^\\//, '');
}))].filter((file) => file.endsWith('.html'));

let changed = 0;
const changedFiles = [];
for (const relative of paths) {
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep)) throw new Error('Unsafe sitemap path: ' + relative);
  const before = await readFile(absolute, 'utf8');
  const after = withBrandMetadata(before, relative);
  if (after !== before) {
    await writeFile(absolute, after, 'utf8');
    changed += 1;
    changedFiles.push(relative);
  }
}
console.log('[brand-normalize] sitemap pages checked: ' + paths.length);
console.log('[brand-normalize] pages updated: ' + changed);
for (const file of changedFiles) console.log('[brand-normalize] updated ' + file);
