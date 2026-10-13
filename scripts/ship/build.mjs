// Builds the shipper guides in /ship/ (static HTML, same look as the rest of the site).
//   node scripts/ship/build.mjs
// Every "Get a quote" button goes to our booking partner with our referral code.
// Facts that need a source cite one the team opened; everything else is general how-to guidance.
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGIN = 'https://northstardeliveryservice.com';
const QUOTE = 'https://freightsidekick.com/freight-quote?ref=northstardeliverysolutions';
const TODAY = new Date().toISOString().slice(0, 10);

const DISCLOSE = 'Quotes are provided by our partner, Freight Sidekick. We may earn a commission when you book.';

const SRC = {
  bond: ['49 CFR § 387.307, Property broker surety bond or trust fund (eCFR)', 'https://www.ecfr.gov/current/title-49/section-387.307'],
  broker: ['49 CFR § 371.2, Definitions: broker (eCFR)', 'https://www.ecfr.gov/current/title-49/section-371.2'],
  safer: ['FMCSA SAFER company snapshot', 'https://safer.fmcsa.dot.gov'],
};

const cta = (title, text) => `
<div class="cta-box">
  <h3>${title}</h3>
  <p>${text}</p>
  <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber">Get A Freight Quote</a>
  <p class="disclose">${DISCLOSE}</p>
</div>`;

