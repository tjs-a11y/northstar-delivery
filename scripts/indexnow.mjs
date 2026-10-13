// Tell IndexNow search engines (Bing, Yandex, Seznam, Naver and others) about every page in sitemap.xml.
// Only public pages are in the sitemap, so internal tools are never submitted.
//   node scripts/indexnow.mjs            (INDEXNOW_DRY_RUN=1 prints the request instead)
// No account needed: the key is the <32 hex>.txt file at the site root.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const keyFile = readdirSync(root).find((n) => /^[0-9a-f]{32}\.txt$/.test(n));
if (!keyFile) throw new Error('No IndexNow key file at the site root.');
const key = readFileSync(join(root, keyFile), 'utf8').trim();
const urlList = [...readFileSync(join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const site = new URL(urlList[0]);
const body = { host: site.host, key, keyLocation: `${site.origin}/${keyFile}`, urlList };
if (process.env.INDEXNOW_DRY_RUN) console.log(JSON.stringify(body, null, 1));
else {
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  console.log(`IndexNow: ${r.status} ${r.statusText} for ${urlList.length} URLs`);
  if (!r.ok) { console.error(await r.text().catch(() => '')); process.exitCode = 1; }
}
