// Builds the freight-tool landing pages in /tools/ from the SEO matrix (same look as the site).
//   node scripts/seo/build.mjs
// Each page is a mirror of a row in northstar_seo_matrix and funnels to the real tool + the quote partner.
// Every claim stays honest: the tools are free and run on-device; no fabricated stats, reviews or savings.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGIN = 'https://northstardeliveryservice.com';
const QUOTE = 'https://freightsidekick.com/freight-quote?ref=northstardeliverysolutions';
const TODAY = new Date().toISOString().slice(0, 10);
const DISCLOSE = 'Quotes are provided by our partner, Freight Sidekick. We may earn a commission when you book.';

// --- the tools these pages funnel to (honest free/pricing wording) ---
const TOOLS = {
  ratecon: { name: 'Rate Con Checker', url: 'https://quickwell.app/rate-con-checker/?ref=northstar', badge: 'Free daily · Pro', cta: 'Open the Rate Con Checker',
    howto: ['Paste the full broker rate confirmation text.', 'Read the flags: setoff/offset, chargebacks, payment terms, missing detention/TONU.', 'Use the drafted fix request to ask the broker to strike the bad language — before you sign.'],
    note: '3 free checks a day, no card, nothing you paste leaves your device. Pro unlocks unlimited checks.' },
  haul: { name: 'Haul Audit', url: 'https://quickwell.app/haul-audit/?ref=northstar', badge: 'Free daily · Pro', cta: 'Open Haul Audit',
    howto: ['Enter what the rate con agreed: line haul, fuel, approved accessorials.', 'Enter what actually hit — the broker settlement and the factoring deposit.', 'Read the broker variance on its own line, with factoring fees isolated so a short-pay cannot hide.'],
    note: '3 free checks a day, no card, runs in your browser. Pro unlocks unlimited reconciliations and saved history.' },
  class: { name: 'Freight Class Calculator', url: `${ORIGIN}/freight-class-calculator.html`, badge: 'Free', cta: 'Open the Freight Class Calculator',
    howto: ['Enter the shipment dimensions and weight.', 'Get the density in pounds per cubic foot and the matching NMFC class band.', 'Quote that class so the carrier cannot reclass it at the dock.'],
    note: '100% free, no account, runs on your device.' },
  linear: { name: 'Linear Feet Calculator', url: `${ORIGIN}/linear-feet-calculator.html`, badge: 'Free', cta: 'Open the Linear Feet Calculator',
    howto: ['Enter your pallet count, footprint and whether they stack.', 'See the linear feet of deck the load really takes.', 'Decide LTL vs full truckload so you never pay for space you do not use.'],
    note: '100% free, no account, runs on your device.' },
  rate: { name: 'Rate / Mile Tools', url: `${ORIGIN}/rate-tools.html`, badge: 'Free', cta: 'Open the Rate / Mile Tools',
    howto: ['Enter the offered rate, loaded miles and deadhead.', 'Add fuel and your running cost per mile.', 'See the all-in rate per mile and whether to take, counter or pass — before you answer dispatch.'],
    note: '100% free, no account, nothing leaves your device.' },
  broker: { name: 'Check a Freight Broker', url: `${ORIGIN}/ship/check-a-freight-broker.html`, badge: 'Free', cta: 'Open the Broker Checklist',
    howto: ['Confirm active operating authority and the surety bond on FMCSA SAFER.', 'Check the pay history and days-to-pay signals.', 'Walk the red-flag list before you commit a truck to the load.'],
    note: 'Free checklist. Verify any company on the public FMCSA SAFER system.' },
  accessorial: { name: 'Accessorial Charges Guide', url: `${ORIGIN}/ship/freight-accessorial-charges.html`, badge: 'Free', cta: 'See the accessorial charges guide',
    howto: ['List the accessorials your load actually triggers: liftgate, residential, inside delivery, detention.', 'Fold them into the quote up front.', 'Match the invoice to the number you promised — no surprises.'],
    note: 'Free guide. Pair it with an instant quote for the line-haul.' },
};