const GUIDES = [
  {
    slug: 'how-to-get-a-freight-quote',
    nav: 'How to get a freight quote',
    blurb: 'The 9 details that get you an accurate truckload quote the first time.',
    title: 'How to Get a Truckload Freight Quote | NorthStar',
    desc: 'The 9 details a broker needs for an accurate full-truckload quote: lanes, dates, equipment, weight, commodity and accessorials. Free checklist.',
    h1: 'How to get an accurate freight quote the first time.',
    lede: 'Most quote surprises come from missing details: a liftgate nobody mentioned, a dock appointment, a load that is heavier than expected. Have these ready and your quote will hold.',
    body: `
<h2>The 9 details to have ready</h2>
<ol>
<li><strong>Pickup and delivery locations</strong>: city and ZIP at minimum, full address if you have it. Note whether each stop is a business with a dock, a construction site, or a residence.</li>
<li><strong>Dates</strong>: the earliest pickup date, and the latest acceptable delivery date. Flexible dates often price better than a fixed one.</li>
<li><strong>Equipment</strong>: dry van, reefer (temperature-controlled), flatbed, step deck, or something specialized. Not sure? Describe the freight and how it is loaded. See our <a href="index.html">equipment guides</a>.</li>
<li><strong>What you are shipping</strong>: the commodity in plain words (for example, "palletized canned food" or "steel I-beams").</li>
<li><strong>Weight</strong>: total weight, and the heaviest single piece.</li>
<li><strong>Size and count</strong>: number of pallets or pieces and their dimensions. For oversized freight, the exact length, width and height.</li>
<li><strong>Temperature</strong>, for reefer loads: the set point, and whether it is continuous or cycle.</li>
<li><strong>Loading and unloading</strong>: dock, forklift, crane, or none. Who loads and unloads, and how long it usually takes.</li>
<li><strong>Extras</strong>, often called accessorials: liftgate, inside delivery, appointments, tarps, straps, team drivers, or hazardous materials.</li>
</ol>
<h2>Full truckload or partial?</h2>
<p>A <strong>full truckload</strong> (FTL) means the whole trailer is yours: one pickup, one delivery, and no stops for other freight. It usually makes sense for heavy loads, many pallets, or time-sensitive freight. Smaller shipments can travel as less-than-truckload (LTL) or partial loads that share the trailer.</p>
${'{{CTA}}'}
<h2>Read the quote before you book</h2>
<ul>
<li>Check that the <strong>equipment, dates and stops</strong> match what you asked for.</li>
<li>Look for what is <strong>included</strong> (fuel, tarps, appointments) and what would be <strong>charged extra</strong> (detention, layover, truck-ordered-not-used).</li>
<li>Confirm the broker's or carrier's <strong>operating authority</strong>. You can look up any company's USDOT or MC number on <a href="https://safer.fmcsa.dot.gov" target="_blank" rel="noopener">FMCSA SAFER</a>. Our guide <a href="check-a-freight-broker.html">How to check a freight broker</a> explains what to look for.</li>
</ul>`,
    faq: [
      ['How fast can I get a quote?', 'Online quote tools are usually the fastest route. Have the 9 details above ready so the quote you get matches the load you have.'],
      ['Why did my final price change?', 'The most common reasons are details that weren\'t in the original request: extra stops, wait time at the dock, a liftgate, or a heavier or larger load than quoted.'],
    ],
    sources: ['safer'],
  },
  {
    slug: 'reefer-freight-shipping',
    nav: 'Reefer (refrigerated) freight',
    blurb: 'Shipping food, produce, pharma or anything that must stay cold or frozen.',
    title: 'Reefer Freight Shipping: Get a Refrigerated Truck Quote | NorthStar',
    desc: 'How refrigerated (reefer) truckload shipping works: set points, continuous vs. cycle, pre-cooling, and what to include in your quote request.',
    h1: 'Reefer freight: keep it cold from dock to dock.',
    lede: 'A reefer is a refrigerated trailer that holds a set temperature, from chilled to frozen. It is the standard choice for produce, meat, dairy, frozen food, flowers and many pharmaceutical and chemical products.',
    body: `
<h2>What to tell the broker</h2>
<ul>
<li><strong>Set point</strong>: the exact temperature the product must stay at, in °F.</li>
<li><strong>Continuous or cycle</strong>: continuous runs the unit all the time; cycle (start/stop) turns it on and off to hold the range. Many products, especially produce, need continuous.</li>
<li><strong>Pre-cool</strong>: whether the trailer must be cooled to the set point before loading. Ask for it if your product needs it.</li>
<li><strong>Product and packaging</strong>: pallets, cases, stacking limits, and whether the load is mixed temperature.</li>
<li><strong>Appointments</strong>: grocery and food distribution centers usually require scheduled delivery times.</li>
<li><strong>Records</strong>: if you need a temperature download or record for the trip, ask before booking.</li>
</ul>
${'{{CTA}}'}
<h2>Protect the load</h2>
<ul>
<li>Load product at the right temperature. A reefer is designed to <strong>hold</strong> a temperature, not to bring warm product down.</li>
<li>Write the set point on the bill of lading so the driver, shipper and receiver all see the same number.</li>
<li>Leave room for air to circulate around pallets. Blocked airflow causes hot spots.</li>
<li>Note any damage or temperature problem on the delivery receipt before you sign.</li>
</ul>
<p>Team reefer service is available for time-critical cold-chain runs. We list reefer, reefer team and other equipment on our <a href="../index.html#equipment">equipment page</a>.</p>`,
    faq: [
      ['Can frozen and chilled products ride together?', 'Only if the trailer has separate zones. Ask about multi-temperature equipment when you request the quote.'],
      ['What should I write on the bill of lading?', 'The set point in °F, continuous or cycle, and any pre-cool requirement.'],
    ],
    sources: [],
  },
  {
    slug: 'dry-van-freight-shipping',
    nav: 'Dry van freight',
    blurb: 'The everyday enclosed trailer for palletized and boxed freight.',
    title: 'Dry Van Freight Shipping: Get a 53\' Truckload Quote | NorthStar',
    desc: 'How dry van truckload shipping works: what fits in a 53-foot trailer, live vs. drop loads, and what to include for an accurate quote.',
    h1: 'Dry van freight: the workhorse of American shipping.',
    lede: 'A dry van is an enclosed, non-refrigerated trailer, most often 53 feet long. It carries palletized and boxed freight that needs protection from weather but not temperature control: retail goods, packaged food, paper, building supplies and more.',
    body: `
<h2>Make your quote accurate</h2>
<ul>
<li><strong>Pallet count and size</strong>: standard or oversized pallets, and whether they can be stacked.</li>
<li><strong>Weight</strong>: total load weight. Heavy loads may limit how much can be carried.</li>
<li><strong>Live or drop</strong>: a <strong>live</strong> load means the truck waits while you load or unload. A <strong>drop</strong> means the trailer is left for you to load on your own time. Drop service depends on equipment availability.</li>
<li><strong>Dock or no dock</strong>: without a loading dock you may need a liftgate or a forklift on site.</li>
<li><strong>Team service</strong>: two drivers for time-critical freight. It costs more, but the truck keeps moving.</li>
</ul>
${'{{CTA}}'}
<h2>Avoid the common extra charges</h2>
<ul>
<li><strong>Detention</strong>: be ready at the appointment time, so the driver isn't held beyond the free time.</li>
<li><strong>Truck ordered, not used</strong>: if the load cancels, tell the broker as early as possible.</li>
<li><strong>Re-delivery</strong>: confirm that the receiver's hours and appointment requirements are in the order.</li>
</ul>`,
    faq: [
      ['Is a dry van the same as a box truck?', 'No. A dry van is a semi-trailer pulled by a tractor. Box trucks are smaller straight trucks used mostly for local delivery.'],
      ['Do I need a full truckload?', 'Not always. If your freight fills only part of a trailer, ask about partial or LTL options.'],
    ],
    sources: [],
  },
  {
    slug: 'flatbed-freight-shipping',
    nav: 'Flatbed freight',
    blurb: 'Steel, lumber, machinery and anything loaded from the side or top.',
    title: 'Flatbed Freight Shipping: Get an Open-Deck Truck Quote | NorthStar',
    desc: 'How flatbed truckload shipping works: when you need open-deck, tarps and securement, flatbed vs. step deck vs. Conestoga, and what to include in your quote.',
    h1: 'Flatbed freight: for loads that don\'t fit through a door.',
    lede: 'A flatbed is an open trailer with no sides or roof, loaded by crane or forklift from the side or top. It carries steel, lumber, pipe, building materials, machinery and other freight that is too big, heavy or awkward for a van.',
    body: `
<h2>Choose the right open-deck trailer</h2>
<ul>
<li><strong>Flatbed</strong>: the standard open deck, typically 48 to 53 feet.</li>
<li><strong>Flatbed with sides</strong>: adds removable side panels for loads that need containment.</li>
<li><strong>Step deck</strong>: a lower rear deck for taller freight. See <a href="heavy-haul-shipping.html">heavy haul and oversized freight</a>.</li>
<li><strong>Conestoga</strong>: a flatbed with a rolling tarp system. It loads like a flatbed but covers like a van.</li>
</ul>
<h2>What to include in your request</h2>
<ul>
<li>Exact <strong>dimensions</strong> (length, width, height) and <strong>weight</strong> of each piece.</li>
<li>Whether the load needs <strong>tarps</strong> (for weather protection) and what type.</li>
<li>How it will be <strong>loaded and unloaded</strong>: forklift, crane, or loading ramp.</li>
<li>Any <strong>securement</strong> needs: chains, straps, edge protectors, dunnage.</li>
</ul>
${'{{CTA}}'}
<p>Team flatbed service is also available for expedited open-deck loads. See our full <a href="../index.html#equipment">equipment list</a>.</p>`,
    faq: [
      ['Does flatbed freight need tarps?', 'It depends on the product. Steel coils, lumber and finished goods often need tarps, while pipe or concrete products may not. Say so in your quote request, because tarping is often priced separately.'],
      ['What if my load is taller or wider than normal?', 'You may need a step deck, RGN or an oversize permit. See our heavy haul guide.'],
    ],
    sources: [],
  },
  {
    slug: 'heavy-haul-shipping',
    nav: 'Heavy haul & oversized',
    blurb: 'Step deck, RGN and double drop for machinery and tall or wide loads.',
    title: 'Heavy Haul & Oversized Freight: Step Deck, RGN Quotes | NorthStar',
    desc: 'Ship heavy equipment and oversized loads: when to use a step deck, removable gooseneck (RGN) or double drop, permits, and what details your quote needs.',
    h1: 'Heavy haul: tall, wide and heavy freight, moved right.',
    lede: 'Construction equipment, tractors, industrial machinery, tanks and other big loads need lower decks, special trailers and, often, state permits. The right trailer depends on the height, width, weight, and whether the load can drive itself on.',
    body: `
<h2>Which trailer fits your load?</h2>
<ul>
<li><strong>Step deck</strong> (drop deck): a lower rear deck gives more height for tall freight that can be loaded by crane or forklift.</li>
<li><strong>Removable gooseneck (RGN)</strong>: the front detaches so the trailer can be lowered into a ramp. Equipment can then be driven or winched on. Common for excavators, dozers and tractors.</li>
<li><strong>Double drop</strong>: a low well between the front and rear decks for the tallest freight.</li>
</ul>
<h2>Details that matter most for oversized loads</h2>
<ul>
<li><strong>Exact dimensions and weight</strong> of the piece, including attachments. Measure; don't estimate.</li>
<li><strong>Can it be driven?</strong> Running equipment loads very differently from a dead load that needs a crane.</li>
<li><strong>Permits and escorts</strong>: oversize and overweight loads usually need state permits, and some need pilot cars. Requirements differ by state and route, and they affect both price and timing.</li>
<li><strong>Site access</strong>: room for a long trailer to turn and load at both ends.</li>
</ul>
${'{{CTA}}'}`,
    faq: [
      ['How far ahead should I book heavy haul?', 'Earlier than standard freight. Specialized trailers are fewer, and permits take time to arrange.'],
      ['Who arranges the permits?', 'Usually the carrier or broker, as part of the quote. Confirm that permits and escorts are included before you accept.'],
    ],
    sources: [],
  },
  {
    slug: 'power-only-freight',
    nav: 'Power only',
    blurb: 'You have the trailer; you need a truck and driver to move it.',
    title: 'Power Only Trucking: Get a Quote to Move Your Trailer | NorthStar',
    desc: 'Power only trucking explained: when shippers with their own trailers need just a tractor and driver, drop-and-hook, trailer pools, and what to include in your quote.',
    h1: 'Power only: your trailer, our truck.',
    lede: 'Power only means a carrier supplies the tractor and driver, and you supply the trailer. It suits shippers and manufacturers with their own trailers or trailer pools, drop-and-hook programs, and moving empty trailers between locations.',
    body: `
<h2>When power only makes sense</h2>
<ul>
<li>You keep <strong>preloaded trailers</strong> at your dock (drop-and-hook), so trucks hook up and leave without waiting.</li>
<li>You need to <strong>reposition</strong> empty or loaded trailers between plants, warehouses or yards.</li>
<li>Your own fleet is <strong>short on drivers</strong> or tractors during a peak.</li>
</ul>
<h2>What to include in your request</h2>
<ul>
<li>Trailer type and length, and whether it is loaded or empty.</li>
<li>Trailer condition and paperwork: registration, plates, and inspection status.</li>
<li>Pickup and drop locations, and yard or gate procedures.</li>
<li>Whether the trailer must come back (round trip) or stays at the destination.</li>
</ul>
${'{{CTA}}'}`,
    faq: [
      ['Who is responsible for the trailer\'s condition?', 'Agree on this before booking. Inspect the trailer and record its condition at pickup and at drop-off.'],
    ],
    sources: [],
  },
  {
    slug: 'check-a-freight-broker',
    nav: 'How to check a freight broker',
    blurb: 'Authority, bond and red flags: verify before you hand over a load.',
    title: 'How to Check a Freight Broker Before You Ship | NorthStar',
    desc: 'Verify a freight broker in 5 minutes: FMCSA authority, the $75,000 broker bond, insurance, and red flags that signal fraud or double brokering.',
    h1: 'Check a freight broker before you hand over your load.',
    lede: 'Freight fraud and double brokering cost shippers real money. A legitimate broker is registered with the FMCSA and keeps a financial security on file. Here is how to check, in about five minutes.',
    body: `
<h2>What a broker is, legally</h2>
<p>Under federal rules, a <strong>broker</strong> is a person who, for compensation, arranges or offers to arrange the transportation of property by an authorized motor carrier [1]. In other words, the broker doesn't haul your freight; an authorized carrier does.</p>
<h2>5-minute check</h2>
<ol>
<li><strong>Look up the MC or USDOT number</strong> on <a href="https://safer.fmcsa.dot.gov" target="_blank" rel="noopener">FMCSA SAFER</a> [3]. Confirm that the company name, address and phone number match who you are talking to.</li>
<li><strong>Confirm broker authority is active.</strong> A company can hold carrier authority without broker authority, and the reverse.</li>
<li><strong>Check the bond or trust fund.</strong> A property broker must have a <strong>$75,000</strong> surety bond (Form BMC-84) or trust fund (Form BMC-85) in effect, and FMCSA won't register a broker until it is in place [2].</li>
<li><strong>Call back on a number you found yourself</strong>, not one from an email, to confirm the quote is real.</li>
<li><strong>Ask who will haul it.</strong> Get the carrier's name and MC number on your rate confirmation.</li>
</ol>
<h2>Red flags</h2>
<ul>
<li>Email domains that don't match the company, or recent changes to contact details.</li>
<li>Pressure to book immediately, or to pay up front in unusual ways.</li>
<li>A price far below every other quote.</li>
<li>Refusing to name the carrier, or a different carrier showing up at pickup.</li>
</ul>
${'{{CTA}}'}
<p>NorthStar Delivery Solutions LLC: MC 1819020 · USDOT 4572562. Verify us on <a href="https://safer.fmcsa.dot.gov" target="_blank" rel="noopener">FMCSA SAFER</a>.</p>`,
    faq: [
      ['What does the broker bond cover?', 'Under 49 CFR 387.307, the bond or trust fund provides for payments to shippers or motor carriers if the broker fails to carry out its contracts or arrangements for transportation by authorized motor carriers [2].'],
      ['Is a carrier the same as a broker?', 'No. A carrier operates the trucks. A broker arranges the transportation with an authorized carrier [1].'],
    ],
    sources: ['broker', 'bond', 'safer'],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function shell({ title, desc, path, body, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${ORIGIN}/${path}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${ORIGIN}/${path}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${path.includes('/') ? '' : 'ship/'}ship.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<header>
  <nav class="wrap">
    <a href="../index.html" class="logo">
      <span class="mark">N</span>
      <span>NorthStar Delivery<span class="sub">Solutions LLC · Freight Brokerage</span></span>
    </a>
    <ul>
      <li><a href="index.html" class="active">Ship Freight</a></li>
      <li><a href="../index.html#equipment">Equipment</a></li>
      <li><a href="../index.html#drivers">Drive With Us</a></li>
      <li><a href="../rate-tools.html">Rate Tools</a></li>
      <li><a href="../news/index.html">NSNN News</a></li>
    </ul>
    <div class="nav-links">
      <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber">Get A Quote</a>
    </div>
  </nav>
</header>
${body}
<footer>
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <div class="logo" style="margin-bottom:10px;">
          <span class="mark">N</span>
          <span>NorthStar Delivery<span class="sub">Solutions LLC</span></span>
        </div>
        <p class="blurb">Licensed freight brokerage covering dry van, reefer, flatbed, specialized, and bulk equipment nationwide. MC 1819020 · USDOT 4572562.</p>
      </div>
      <div>
        <h4>Shipper guides</h4>
        <ul class="foot-links">
${GUIDES.map((g) => `          <li><a href="${g.slug}.html">${g.nav}</a></li>`).join('\n')}
        </ul>
      </div>
      <div>
        <h4>Navigate</h4>
        <ul class="foot-links">
          <li><a href="index.html">Ship Freight</a></li>
          <li><a href="../index.html#equipment">Equipment</a></li>
          <li><a href="../rate-tools.html">Rate Tools</a></li>
          <li><a href="../news/index.html">NSNN News</a></li>
          <li><a href="../index.html#contact">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Compliance</h4>
        <ul class="foot-links">
          <li>MC 1819020</li>
          <li>USDOT 4572562</li>
          <li><a href="https://safer.fmcsa.dot.gov" target="_blank" rel="noopener">Verify on FMCSA SAFER →</a></li>
        </ul>
      </div>
    </div>
    <div class="bottom-bar">
      <span>© 2026 NorthStar Delivery Solutions LLC. All rights reserved.</span>
      <span>MC 1819020 · USDOT 4572562</span>
    </div>
  </div>
</footer>
</body>
</html>
`;
}

const ORG = { '@type': 'Organization', '@id': `${ORIGIN}/#org`, name: 'NorthStar Delivery Solutions LLC', url: `${ORIGIN}/`, telephone: '+1-872-363-2070', address: { '@type': 'PostalAddress', streetAddress: '205 N. Michigan Ave', addressLocality: 'Chicago', addressRegion: 'IL', postalCode: '60601', addressCountry: 'US' } };

for (const g of GUIDES) {
  const ctaHtml = cta('Ready to ship?', 'Get an instant truckload quote from our booking partner: any lane across the 48 states, every major equipment type.');
  const sources = g.sources.length
    ? `<h2>Sources</h2><ol class="sources">${g.sources.map((k) => `<li><a href="${SRC[k][1]}" target="_blank" rel="noopener">${SRC[k][0]}</a></li>`).join('')}</ol>`
    : '';
  const faq = `<h2>Questions</h2><div class="faq">${g.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`;
  const related = `<h2>More shipper guides</h2><div class="guide-grid">${GUIDES.filter((x) => x !== g).slice(0, 3).map((x) => `<a href="${x.slug}.html"><b>${x.nav}</b><span>${x.blurb}</span></a>`).join('')}</div>`;
  const body = `
<section class="page-head">
  <div class="wrap">
    <div class="crumbs"><a href="../index.html">Home</a> / <a href="index.html">Ship freight</a></div>
    <span class="eyebrow">Shipper guide</span>
    <h1>${g.h1}</h1>
    <p class="lede">${g.lede}</p>
    <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber" style="margin-top:24px;">Get A Freight Quote</a>
  </div>
</section>
<section>
  <div class="wrap article">
${g.body.replace('{{CTA}}', ctaHtml)}
${faq}
${sources}
<p class="disclose">General information, not legal advice. Last reviewed ${TODAY}.</p>
${related}
  </div>
</section>`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: strip(g.h1), description: g.desc, url: `${ORIGIN}/ship/${g.slug}.html`, dateModified: TODAY, publisher: { '@id': `${ORIGIN}/#org` } },
    { '@type': 'FAQPage', mainEntity: g.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a).replace(/ \[\d\]/g, '') } })) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Ship freight', item: `${ORIGIN}/ship/` },
      { '@type': 'ListItem', position: 3, name: g.nav, item: `${ORIGIN}/ship/${g.slug}.html` } ] },
    ORG ] };
  writeFileSync(join(root, 'ship', `${g.slug}.html`), shell({ title: g.title, desc: g.desc, path: `ship/${g.slug}.html`, body, jsonld }));
}

