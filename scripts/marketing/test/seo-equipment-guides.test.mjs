import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../../seo/sync-services.mjs';

const rows = [
  ['reefer-freight-brokerage-services','Refrigerated Freight','Reefer Freight Brokerage Services','A refrigerated trailer is a temperature-management system'],
  ['team-reefer-freight-capacity','Refrigerated Freight','Team Reefer Freight Capacity','Team service changes the driving schedule'],
  ['dry-van-freight-brokerage','Dry Van Freight','Dry Van Freight Brokerage','Dry vans protect freight from ordinary road weather'],
  ['team-dry-van-freight','Dry Van Freight','Team Dry Van Freight Services','Team dry-van capacity is intended for shipments'],
  ['power-only-freight-services','Power Only','Power Only Freight Services','Power-only transportation supplies the tractor'],
  ['tanker-freight-brokerage','Bulk Freight','Tanker Freight Brokerage','Liquid bulk transportation requires a tank'],
  ['hopper-bottom-freight','Bulk Freight','Hopper Bottom Freight Services','Hopper-bottom trailers discharge dry bulk'],
  ['bottom-dump-freight-hauling','Bulk Freight','Bottom Dump Freight Hauling','Bottom-dump trailers release material through bottom gates'],
  ['dump-truck-freight-services','Specialized Freight','Dump Truck Freight Services','Dump-truck work is often tied to a specific job site'],
  ['auto-transport-trailer-freight','Specialized Freight','Auto Transport Trailer Freight','Vehicle transport requires a loading plan for each vehicle'],
  ['rail-intermodal-drayage-freight','Intermodal Freight','Rail Intermodal Drayage Freight','Drayage connects a port or rail ramp'],
  ['flatbed-freight-brokerage','Flatbed Freight','Flatbed Freight Brokerage','Flatbed freight is exposed to weather'],
  ['flatbed-with-sides-freight','Flatbed Freight','Flatbed With Sides Freight','A flatbed with removable or fixed sides'],
  ['team-flatbed-freight','Flatbed Freight','Team Flatbed Freight Services','Team flatbed service combines open-deck securement'],
  ['step-deck-freight-brokerage','Heavy Haul Freight','Step Deck Freight Brokerage','A step-deck trailer has an upper deck'],
  ['rgn-heavy-equipment-freight','Heavy Haul Freight','RGN Heavy Equipment Freight','A removable gooseneck (RGN) trailer'],
  ['double-drop-trailer-freight','Heavy Haul Freight','Double Drop Trailer Freight','A double-drop trailer has a lowered center well'],
  ['conestoga-freight-services','Specialized Flatbed','Conestoga Freight Services','A Conestoga uses a rolling tarp system'],
  ['container-chassis-freight-services','Intermodal Freight','Container Chassis Freight Services','A container chassis is a specialized frame'],
  ['nationwide-freight-brokerage-equipment-types','Freight Brokerage','Nationwide Freight Brokerage by Equipment Type','Equipment selection should begin with the freight']
].map(([slug,service_category,target_keyword,uniqueLead])=>({slug,service_category,target_keyword,uniqueLead}));

test('every published freight service slug has a distinct equipment-specific guide', () => {
  assert.equal(rows.length, 20);
  const html = rows.map(row => renderPage(row, rows));
  assert.equal(new Set(html).size, rows.length, 'generated pages should not be duplicate templates');
  rows.forEach((row, index) => {
    assert.ok(html[index].includes(row.uniqueLead), row.slug + ' is missing its unique equipment guidance');
    assert.ok(html[index].includes('Shipment details to confirm'));
    assert.ok(html[index].includes('Equipment and dispatch planning'));
    assert.ok(html[index].includes('Frequently asked questions'));
    assert.ok(html[index].includes('rel="canonical"'));
    assert.ok(html[index].includes('rel="noopener sponsored"'));
  });
});

test('equipment guides include real shipment checks rather than generic keyword filler', () => {
  const reefer = renderPage(rows[0], rows);
  const stepDeck = renderPage(rows[14], rows);
  const drayage = renderPage(rows[10], rows);
  assert.match(reefer, /set point and operating mode in writing/i);
  assert.match(stepDeck, /loaded overall height/i);
  assert.match(drayage, /last free day/i);
  assert.doesNotMatch(reefer, /What exact equipment and service level does this shipment require/);
});