// --- the matrix (mirror of northstar_seo_matrix; tool = which utility the page funnels to) ---
const ROWS = [
  { slug: 'rate-con-setoff-clause-checker', tool: 'ratecon', target_role: 'Owner-Operator', primary_keyword: 'rate confirmation setoff clause check',
    tool_title: 'Rate Con Setoff Clause Checker', meta_description: 'Paste a broker rate con and flag the setoff clause before you sign. Free, runs on your device, nothing uploaded. Catches the page-2 trap that pulls your pay.',
    h1_heading: 'Catch the setoff clause buried on page 2 of your rate con',
    intro_copy: 'Brokers do not put the setoff clause in bold. They bury it on page 2, and it lets them pull money from this load to cover a claim on another one. Paste your rate confirmation and see it flagged in red before you sign. The check is free, it runs on your device, and nothing you paste leaves it.' },
  { slug: 'rate-confirmation-red-flag-scanner', tool: 'ratecon', target_role: 'Owner-Operator', primary_keyword: 'how to read a broker rate confirmation',
    tool_title: 'Rate Confirmation Red-Flag Scanner', meta_description: 'Scan any broker rate confirmation for setoff, chargebacks, long pay terms and missing detention. Free, on-device, drafts your fix request. Read it in seconds.',
    h1_heading: 'Every red flag in a broker rate con, in seconds',
    intro_copy: 'You do not have time to lawyer every rate con, and that is exactly what the fine print counts on. Drop the confirmation in and the scanner surfaces the setoff language, the chargebacks, the 45-day pay terms and the missing detention line. It even drafts the email asking the broker to strike them. Free, and it pays for itself the first time it stops a bad signature.' },
  { slug: 'broker-short-pay-audit-tool', tool: 'haul', target_role: 'Owner-Operator', primary_keyword: 'how to catch a broker short pay',
    tool_title: 'Broker Short-Pay Audit Tool', meta_description: 'Rebuild the agreed gross from your rate con and spot the exact dollars a broker short-paid. Free, private, on-device. A short-pay cannot hide anymore.',
    h1_heading: 'Prove the broker short-paid you, with the math in hand',
    intro_copy: 'A settlement that lands light does not announce itself. Rebuild the agreed gross from the signed rate con and approved accessorials, then put it next to what actually hit your account. The gap is the short-pay. You dispute it with numbers instead of a hunch, and you do it for free, on your own device.' },
  { slug: 'factoring-fee-vs-short-pay-calculator', tool: 'haul', target_role: 'Fleet Dispatcher', primary_keyword: 'factoring fee short pay difference',
    tool_title: 'Factoring Fee vs Short-Pay Calculator', meta_description: 'Separate the factoring fee from an actual broker short-pay so you stop blaming the wrong party. Free, on-device settlement math for carriers.',
    h1_heading: 'Is it the factoring fee, or did the broker short-pay you?',
    intro_copy: 'When the deposit is light, most carriers shrug and assume it is the factor taking its cut. Sometimes it is. Sometimes the broker short-paid and the factoring fee is hiding it. This tool isolates the fee, the reserve and the advance, then shows the broker variance on its own line. Free, and the first catch covers a year of guessing.' },
  { slug: 'settlement-reconciliation-tool', tool: 'haul', target_role: 'Fleet Dispatcher', primary_keyword: 'reconcile broker settlement vs rate con',
    tool_title: 'Freight Settlement Reconciliation Tool', meta_description: 'Reconcile every broker settlement against the rate con and factoring deposit in one view. Free, on-device, nothing stored. Catch the leaks per load.',
    h1_heading: 'Reconcile a settlement against the rate con, load by load',
    intro_copy: 'A few dollars off per load does not feel like much until you count a quarter of them. Line up the rate con, the broker settlement and the factoring deposit in one view and the leaks show themselves. It runs locally, it keeps nothing, and it costs you nothing to find money that is already yours.' },
  { slug: 'ltl-freight-class-calculator', tool: 'class', target_role: 'Warehouse Logistics Manager', primary_keyword: 'how to calculate ltl freight class',
    tool_title: 'LTL Freight Class Calculator', meta_description: 'Enter dimensions and weight, get the correct LTL freight class and density instantly. Free, on-device. Quote right and dodge the reclass bill.',
    h1_heading: 'Get the LTL freight class right before you quote it',
    intro_copy: 'Guess the class low and the carrier re-measures at the dock, reclasses the freight, and the margin you promised your boss is gone. Enter the real dimensions and weight and get the class and density in seconds. Free, instant, and no account to look around.' },
  { slug: 'freight-density-class-calculator', tool: 'class', target_role: 'Warehouse Logistics Manager', primary_keyword: 'freight density calculator pcf',
    tool_title: 'Freight Density and Class Calculator', meta_description: 'Calculate pounds per cubic foot and map it to the right NMFC class range. Free, on-device density math for accurate LTL quotes.',
    h1_heading: 'Pounds per cubic foot to freight class, done right',
    intro_copy: 'Density drives the class, and the class drives the bill. Put in the dimensions and weight and get clean pounds per cubic foot mapped to the class range, so your quote holds up when the freight gets measured. It is free and it runs in your browser.' },
  { slug: 'nmfc-class-lookup-by-density', tool: 'class', target_role: 'Warehouse Logistics Manager', primary_keyword: 'nmfc freight class by density',
    tool_title: 'NMFC Class Lookup by Density', meta_description: 'Turn a density number into its NMFC class band in one step. Free, instant, on-device. Stop quoting the wrong class from memory.',
    h1_heading: 'From a density number to the NMFC class band',
    intro_copy: 'Quoting a class from memory is how a reclass bill ends up on your invoice. Give the calculator your density and it returns the matching class band, so the number you send a carrier is the number that sticks. Free, and nothing you enter is tracked.' },
  { slug: 'trailer-linear-feet-calculator', tool: 'linear', target_role: 'Warehouse Logistics Manager', primary_keyword: 'linear feet calculator for ltl',
    tool_title: 'Trailer Linear Feet Calculator', meta_description: 'See exactly how much trailer deck your pallets take and whether it ships LTL or full truckload. Free, on-device. Do not pay for space you do not use.',
    h1_heading: 'How much trailer space does your freight actually need?',
    intro_copy: 'Over-estimate the space and you pay for a full truck you did not need. Under-estimate and the quote falls apart at pickup. Enter your pallet counts and footprints and see the linear feet the load really takes, plus whether it belongs on LTL or a full truckload. Free and instant.' },
  { slug: 'ltl-vs-truckload-decision-tool', tool: 'linear', target_role: 'Shipping Manager', primary_keyword: 'when to switch ltl to full truckload',
    tool_title: 'LTL vs Truckload Decision Tool', meta_description: 'Find the pallet count and linear-feet point where LTL stops being cheaper than a full truckload. Free, on-device. Pick the mode that protects margin.',
    h1_heading: 'LTL or full truckload? Find the line before you book',
    intro_copy: 'There is a point where one more pallet makes LTL cost more than a full truck, and most shippers blow past it without noticing. This tool finds that line from your linear feet and pallet count, so you book the mode that keeps the margin instead of the one out of habit. Free to use, right now.' },
  { slug: 'pallet-trailer-space-calculator', tool: 'linear', target_role: 'Warehouse Logistics Manager', primary_keyword: 'how many pallets fit in a 53 trailer',
    tool_title: 'Pallet Trailer Space Calculator', meta_description: 'Calculate how many pallets fit a 48 or 53 foot trailer by footprint and stackability. Free, on-device trailer loading math for shippers.',
    h1_heading: 'How many pallets really fit your trailer',
    intro_copy: 'The textbook answer and the loaded answer are rarely the same, because footprint and stackability change everything. Enter your pallet size and whether they stack and get the real count for a 48 or 53 foot trailer. It is free and it runs on your device, no sign-in.' },
  { slug: 'rate-per-mile-calculator', tool: 'rate', target_role: 'Owner-Operator', primary_keyword: 'how to calculate rate per mile trucking',
    tool_title: 'Rate Per Mile Calculator', meta_description: 'Work out your true rate per mile including the costs that eat a load. Free, on-device. Know your number before you accept or counter.',
    h1_heading: 'Know your real rate per mile before you say yes',
    intro_copy: 'A rate looks fine until you divide it by the miles that actually paid. Enter the line haul, the miles and the costs and get your true rate per mile, so you take the good loads and counter the cheap ones with a number instead of a feeling. Free, and no data leaves your device.' },
  { slug: 'deadhead-adjusted-rate-calculator', tool: 'rate', target_role: 'Owner-Operator', primary_keyword: 'all in rate per mile with deadhead',
    tool_title: 'Deadhead-Adjusted Rate Calculator', meta_description: 'Fold deadhead and fuel into one all-in rate per mile so cheap loads cannot hide. Free, on-device math for owner-operators.',
    h1_heading: 'Your all-in rate per mile, deadhead included',
    intro_copy: 'A load that pays well on loaded miles can lose money once you add the empty ones to get there. This calculator folds deadhead and fuel into one all-in rate per mile so a cheap load has nowhere to hide. Free to run, and the first bad load it talks you out of has paid for it.' },
  { slug: 'load-profitability-calculator', tool: 'rate', target_role: 'Owner-Operator', primary_keyword: 'is this freight load worth it',
    tool_title: 'Load Profitability Calculator', meta_description: 'Enter the rate, miles and your costs and see if a load actually makes money before you book it. Free, private, on-device load math.',
    h1_heading: 'Is this load worth your truck today?',
    intro_copy: 'Dispatch wants an answer in two minutes and the only honest one is a number. Put in the rate, the loaded and empty miles and your running cost and see the profit on the load before you commit the truck. It is free, it keeps nothing, and it beats finding out at settlement.' },
  { slug: 'verify-freight-broker-authority-bond', tool: 'broker', target_role: 'Fleet Dispatcher', primary_keyword: 'how to verify a freight broker',
    tool_title: 'Broker Authority and Bond Check', meta_description: 'The checklist to verify a broker authority, bond and pay history before you haul. Free. Do not hand your load to a ghost.',
    h1_heading: 'Verify a broker before you hand over the load',
    intro_copy: 'Anyone can email you a rate con. That does not mean they have active authority, a real bond, or a habit of paying. Run the broker through the checklist first and vet the authority, the bond and the red flags that cost carriers their freight pay. Free, and far cheaper than hauling for a company that disappears at invoice time.' },
  { slug: 'broker-days-to-pay-checklist', tool: 'broker', target_role: 'Fleet Dispatcher', primary_keyword: 'check broker payment history',
    tool_title: 'Broker Days-to-Pay Vetting Checklist', meta_description: 'Vet how fast a broker actually pays before you commit a truck. Free checklist of the signals that predict a slow or short pay.',
    h1_heading: 'How fast does this broker really pay?',
    intro_copy: 'The rate means nothing if the check takes ninety days or never comes. Before you commit the truck, run the broker against the signals that predict slow pay, disputes and setoff games. The checklist is free, and a single avoided no-pay load is worth more than a month of good ones.' },
  { slug: 'detention-tonu-rate-con-check', tool: 'ratecon', target_role: 'Owner-Operator', primary_keyword: 'detention pay rate confirmation',
    tool_title: 'Detention and TONU Rate Con Check', meta_description: 'Check whether a rate con actually pays detention and TONU, and at what trigger, before you sign. Free, on-device rate con analysis.',
    h1_heading: 'Does this rate con actually pay detention and TONU?',
    intro_copy: 'Brokers love a rate con that is silent on detention and TONU, because silence means they owe you nothing when the dock holds you for five hours. Paste the confirmation and see whether detention and TONU are there, at what trigger and what rate. Free, and it turns waiting time back into paid time.' },
  { slug: 'rate-con-chargeback-fine-scanner', tool: 'ratecon', target_role: 'Owner-Operator', primary_keyword: 'rate con chargeback fines',
    tool_title: 'Chargeback and Fine Clause Scanner', meta_description: 'Surface every chargeback, fine and deduction clause in a rate con and the dollar amounts attached. Free, on-device, nothing stored.',
    h1_heading: 'Find every fine and chargeback before you sign',
    intro_copy: 'Late-fee, missing-paperwork and tracking-app fines add up fast, and they are written to be skimmed past. Drop the rate con in and the scanner pulls out each chargeback and fine with the dollar figure attached, so you know the real downside of the load before you take it. Free and private.' },
  { slug: 'accessorial-charge-estimator', tool: 'accessorial', target_role: 'Shipping Manager', primary_keyword: 'freight accessorial charges list',
    tool_title: 'Accessorial Charge Estimator', meta_description: 'Estimate liftgate, residential, detention and other accessorials before they surprise your invoice. Free, on-device estimator for shippers.',
    h1_heading: 'Price the accessorials before they hit your invoice',
    intro_copy: 'The line-haul quote is the part everyone remembers; the accessorials are the part that blows the budget. Estimate the liftgate, residential, inside-delivery and detention charges up front so the invoice matches the number you promised. Free to use, no account required.' },
  { slug: 'truckload-lane-rate-benchmark', tool: 'rate', target_role: 'Fleet Dispatcher', primary_keyword: 'truckload lane rate per mile',
    tool_title: 'Lane Rate Benchmark Tool', meta_description: 'Sanity-check a lane offered rate per mile against your own cost floor before you accept or counter. Free, on-device, nothing tracked.',
    h1_heading: 'Is this lane paying what it should?',
    intro_copy: 'A lane is only a good lane if the rate clears your cost to run it. Put the offered rate against your own floor per mile and see instantly whether to accept, counter or pass. It is free, it stores nothing, and it keeps a slow week from turning into a losing one.' },
];

