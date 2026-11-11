import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../../tools/freight-forwarder-customs-duty-estimator/index.html', import.meta.url), 'utf8');

test('total landed cost page answers the observed query and links authoritative tariff guidance', () => {
  assert.ok(html.includes('<title>Total Landed Cost Calculator | NorthStar Freight Solutions / NorthStar Delivery Solutions</title>'));
  assert.match(html, /name="description" content="[^"]*total import landed cost/i);
  assert.ok(html.includes('<h1>Calculate total landed cost, duty included</h1>'));
  assert.ok(html.includes('href="https://hts.usitc.gov/"'));
  assert.ok(html.includes('href="https://www.help.cbp.gov/s/article/Article-1344"'));
  assert.ok(html.includes('does not calculate specific or compound duties, quotas, trade remedies'));
  assert.ok(html.includes('rel="canonical" href="https://northstardeliveryservice.com/tools/freight-forwarder-customs-duty-estimator/"'));
});