// Hub
const hubBody = `
<section class="page-head">
  <div class="wrap">
    <span class="eyebrow">For shippers</span>
    <h1>Ship a truckload anywhere in the 48 states.</h1>
    <p class="lede">Dry van, reefer, flatbed, heavy haul, power only and more. Get an instant quote online, or start with our guides to make sure the quote matches your load.</p>
    <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber" style="margin-top:24px;">Get A Freight Quote</a>
    <p class="disclose" style="max-width:640px;">${DISCLOSE}</p>
  </div>
</section>
<section>
  <div class="wrap article" style="max-width:1180px;">
    <h2>Shipper guides</h2>
    <div class="guide-grid">${GUIDES.map((x) => `<a href="${x.slug}.html"><b>${x.nav}</b><span>${x.blurb}</span></a>`).join('')}</div>
    <div style="max-width:760px;">
${cta('One request, every equipment type', 'Tell the partner your lane, dates, equipment and weight. The quote comes back online, and you decide whether to book.')}
    <h2>Verify us</h2>
    <p>NorthStar Delivery Solutions LLC is registered with the FMCSA: MC 1819020 · USDOT 4572562. Look us up on <a href="https://safer.fmcsa.dot.gov" target="_blank" rel="noopener">FMCSA SAFER</a>. And check any broker before you ship: <a href="check-a-freight-broker.html">here's how</a>.</p>
    </div>
  </div>
</section>`;
writeFileSync(join(root, 'ship', 'index.html'), shell({
  title: 'Ship Freight: Truckload Quotes for Every Equipment Type | NorthStar',
  desc: 'Get a full-truckload freight quote for dry van, reefer, flatbed, heavy haul or power only across the 48 states, plus free shipper guides.',
  path: 'ship/index.html', body: hubBody,
  jsonld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: 'Ship freight', url: `${ORIGIN}/ship/`, publisher: { '@id': `${ORIGIN}/#org` } }, ORG] },
}));

// Sitemap: keep existing entries, add /ship/ pages.
const smPath = join(root, 'sitemap.xml');
let sm = readFileSync(smPath, 'utf8').replace(/\s*<url><loc>[^<]*\/ship\/[^<]*<\/loc>[^\n]*<\/url>/g, '');
const add = ['ship/', ...GUIDES.map((g) => `ship/${g.slug}.html`)].map((p) => `  <url><loc>${ORIGIN}/${p}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n');
sm = sm.replace('</urlset>', `${add}\n</urlset>`);
writeFileSync(smPath, sm);
console.log(`built ${GUIDES.length + 1} shipper pages; sitemap updated`);