// Interactive calculator pages (hand-built, real math). The generator lists them in the hub and
// sitemap but does NOT render their HTML (they live as their own index.html files).
const CALCS = [
  { slug: 'trucking-operating-cost-per-mile', tool_title: 'Operating Cost Per Mile Calculator', meta_description: 'Your true cost per mile from your own fixed, fuel and maintenance numbers — plus the break-even rate on loaded miles.' },
  { slug: 'air-cargo-chargeable-weight-calculator', tool_title: 'Air Cargo Chargeable Weight (IATA)', meta_description: 'Volumetric vs actual weight for air freight, the IATA way — see which one the airline bills.' },
  { slug: 'dry-van-pallet-capacity-calculator', tool_title: 'Dry Van Pallet Capacity Calculator', meta_description: 'How many pallets fit a 48 or 53 foot van, by footprint, orientation and stacking.' },
  { slug: 'reefer-fuel-consumption-estimator', tool_title: 'Reefer Fuel Burn Estimator', meta_description: 'Gallons and dollars of auxiliary diesel your reefer burns over a lane.' },
  { slug: 'freight-tonu-detention-loss-tracker', tool_title: 'TONU & Detention Loss Calculator', meta_description: 'What the broker owes you on detention and a cancelled load, plus the deadhead it cost.' },
  { slug: 'fuel-surcharge-fsc-rate-calculator', tool_title: 'Fuel Surcharge (FSC) Calculator', meta_description: 'Fuel surcharge per mile from your base peg, the pump price and your MPG.' },
  { slug: 'hot-shot-trucking-payload-calculator', tool_title: 'Hot Shot Payload Calculator', meta_description: 'Legal net cargo from your truck GCWR and trailer GVWR — stay under the scale.' },
  { slug: 'box-truck-delivery-fuel-margin-calc', tool_title: 'Box Truck Route Margin Calculator', meta_description: 'Net profit and margin on a final-mile route after fuel, wages and tolls.' },
  { slug: 'step-deck-clearance-height-estimator', tool_title: 'Step Deck Height & Clearance', meta_description: 'Total loaded height vs the legal cap — know if you need a permit.' },
  { slug: 'conestoga-trailer-clearance-estimator', tool_title: 'Conestoga Interior Clearance', meta_description: 'Does the machine fit under the rolling tarp — width and height clearance.' },
  { slug: 'double-drop-removable-gooseneck-calc', tool_title: 'RGN Double-Drop Capacity', meta_description: 'Cargo well length fit and weight headroom for heavy haul.' },
  { slug: 'car-hauler-trailer-clearance-planner', tool_title: 'Multi-Car Hauler Deck Planner', meta_description: 'Deck feet left and roof clearance across a multi-car hauler.' },
  { slug: 'straight-truck-axle-weight-balancing', tool_title: 'Straight Truck Axle Balancing', meta_description: 'Estimate steer and drive axle loads from where the cargo sits.' },
  { slug: 'freight-demurrage-port-storage-tracker', tool_title: 'Container Demurrage Calculator', meta_description: 'Demurrage exposure once you pass the steamship line free days.' },
  { slug: 'ltl-minimum-charge-floor-calculator', tool_title: 'LTL Minimum Charge Checker', meta_description: 'Whether your class-rate charge beats the carrier absolute minimum (AMC).' },
  { slug: 'flatbed-oversize-tarping-estimator', tool_title: 'Flatbed Tarping Coverage', meta_description: 'Size the tarp coverage your flatbed load needs by dimension.' },
  { slug: 'intermodal-drayage-chassis-split-calc', tool_title: 'Drayage & Chassis Split Cost', meta_description: 'Total a container move with chassis split, per-diem and prepull — your rates.' },
  { slug: 'freight-forwarder-customs-duty-estimator', tool_title: 'Import Landed Cost Calculator', meta_description: 'Landed cost from goods value, freight and the HTS duty rate you look up.' },
  { slug: 'hazmat-freight-insurance-surcharge-calc', tool_title: 'HAZMAT Freight Cost Calculator', meta_description: 'Roll your own hazmat premium and compliance costs into a lane rate.' },
  { slug: 'broker-bond-claim-viability-checker', tool_title: 'BMC-84 Bond Claim Checklist', meta_description: 'Whether your unpaid freight is a bond-claim candidate and what to document.' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const HEAD = (title, desc, canonical) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta name="robots" content="index,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
  :root{--asphalt:#0E151C;--asphalt-2:#16212B;--steel:#1F3448;--steel-line:#2C4257;--amber:#F2A93B;--amber-dim:#C98A2C;--paper:#F4F1E9;--paper-dim:#C9C7BE;--route-green:#3E8C63;--radius:2px;}
  *{box-sizing:border-box;} html{scroll-behavior:smooth;}
  body{margin:0;background:var(--asphalt);color:var(--paper);font-family:'Public Sans',sans-serif;-webkit-font-smoothing:antialiased;line-height:1.6;}
  h1,h2,h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:0.02em;margin:0;}
  a{color:var(--amber);}
  .wrap{max-width:820px;margin:0 auto;padding:0 24px;}
  header{position:sticky;top:0;z-index:50;background:rgba(14,21,28,0.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--steel-line);}
  nav.wrap{display:flex;align-items:center;justify-content:space-between;height:68px;}
  .logo{display:flex;align-items:center;gap:10px;font-family:'Oswald',sans-serif;font-size:17px;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;color:var(--paper);text-decoration:none;}
  .logo .mark{width:30px;height:30px;border:2px solid var(--amber);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--amber);}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;text-decoration:none;border-radius:var(--radius);transition:transform .15s ease,background .15s ease;}
  .btn-amber{background:var(--amber);color:var(--asphalt);} .btn-amber:hover{background:#ffbf5c;transform:translateY(-1px);}
  .btn-outline{border:1.5px solid var(--paper-dim);color:var(--paper);} .btn-outline:hover{border-color:var(--amber);color:var(--amber);}
  .crumbs{font-size:12px;color:var(--paper-dim);letter-spacing:0.04em;margin:28px 0 0;} .crumbs a{color:var(--paper-dim);text-decoration:none;} .crumbs a:hover{color:var(--amber);}
  article{padding:30px 0 20px;}
  .eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--amber);margin-bottom:18px;}
  .eyebrow::before{content:'';width:26px;height:2px;background:var(--amber);}
  h1{font-size:clamp(30px,4.4vw,46px);line-height:1.08;color:var(--paper);margin-bottom:18px;}
  p.lede{font-size:18px;line-height:1.6;color:var(--paper-dim);}
  .cta-box{background:var(--steel);border:1px solid var(--steel-line);border-left:3px solid var(--amber);border-radius:var(--radius);padding:26px 26px 22px;margin:30px 0;}
  .cta-box .badge{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--route-green);}
  .cta-box h3{font-size:20px;margin:6px 0 8px;color:var(--paper);}
  .cta-box p{font-size:14px;color:var(--paper-dim);margin:0 0 16px;}
  .cta-row{display:flex;gap:12px;flex-wrap:wrap;}
  h2{font-size:22px;margin:34px 0 12px;color:var(--paper);}
  ol,ul{padding-left:22px;} li{margin:7px 0;color:var(--paper);}
  .note{font-size:13px;color:var(--paper-dim);background:var(--asphalt-2);border:1px solid var(--steel-line);border-radius:var(--radius);padding:12px 16px;margin:16px 0;}
  .related{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0 0;}
  .related a{background:var(--asphalt-2);border:1px solid var(--steel-line);border-radius:var(--radius);padding:12px 14px;text-decoration:none;color:var(--paper);font-size:14px;font-weight:600;transition:border-color .15s ease;}
  .related a:hover{border-color:var(--amber);color:var(--amber);}
  .disclose{font-size:11.5px;color:var(--paper-dim);margin-top:14px;line-height:1.5;}
  footer{border-top:1px solid var(--steel-line);margin-top:48px;padding:28px 0;font-size:13px;color:var(--paper-dim);}
  footer a{color:var(--paper-dim);text-decoration:none;} footer a:hover{color:var(--amber);}
  @media(max-width:560px){.related{grid-template-columns:1fr;}}
