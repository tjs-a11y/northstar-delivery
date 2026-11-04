import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPage, renderHub, mergeSitemap } from '../../seo/sync-services.mjs';

const row = {
  slug: 'reefer-freight-brokerage-services',
  target_keyword: 'Reefer Freight Brokerage Services',
  service_category: 'Refrigerated Freight',
  meta_title: 'Reefer Freight Brokerage Services | NorthStar',
  meta_description: 'Review refrigerated freight requirements and request lane-specific capacity.'
};

test('service page has unique canonical, shipment checklist and quote action', () => {
  const html = renderPage(row, [row]);
  assert.match(html, /<link rel="canonical" href="https:\/\/northstardeliveryservice\.com\/freight-services\/reefer-freight-brokerage-services\/">/);
  assert.match(html, /temperature-recording requirements/);
  assert.match(html, /Request a freight quote/);
  assert.match(html, /application\/ld\+json/);
});

test('service page rejects unsafe slugs', () => {
  assert.throws(() => renderPage({ ...row, slug: '../outside' }, []), /Invalid slug/);
});

test('hub links service pages and groups by service category', () => {
  const html = renderHub([row, { ...row, slug: 'team-reefer-freight-capacity', target_keyword: 'Team Reefer Freight Capacity' }]);
  assert.match(html, /Refrigerated Freight/);
  assert.match(html, /team-reefer-freight-capacity/);
});

test('sitemap adds hub and service URLs once', () => {
  const xml = '<?xml version="1.0"?><urlset></urlset>';
  const once = mergeSitemap(xml, [row], '2026-11-04');
  const twice = mergeSitemap(once, [row], '2026-11-04');
  assert.equal((twice.match(/<loc>/g) || []).length, 2);
  assert.match(twice, /freight-services\/reefer-freight-brokerage-services/);
});
