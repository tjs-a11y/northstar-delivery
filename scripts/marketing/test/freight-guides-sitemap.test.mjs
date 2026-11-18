import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const base = "https://northstardeliveryservice.com/freight-guides/";
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const hub = fs.readFileSync(path.join(root, "freight-guides/index.html"), "utf8");
const urls = sitemap
  .split("<loc>").slice(1)
  .map((part) => part.split("</loc>")[0])
  .filter((url) => url.startsWith(base) && url !== base);

test("every freight-guide sitemap URL has a matching canonical page", () => {
  assert.ok(urls.length >= 8, "expected freight guide URLs in sitemap");
  for (const url of urls) {
    const tail = url.slice(base.length);
    const slug = tail.endsWith("/") ? tail.slice(0, -1) : tail;
    const file = path.join(root, "freight-guides", slug, "index.html");
    assert.ok(fs.existsSync(file), `missing page for ${url}`);
    const html = fs.readFileSync(file, "utf8");
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `canonical mismatch for ${url}`);
    assert.match(html, /<title>[^<]+<\/title>/, `missing title for ${url}`);
    assert.match(html, /<meta name="description" content="[^"]+"/, `missing description for ${url}`);
    assert.match(html, /<h1>[^<]+<\/h1>/, `missing H1 for ${url}`);
    assert.ok(html.includes('href="/tools/') || html.includes('href="/ship/'), `missing relevant internal CTA for ${url}`);
  }
});

test("new carrier guides are discoverable from the freight guide hub", () => {
  const required = ["carrier-settlement-statement-review-checklist","freight-broker-short-pay-dispute-checklist","rate-confirmation-to-settlement-reconciliation","detention-pay-documentation-checklist","layover-pay-documentation-checklist","tonu-cancellation-fee-documentation","lumper-fee-reimbursement-checklist","freight-factoring-vs-quick-pay-comparison","verify-freight-broker-authority-and-bond","fmcsa-supporting-documents-retention-checklist","eld-records-retention-checklist-for-carriers","carrier-invoice-submission-checklist"];
  for (const slug of required) {
    assert.ok(hub.includes(`/freight-guides/${slug}/`), `hub missing ${slug}`);
    assert.ok(sitemap.includes(`https://northstardeliveryservice.com/freight-guides/${slug}/`), `sitemap missing ${slug}`);
  }
});