</style>
</head>
<body>
<header><nav class="wrap">
  <a class="logo" href="${ORIGIN}/"><span class="mark">N</span>NorthStar Freight</a>
  <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber">Get A Quote</a>
</nav></header>`;

const FOOT = `<footer><div class="wrap">
  <a href="${ORIGIN}/">Home</a> · <a href="${ORIGIN}/tools/">All freight tools</a> · <a href="${ORIGIN}/ship/">Ship freight</a> · <a href="${ORIGIN}/news/index.html">NSNN News</a><br>
  <span style="display:block;margin-top:10px;">© ${new Date().getFullYear()} NorthStar Delivery Solutions LLC · Licensed freight brokerage</span>
</div></footer>
</body></html>`;

function renderPage(row, siblings) {
  const t = TOOLS[row.tool];
  const canonical = `${ORIGIN}/tools/${row.slug}/`;
  const rel = siblings.filter((s) => s.slug !== row.slug).slice(0, 4);
  const relHtml = rel.map((s) => `<a href="${ORIGIN}/tools/${s.slug}/">${esc(s.tool_title)} →</a>`).join('\n    ');
  return `${HEAD(row.tool_title + ' | NorthStar Freight Solutions', row.meta_description, canonical)}
<div class="wrap">
  <p class="crumbs"><a href="${ORIGIN}/">Home</a> / <a href="${ORIGIN}/tools/">Freight Tools</a> / ${esc(row.tool_title)}</p>
  <article>
    <span class="eyebrow">For ${esc(row.target_role)}s</span>
    <h1>${esc(row.h1_heading)}</h1>
    <p class="lede">${esc(row.intro_copy)}</p>

    <div class="cta-box">
      <span class="badge">${esc(t.badge)}</span>
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.note)}</p>
      <div class="cta-row">
        <a href="${t.url}" ${t.url.includes('quickwell.app') ? 'target="_blank" rel="noopener"' : ''} class="btn btn-amber">${esc(t.cta)}</a>
        <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-outline">Get An Instant Quote</a>
      </div>
    </div>

    <h2>How to use it</h2>
    <ol>${t.howto.map((h) => `<li>${esc(h)}</li>`).join('')}</ol>

    <h2>Related freight tools</h2>
    <div class="related">
    ${relHtml}
    </div>
    <p style="margin-top:18px;"><a href="${ORIGIN}/tools/">← See all freight tools</a> · <a href="${ORIGIN}/#tools">Back to the toolbox</a></p>

    <p class="disclose">${DISCLOSE} Tools are informational and run on your device; NorthStar does not store what you enter. Not legal, tax or accounting advice.</p>
  </article>
