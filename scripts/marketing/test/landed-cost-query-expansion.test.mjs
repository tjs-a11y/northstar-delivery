import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../../tools/freight-forwarder-customs-duty-estimator/index.html', import.meta.url), 'utf8');

test('total landed cost page answers the observed query and links authoritative tariff guidance', () => {
  assert.match(html, /<title>Total Landed Cost Calculator \\| NorthStar Freight Solutions \\/ NorthStar Delivery Solutions<\\/title>/);
  assert.match(html, /name="description" content="[^"]*total import landed cost/i);
  assert.match(html, /<h1>Calculate total landed cost, duty included<\\/h1>/);
  assert.match(html, /href="https:\\/\\/hts\\.usitc\\.gov\\/"/);
  assert.match(html, /href="https:\\/\\/www\\.help\\.cbp\\.gov\\/s\\/article\\/Article-1344"/);
  assert.match(html, /does not calculate specific or compound duties, quotas, trade remedies/);
  assert.match(html, /rel="canonical" href="https:\\/\\/northstardeliveryservice\\.com\\/tools\\/freight-forwarder-customs-duty-estimator\\/"/);
});