</div>
${FOOT}`;
}

function renderHub(rows) {
  const canonical = `${ORIGIN}/tools/`;
  const groups = {};
  for (const r of rows) (groups[r.tool] ||= []).push(r);
  const sections = Object.entries(groups).map(([k, rs]) => {
    const t = TOOLS[k];
    const cards = rs.map((r) => `    <a class="hubcard" href="${ORIGIN}/tools/${r.slug}/">
      <b>${esc(r.tool_title)}</b>
      <span>${esc(r.meta_description)}</span>
    </a>`).join('\n');
    return `  <h2>${esc(t.name)}</h2>\n  <div class="hubgrid">\n${cards}\n  </div>`;
  }).join('\n');
  const calcCards = CALCS.map((c) => `    <a class="hubcard" href="${ORIGIN}/tools/${c.slug}/">
      <b>${esc(c.tool_title)}</b>
      <span>${esc(c.meta_description)}</span>
    </a>`).join('\n');
  const calcSection = `  <h2>Interactive Calculators</h2>\n  <div class="hubgrid">\n${calcCards}\n  </div>`;
  return `${HEAD('Freight Tools for Carriers & Shippers | NorthStar', 'Free, on-device freight tools and calculators: rate con analysis, settlement audits, LTL freight class and density, trailer space, rate per mile and broker checks.', canonical)}
<style>
  .hubgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 10px;}
  .hubcard{display:block;background:var(--steel);border:1px solid var(--steel-line);border-radius:var(--radius);padding:18px 18px 16px;text-decoration:none;color:var(--paper);transition:border-color .15s ease,transform .15s ease;}
  .hubcard:hover{border-color:var(--amber);transform:translateY(-2px);}
  .hubcard b{display:block;font-size:16px;margin-bottom:5px;color:var(--paper);}
  .hubcard span{font-size:13px;color:var(--paper-dim);line-height:1.5;}
  @media(max-width:560px){.hubgrid{grid-template-columns:1fr;}}
</style>
<div class="wrap">
  <p class="crumbs"><a href="${ORIGIN}/">Home</a> / Freight Tools</p>
  <article>
    <span class="eyebrow">The Toolbox</span>
    <h1>Every freight tool, one screen.</h1>
    <p class="lede">Free, on-device tools that protect your revenue and kill the admin friction — for owner-operators, dispatchers and shippers. Nothing you enter leaves your device. Pick the job you are trying to do.</p>
    <div class="cta-box">
      <span class="badge">Instant · Free to quote</span>
      <h3>Need capacity right now?</h3>
      <p>Pull an instant truckload quote for any equipment type — then use the tools below to make sure the rate and the paperwork are fair.</p>
      <div class="cta-row"><a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber">Get An Instant Quote</a></div>
      <p class="disclose">${DISCLOSE}</p>
    </div>
${calcSection}
${sections}
  </article>
</div>
${FOOT}`;
}

// --- write pages ---
const bySlug = ROWS;
let n = 0;
for (const row of ROWS) {
  const siblings = ROWS.filter((r) => r.tool === row.tool);
  const dir = join(root, 'tools', row.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderPage(row, siblings) + '\n');
  n++;
}
mkdirSync(join(root, 'tools'), { recursive: true });
writeFileSync(join(root, 'tools', 'index.html'), renderHub(ROWS) + '\n');

// --- merge sitemap.xml (keep existing entries, add the hub + 20 pages) ---
const smPath = join(root, 'sitemap.xml');
const sm = readFileSync(smPath, 'utf8');
const existing = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const newUrls = [`${ORIGIN}/tools/`, ...CALCS.map((c) => `${ORIGIN}/tools/${c.slug}/`), ...ROWS.map((r) => `${ORIGIN}/tools/${r.slug}/`)].filter((u) => !existing.has(u));
if (newUrls.length) {
  const rows = newUrls.map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n');
  writeFileSync(smPath, sm.replace('</urlset>', `${rows}\n</urlset>`));
}
console.log(`Built ${n} tool pages + /tools/ hub. Added ${newUrls.length} sitemap URLs.`);
