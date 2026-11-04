// Builds the wave-2 interactive freight calculators in /tools/ from specs below.
//   node scripts/seo/calc-build.mjs
// One shared template; each spec supplies its inputs + a compute() body (real math, on-device).
// Honesty: tools compute on the user's own numbers. Nothing is uploaded. No fabricated "standard" fees.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGIN = 'https://northstardeliveryservice.com';
const QUOTE = 'https://freightsidekick.com/freight-quote?ref=northstardeliverysolutions';
const CSS = `${ORIGIN}/tools/calc.css`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const HEAD = (s) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(s.tool_title)} | NorthStar Freight</title>
<meta name="description" content="${esc(s.meta)}">
<link rel="canonical" href="${ORIGIN}/tools/${s.slug}/">
<meta name="robots" content="index,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CSS}">
</head>
<body>
<header><nav class="wrap">
  <a class="logo" href="${ORIGIN}/"><span class="mark">N</span>NorthStar Freight</a>
  <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber">Get A Quote</a>
</nav></header>`;

const FOOT = `<footer><div class="wrap">
  <a href="${ORIGIN}/">Home</a> · <a href="${ORIGIN}/tools/">All freight tools</a> · <a href="${ORIGIN}/ship/">Ship freight</a>
  <span style="display:block;margin-top:10px;">© 2026 NorthStar Delivery Solutions LLC · Licensed freight brokerage</span>
</div></footer>
</body></html>`;

function inputsHtml(inputs) {
  return inputs.map((i) => {
    if (i.opts) return `<div class="fld"><label>${esc(i.label)}</label><select id="${i.id}">${i.opts.map((o) => `<option value="${o.v}">${esc(o.t)}</option>`).join('')}</select></div>`;
    return `<div class="fld"><label>${esc(i.label)}</label><input id="${i.id}" type="number" inputmode="decimal" value="${i.def}"></div>`;
  }).join('');
}
const relatedHtml = (rel) => rel.map((r) => `<a href="${ORIGIN}/tools/${r[0]}/">${esc(r[1])} →</a>`).join('\n      ') + `\n      <a href="${ORIGIN}/tools/">All freight tools →</a>`;

function ctaBox(s) {
  const primary = s.ctaUrl
    ? `<a href="${s.ctaUrl}" ${s.ctaUrl.indexOf('quickwell.app') > -1 || s.ctaUrl.indexOf('freightsidekick') > -1 ? 'target="_blank" rel="noopener' + (s.ctaUrl.indexOf('freightsidekick') > -1 ? ' sponsored' : '') + '"' : ''} class="btn btn-amber">${esc(s.ctaLabel)}</a>
        <a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-outline">Get An Instant Quote</a>`
    : `<a href="${QUOTE}" target="_blank" rel="noopener sponsored" class="btn btn-amber">Get An Instant Quote</a>`;
  return `<div class="cta-box"><h3>${esc(s.ctaH || 'Make sure the rate covers it.')}</h3><p>${esc(s.ctaP || 'Get an instant truckload quote for any equipment type, then use the free tools to keep the rate and the paperwork fair.')}</p><div class="cta-row" style="display:flex;gap:12px;flex-wrap:wrap;">${primary}</div><p class="disclose">${esc(s.disclose || 'Quotes are provided by our partner, Freight Sidekick; we may earn a commission when you book. This calculator is an estimate from the numbers you enter — not legal, tax or accounting advice.')}</p></div>`;
}

function numericPage(s) {
  return `${HEAD(s)}
<div class="wrap">
  <p class="crumbs"><a href="${ORIGIN}/">Home</a> / <a href="${ORIGIN}/tools/">Freight Tools</a> / ${esc(s.short || s.tool_title)}</p>
  <article>
    <span class="eyebrow">For ${esc(s.role)}</span>
    <h1>${esc(s.h1)}</h1>
    <p class="lede">${esc(s.lede)}</p>
    <div class="calc">
      <h2>${esc(s.calcH || s.tool_title)}</h2>
      ${s.hint ? `<p class="hint">${esc(s.hint)}</p>` : ''}
      <div class="grid">${inputsHtml(s.inputs)}</div>
      <div class="out" id="out"></div>
    </div>
    ${s.note ? `<p class="note">${s.note}</p>` : ''}
    ${ctaBox(s)}
    <h2 class="sec">Related freight tools</h2>
    <div class="related">
      ${relatedHtml(s.related)}
    </div>
  </article>
</div>
${FOOT}
<script>
(function(){
  var $=function(i){return document.getElementById(i);};
  function v(i){var e=$(i);return e?(+e.value||0):0;}
  function sv(i){var e=$(i);return e?e.value:'';}
  function money(n){return '$'+(isFinite(n)?n:0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  function num(n,d){return (isFinite(n)?n:0).toLocaleString(undefined,{maximumFractionDigits:(d==null?1:d)});}
  function ftin(inch){var neg=inch<0;inch=Math.abs(inch);var f=Math.floor(inch/12),i=Math.round(inch-f*12);if(i===12){f++;i=0;}return (neg?'-':'')+f+"'"+i+'"';}
  function cells(arr){$('out').innerHTML=arr.map(function(c){return c.big?'<div class="big"><div class="n">'+c.n+'</div><div class="l">'+c.l+'</div></div>':'<div class="cell"><div class="n">'+c.n+'</div><div class="l">'+c.l+'</div></div>';}).join('');}
  function COMPUTE(){ ${s.compute} }
  function calc(){ cells(COMPUTE()); }
  [${s.inputs.map((i) => `'${i.id}'`).join(',')}].forEach(function(i){var e=$(i);if(e)e.addEventListener('input',calc);});
  calc();
})();
</script>`;
}

function checklistPage(s) {
  return `${HEAD(s)}
<div class="wrap">
  <p class="crumbs"><a href="${ORIGIN}/">Home</a> / <a href="${ORIGIN}/tools/">Freight Tools</a> / ${esc(s.short || s.tool_title)}</p>
  <article>
    <span class="eyebrow">For ${esc(s.role)}</span>
    <h1>${esc(s.h1)}</h1>
    <p class="lede">${esc(s.lede)}</p>
    <div class="calc">
      <h2>${esc(s.calcH)}</h2>
      <p class="hint">${esc(s.hint)}</p>
      <div style="display:grid;gap:12px;">
        ${s.items.map((it, k) => `<label style="display:flex;gap:12px;align-items:flex-start;cursor:pointer;"><input type="checkbox" id="c${k}" style="margin-top:4px;width:18px;height:18px;accent-color:#F2A93B;"><span style="font-size:15px;color:var(--paper);">${esc(it)}</span></label>`).join('\n        ')}
      </div>
      <div class="out" id="out" style="grid-template-columns:1fr;"></div>
    </div>
    <p class="note">${s.note}</p>
    ${ctaBox(s)}
    <h2 class="sec">Related freight tools</h2>
    <div class="related">
      ${relatedHtml(s.related)}
    </div>
  </article>
</div>
${FOOT}
<script>
(function(){
  var n=${s.items.length},boxes=[];
  for(var k=0;k<n;k++)boxes.push(document.getElementById('c'+k));
  function calc(){
    var yes=boxes.filter(function(b){return b&&b.checked;}).length;
    var msg,sub;
    if(yes>=n-1){msg='Strong candidate — file promptly';sub='You meet most criteria. Bond claims have deadlines; send a written demand and file your BMC-84 claim without delay.';}
    else if(yes>=Math.ceil(n/2)){msg='Possible — close the gaps first';sub='You are part-way there. Gather the unchecked items (rate con, POD, written demand) before you file.';}
    else{msg='Not yet — gather your proof';sub='You are missing the basics a bond claim needs. Collect the signed rate con, POD and a written demand first.';}
    document.getElementById('out').innerHTML='<div class="big"><div class="n" style="font-size:24px;">'+msg+'</div><div class="l">'+yes+' of '+n+' criteria met</div></div><div class="cell" style="grid-column:1 / -1;"><div class="n" style="font-size:14px;font-weight:600;">'+sub+'</div><div class="l">Guidance only — not legal advice.</div></div>';
  }
  boxes.forEach(function(b){if(b)b.addEventListener('change',calc);});
  calc();
})();
</script>`;
}

export const SPECS = [
  { slug: 'fuel-surcharge-fsc-rate-calculator', type: 'num', tool_title: 'Fuel Surcharge (FSC) Per-Mile Calculator', short: 'Fuel Surcharge (FSC)', role: 'Carriers & Shippers',
    meta: 'Free FSC calculator: enter your base peg, current diesel price and MPG to compute a fuel surcharge per mile. On-device; your peg, not an invented standard.',
    h1: 'Work out your fuel surcharge on the peg you actually negotiated',
    lede: 'There is no universal "standard" FSC — it is built off a base price you agree to. Enter your base, the current pump price and your MPG and the tool computes the surcharge per mile. Runs on your device.',
    hint: 'FSC per mile = (current diesel − your base) ÷ MPG. Below base, it is zero.',
    inputs: [{ id: 'base', label: 'Your base / peg ($ per gal)', def: '1.25' }, { id: 'pump', label: 'Current diesel ($ per gal)', def: '3.80' }, { id: 'mpg', label: 'Average MPG', def: '6.5' }, { id: 'miles', label: 'Lane miles', def: '500' }],
    compute: `var base=v('base'),pump=v('pump'),mpg=v('mpg'),mi=v('miles');var pm=mpg>0?Math.max(0,pump-base)/mpg:0;return [{big:1,n:money(pm),l:'Fuel surcharge per mile'},{n:money(pm*mi),l:'FSC on '+num(mi,0)+' miles'},{n:money(Math.max(0,pump-base))+' /gal',l:'Diesel over your base'}];`,
    note: 'How it works: the surcharge covers only the diesel <b>above your agreed base</b>, spread over your MPG. Agree the base and the peg source in writing — there is no single national standard FSC. Nothing you enter leaves your device.',
    related: [['trucking-operating-cost-per-mile', 'Cost Per Mile'], ['reefer-fuel-consumption-estimator', 'Reefer Fuel Burn'], ['rate-per-mile-calculator', 'Rate / Mile Tools']] },

  { slug: 'hot-shot-trucking-payload-calculator', type: 'num', tool_title: 'Hot Shot Trucking Payload Calculator', short: 'Hot Shot Payload', role: 'Carriers & Hot Shot Haulers',
    meta: 'Free hot shot payload calculator from your truck GVWR/GCWR and trailer weights. On-device; keeps you legal and under the scale.',
    h1: 'Know your legal hot shot payload before the scale does',
    lede: 'A hot shot is only profitable until a DOT scale ticket wipes the run. Enter your rig ratings and empty weights to see the net cargo weight you can legally haul. Runs on your device.',
    hint: 'Net cargo is limited by whichever is lower: your combined rating (GCWR) or the trailer rating (GVWR).',
    inputs: [{ id: 'gcwr', label: 'Combined rating GCWR (lb)', def: '26000' }, { id: 'truck', label: 'Truck empty weight (lb)', def: '9000' }, { id: 'trailer', label: 'Trailer empty weight (lb)', def: '4500' }, { id: 'tgvwr', label: 'Trailer rating GVWR (lb)', def: '14000' }],
    compute: `var g=v('gcwr'),t=v('truck'),tl=v('trailer'),tg=v('tgvwr');var byPower=g-t-tl;var byTrailer=tg-tl;var net=Math.max(0,Math.min(byPower,byTrailer));return [{big:1,n:num(net,0)+' lb',l:'Legal net cargo you can haul'},{n:num(byPower,0)+' lb',l:'Limit from GCWR'},{n:num(byTrailer,0)+' lb',l:'Limit from trailer GVWR'}];`,
    note: 'How it works: <b>GCWR limit</b> = GCWR − truck − trailer. <b>Trailer limit</b> = trailer GVWR − trailer empty. Your net cargo is the smaller of the two. Axle and tire ratings can lower it further — confirm on a scale.',
    related: [['trucking-operating-cost-per-mile', 'Cost Per Mile'], ['straight-truck-axle-weight-balancing', 'Axle Weight'], ['box-truck-delivery-fuel-margin-calc', 'Box Truck Margin']] },

  { slug: 'box-truck-delivery-fuel-margin-calc', type: 'num', tool_title: 'Box Truck Route Profit Margin Calculator', short: 'Box Truck Margin', role: 'Carriers & Expedited Haulers',
    meta: 'Free box-truck / final-mile route profit calculator after fuel, driver wage and tolls. On-device, from your own numbers.',
    h1: 'Is this final-mile route actually making money?',
    lede: 'Busy is not the same as profitable. Enter the route revenue and your real costs and see the net and margin before you take the contract. Runs on your device.',
    inputs: [{ id: 'rev', label: 'Route revenue ($)', def: '900' }, { id: 'miles', label: 'Route miles', def: '220' }, { id: 'mpg', label: 'Box truck MPG', def: '10' }, { id: 'diesel', label: 'Diesel ($ per gal)', def: '3.80' }, { id: 'wage', label: 'Driver wage for the route ($)', def: '180' }, { id: 'tolls', label: 'Tolls + parking ($)', def: '25' }, { id: 'other', label: 'Other ($)', def: '15' }],
    compute: `var rev=v('rev'),mi=v('miles'),mpg=v('mpg'),dz=v('diesel'),wg=v('wage'),to=v('tolls'),ot=v('other');var fuel=mpg>0?mi/mpg*dz:0;var cost=fuel+wg+to+ot;var net=rev-cost;var m=rev>0?net/rev*100:0;return [{big:1,n:money(net),l:'Net profit on the route'},{n:num(m,0)+'%',l:'Margin'},{n:money(fuel),l:'Fuel cost'},{n:money(cost),l:'Total cost'}];`,
    note: 'How it works: <b>Fuel</b> = miles ÷ MPG × diesel. <b>Net</b> = revenue − (fuel + wage + tolls + other). If the margin is thin, the stops or the deadhead between them are usually the culprit. Nothing you enter leaves your device.',
    related: [['trucking-operating-cost-per-mile', 'Cost Per Mile'], ['rate-per-mile-calculator', 'Rate / Mile Tools'], ['load-profitability-calculator', 'Load Profitability']] },

  { slug: 'step-deck-clearance-height-estimator', type: 'num', tool_title: 'Step Deck Load Height & Clearance Calculator', short: 'Step Deck Height', role: 'Carriers & Specialized Haulers',
    meta: 'Free step deck load height calculator — deck height plus cargo vs the legal cap. On-device. Do not clip a bridge.',
    h1: 'Will your step-deck load clear, or do you need a permit?',
    lede: 'Tall freight plus a legal height cap is how you clip a bridge. Enter your deck and cargo height and see your total loaded height and the clearance left. Runs on your device.',
    hint: 'US legal height is commonly 13\'6" (162 in); some lanes differ. Use your route\'s real cap.',
    inputs: [{ id: 'deck', label: 'Step deck lower-deck height (in)', def: '42' }, { id: 'cargo', label: 'Cargo height (in)', def: '100' }, { id: 'legal', label: 'Legal height cap (in)', def: '162' }],
    compute: `var d=v('deck'),c=v('cargo'),lg=v('legal');var tot=d+c;var cl=lg-tot;return [{big:1,n:ftin(tot)+' ('+num(tot,0)+' in)',l:'Total loaded height'},{n:ftin(cl),l:cl>=0?'Clearance under the cap':'OVER — oversize permit needed'},{n:ftin(lg),l:'Legal height cap'}];`,
    note: 'How it works: <b>Total height</b> = deck height + cargo height. If it exceeds your route cap you need an oversize/height permit and a routed path. Confirm the exact cap for every state on the lane. Nothing you enter leaves your device.',
    related: [['double-drop-removable-gooseneck-calc', 'RGN Capacity'], ['conestoga-trailer-clearance-estimator', 'Conestoga Clearance'], ['flatbed-oversize-tarping-estimator', 'Flatbed Tarping']] },

  { slug: 'conestoga-trailer-clearance-estimator', type: 'num', tool_title: 'Conestoga Interior Clearance Calculator', short: 'Conestoga Clearance', role: 'Carriers & Machinery Haulers',
    meta: 'Free Conestoga clearance calculator — check your load width and height fit under the rolling tarp before you load. On-device.',
    h1: 'Does the machine fit under the Conestoga tarp?',
    lede: 'A Conestoga protects the freight only if it actually fits. Enter the interior and the cargo size to confirm clearance before anything rolls onto the deck. Runs on your device.',
    inputs: [{ id: 'iw', label: 'Interior width (in)', def: '98' }, { id: 'ih', label: 'Interior usable height (in)', def: '102' }, { id: 'cw', label: 'Cargo width (in)', def: '96' }, { id: 'ch', label: 'Cargo height (in)', def: '96' }],
    compute: `var iw=v('iw'),ih=v('ih'),cw=v('cw'),ch=v('ch');var fit=(cw<=iw&&ch<=ih);return [{big:1,n:fit?'Fits':'Does NOT fit',l:'Cargo under the rolling tarp'},{n:num(iw-cw,1)+' in',l:'Width clearance'},{n:num(ih-ch,1)+' in',l:'Height clearance'}];`,
    note: 'How it works: the load fits only if cargo width ≤ interior width AND cargo height ≤ usable interior height. Leave margin for strapping, dunnage and the frame rails. Nothing you enter leaves your device.',
    related: [['step-deck-clearance-height-estimator', 'Step Deck Height'], ['double-drop-removable-gooseneck-calc', 'RGN Capacity'], ['dry-van-pallet-capacity-calculator', 'Pallet Capacity']] },

  { slug: 'double-drop-removable-gooseneck-calc', type: 'num', tool_title: 'RGN Double-Drop Load Capacity Calculator', short: 'RGN Capacity', role: 'Carriers & Heavy Haulers',
    meta: 'Free RGN double-drop calculator — cargo well length fit and weight headroom from your trailer ratings. On-device.',
    h1: 'Does the machine fit the RGN well — and your weight?',
    lede: 'Heavy haul lives and dies on the numbers. Enter your well length, weight rating and cargo and check the fit before you commit the machine. Runs on your device.',
    inputs: [{ id: 'well', label: 'Cargo well length (ft)', def: '29' }, { id: 'clen', label: 'Cargo length (ft)', def: '25' }, { id: 'cap', label: 'Trailer weight rating (lb)', def: '40000' }, { id: 'cwt', label: 'Cargo weight (lb)', def: '35000' }],
    compute: `var w=v('well'),cl=v('clen'),cap=v('cap'),cw=v('cwt');var fit=(cl<=w&&cw<=cap);return [{big:1,n:fit?'Fits the well':'Does NOT fit',l:'Length & weight check'},{n:num(w-cl,1)+' ft',l:'Well length clearance'},{n:num(cap-cw,0)+' lb',l:'Weight headroom'}];`,
    note: 'How it works: the load fits if cargo length ≤ well length AND cargo weight ≤ trailer rating. Over either and you are into multi-axle, permits and a routed heavy-haul plan. Confirm axle spacing for the bridge formula. Nothing you enter leaves your device.',
    related: [['step-deck-clearance-height-estimator', 'Step Deck Height'], ['straight-truck-axle-weight-balancing', 'Axle Weight'], ['conestoga-trailer-clearance-estimator', 'Conestoga Clearance']] },

  { slug: 'car-hauler-trailer-clearance-planner', type: 'num', tool_title: 'Multi-Car Hauler Deck & Clearance Planner', short: 'Car Hauler Deck', role: 'Carriers & Auto Transport Haulers',
    meta: 'Free multi-car hauler planner — deck feet left and roof-height clearance from your vehicle sizes. On-device.',
    h1: 'Will the vehicles fit your deck — without scraping a roof?',
    lede: 'Scrape one roof on the upper deck and the profit on the whole run is gone. Enter your deck length and vehicle sizes and check the fit before you load. Runs on your device.',
    inputs: [{ id: 'deck', label: 'Total usable deck length (ft)', def: '80' }, { id: 'veh', label: 'Total vehicle length to load (ft)', def: '72' }, { id: 'legal', label: 'Legal height cap (in)', def: '162' }, { id: 'tall', label: 'Tallest vehicle height loaded (in)', def: '80' }],
    compute: `var dk=v('deck'),vf=v('veh'),lg=v('legal'),th=v('tall');return [{big:1,n:num(dk-vf,1)+' ft',l:'Deck feet left after your vehicles'},{n:(th<=lg?'OK':'OVER'),l:'Tallest vs '+num(lg,0)+' in cap'},{n:num(lg-th,0)+' in',l:'Roof clearance under the cap'}];`,
    note: 'How it works: <b>deck feet left</b> = usable deck − total vehicle length; you also need positive <b>roof clearance</b> on the upper deck. Ramps and angles change real clearance, so leave margin. Nothing you enter leaves your device.',
    related: [['step-deck-clearance-height-estimator', 'Step Deck Height'], ['trucking-operating-cost-per-mile', 'Cost Per Mile'], ['rate-per-mile-calculator', 'Rate / Mile Tools']] },

  { slug: 'straight-truck-axle-weight-balancing', type: 'num', tool_title: 'Straight Truck Axle Weight Balancing Tool', short: 'Axle Weight', role: 'Carriers & Delivery Fleet Managers',
    meta: 'Free straight-truck axle balancing tool — estimate steer and drive axle loads from cargo placement vs your ratings. On-device.',
    h1: 'Balance the box before the scale writes the ticket',
    lede: 'Load it nose-heavy and the scale ticket writes itself. Enter your ratings and where the weight sits to estimate your steer and drive axle loads. Runs on your device.',
    hint: 'A simplified lever estimate: weight shifts to the axle it sits closest to. Always confirm on a certified scale.',
    inputs: [{ id: 'wb', label: 'Wheelbase steer-to-drive (in)', def: '240' }, { id: 'cw', label: 'Cargo weight (lb)', def: '10000' }, { id: 'd', label: 'Cargo center behind steer axle (in)', def: '120' }, { id: 'es', label: 'Empty steer axle (lb)', def: '7000' }, { id: 'ed', label: 'Empty drive axle (lb)', def: '5000' }, { id: 'sr', label: 'Steer axle rating (lb)', def: '12000' }, { id: 'dr', label: 'Drive axle rating (lb)', def: '17000' }],
    compute: `var wb=v('wb'),cw=v('cw'),d=v('d'),es=v('es'),ed=v('ed'),sr=v('sr'),dr=v('dr');var da=wb>0?cw*(d/wb):0;var sa=cw-da;var st=es+sa,dt=ed+da;return [{big:1,n:num(st,0)+' / '+num(dt,0)+' lb',l:'Steer / drive axle, loaded'},{n:(st<=sr?'OK':'OVER'),l:'Steer vs '+num(sr,0)+' rating'},{n:(dt<=dr?'OK':'OVER'),l:'Drive vs '+num(dr,0)+' rating'}];`,
    note: 'How it works: a simple lever model puts more of the load on the axle the cargo sits closer to (fraction = distance behind steer ÷ wheelbase). Real distribution depends on the load shape and overhang — this is a planning estimate; <b>confirm on a scale</b>. Nothing you enter leaves your device.',
    related: [['hot-shot-trucking-payload-calculator', 'Hot Shot Payload'], ['dry-van-pallet-capacity-calculator', 'Pallet Capacity'], ['box-truck-delivery-fuel-margin-calc', 'Box Truck Margin']] },

  { slug: 'freight-demurrage-port-storage-tracker', type: 'num', tool_title: 'Ocean Container Demurrage & Storage Calculator', short: 'Demurrage', role: 'Shippers & Importers',
    meta: 'Free container demurrage calculator — exposure once you pass the line free days. On-device; you enter the free days and per-diem.',
    h1: 'Put a number on the demurrage before the bill lands',
    lede: 'Free time at the terminal runs out faster than you think, then the charges compound daily. Enter your free days, days out and the line per-diem to see your exposure. Runs on your device.',
    inputs: [{ id: 'free', label: 'Free days allowed', def: '4' }, { id: 'out', label: 'Days until container returned / picked up', def: '9' }, { id: 'perdiem', label: 'Line per-diem ($ per day)', def: '150' }],
    compute: `var fr=v('free'),ot=v('out'),pd=v('perdiem');var ch=Math.max(0,ot-fr);return [{big:1,n:money(ch*pd),l:'Demurrage exposure'},{n:num(ch,0)+' days',l:'Chargeable days over free time'},{n:money(pd)+' /day',l:'Per-diem you entered'}];`,
    note: 'How it works: <b>chargeable days</b> = days out − free days (never below zero), × your line per-diem. Many lines <b>tier</b> the per-diem (it rises after the first few days) — if yours does, run each tier separately. Nothing you enter leaves your device.',
    related: [['intermodal-drayage-chassis-split-calc', 'Drayage Split'], ['air-cargo-chargeable-weight-calculator', 'Air Chargeable Weight'], ['freight-forwarder-customs-duty-estimator', 'Landed Cost']] },

  { slug: 'ltl-minimum-charge-floor-calculator', type: 'num', tool_title: 'LTL Minimum Charge (AMC) Floor Checker', short: 'LTL Minimum Charge', role: 'Shippers & Logistics Managers',
    meta: 'Free LTL minimum charge checker — see whether your class-rate charge beats the carrier absolute minimum. On-device; you enter the AMC.',
    h1: 'Is your little LTL shipment paying the carrier minimum?',
    lede: 'Small shipments often bill at the carrier floor no matter how light they are. Enter your class-rate charge and the carrier absolute minimum and see which one you actually pay. Runs on your device.',
    inputs: [{ id: 'computed', label: 'Your class-rate charge ($)', def: '85' }, { id: 'amc', label: 'Carrier absolute minimum charge ($)', def: '120' }],
    compute: `var c=v('computed'),a=v('amc');var pay=Math.max(c,a);return [{big:1,n:money(pay),l:'What you actually pay'},{n:money(c),l:'Your class-rate charge'},{n:money(a),l:'Carrier minimum (AMC)'},{n:(a>c?'Minimum applies':'Rate applies'),l:'Which one wins'}];`,
    note: 'How it works: carriers bill the <b>greater</b> of your calculated charge and their absolute minimum. If the minimum wins, consolidating with another shipment or going partial may be cheaper per pound. Use your carrier\'s real AMC. Nothing you enter leaves your device.',
    related: [['ltl-freight-class-calculator', 'LTL Freight Class'], ['trailer-linear-feet-calculator', 'Linear Feet'], ['ltl-vs-truckload-decision-tool', 'LTL vs Truckload']] },

  { slug: 'flatbed-oversize-tarping-estimator', type: 'num', tool_title: 'Flatbed Tarping Coverage Estimator', short: 'Flatbed Tarping', role: 'Carriers & Owner-Operators',
    meta: 'Free flatbed tarping coverage estimator — size the tarp area your load needs by dimension. On-device; you add the tarp pay you negotiate.',
    h1: 'Size the tarp job before you drop the chains',
    lede: 'Tarping is labor you should get paid for. Enter your load dimensions to size the coverage you must tarp, then hold the broker to a tarp fee you agree on. Runs on your device.',
    hint: 'Enter load dimensions in feet. There is no universal "standard" tarp fee — negotiate it per load.',
    inputs: [{ id: 'L', label: 'Load length (ft)', def: '40' }, { id: 'W', label: 'Load width (ft)', def: '8.5' }, { id: 'H', label: 'Load height (ft)', def: '8' }],
    compute: `var L=v('L'),W=v('W'),H=v('H');var area=L*W+2*(L*H)+2*(W*H);return [{big:1,n:num(area,0)+' sq ft',l:'Tarp coverage to fully enclose'},{n:num(L*W,0)+' sq ft',l:'Top'},{n:num(2*(L*H)+2*(W*H),0)+' sq ft',l:'Sides + ends'}];`,
    note: 'How it works: coverage ≈ top (L×W) + two sides (2×L×H) + two ends (2×W×H). It tells you the tarp size and the labor involved — the <b>fee is negotiated per load</b>, not a fixed market number, so settle it in writing on the rate con.',
    related: [['step-deck-clearance-height-estimator', 'Step Deck Height'], ['rate-con-setoff-clause-checker', 'Rate Con Checker'], ['trucking-operating-cost-per-mile', 'Cost Per Mile']] },

  { slug: 'intermodal-drayage-chassis-split-calc', type: 'num', tool_title: 'Intermodal Drayage & Chassis Split Calculator', short: 'Drayage Split', role: 'Shippers & Intermodal Carriers',
    meta: 'Free drayage cost calculator — total a container move with a chassis split, per-diem and prepull. On-device; you enter your terminal rates.',
    h1: 'Total the real drayage cost, split and all',
    lede: 'A container move is rarely just the base rate — the chassis, the split trip and the per-diem stack up. Enter the rates your terminal charges and the tool totals it. Runs on your device.',
    inputs: [{ id: 'base', label: 'Base drayage ($)', def: '350' }, { id: 'split', label: 'Chassis split fee ($)', def: '75' }, { id: 'perdiem', label: 'Chassis per-diem ($ per day)', def: '35' }, { id: 'days', label: 'Chassis days', def: '3' }, { id: 'prepull', label: 'Prepull / drop ($)', def: '125' }, { id: 'congestion', label: 'Congestion / other ($)', def: '0' }],
    compute: `var b=v('base'),s=v('split'),pd=v('perdiem'),dy=v('days'),pp=v('prepull'),cg=v('congestion');var t=b+s+pd*dy+pp+cg;return [{big:1,n:money(t),l:'Total drayage cost (your rates)'},{n:money(pd*dy),l:'Chassis per-diem × '+num(dy,0)+' days'},{n:money(s+pp+cg),l:'Split + prepull + other'}];`,
    note: 'How it works: it simply totals the rates you enter — base + split + (per-diem × days) + prepull + other. Drayage accessorials vary by port and provider, so there is no "standard" to assume; use your own quote. Nothing you enter leaves your device.',
    related: [['freight-demurrage-port-storage-tracker', 'Demurrage'], ['freight-forwarder-customs-duty-estimator', 'Landed Cost'], ['air-cargo-chargeable-weight-calculator', 'Air Chargeable Weight']] },

  { slug: 'freight-forwarder-customs-duty-estimator', type: 'num', tool_title: 'Import Landed Cost & Customs Duty Calculator', short: 'Landed Cost', role: 'Shippers & Importers',
    meta: 'Free import landed cost calculator — goods value, freight and the HTS duty rate you look up. On-device; you supply the tariff rate.',
    h1: 'See the real landed cost, duty included',
    lede: 'A cheap unit price gets expensive once duty and freight land on it. Enter your values and the HTS duty rate you look up and the tool totals the landed cost. Runs on your device.',
    hint: 'Look up your product\'s duty rate in the official HTS — this tool will not guess a tariff code for you.',
    inputs: [{ id: 'value', label: 'Goods value / customs value ($)', def: '10000' }, { id: 'freight', label: 'Ocean / air freight ($)', def: '1800' }, { id: 'ins', label: 'Insurance ($)', def: '150' }, { id: 'duty', label: 'Duty rate you looked up (%)', def: '5' }, { id: 'other', label: 'Other port fees (%)', def: '0.5' }],
    compute: `var val=v('value'),fr=v('freight'),ins=v('ins'),dr=v('duty'),of=v('other');var duty=val*dr/100;var fees=val*of/100;var landed=val+fr+ins+duty+fees;return [{big:1,n:money(landed),l:'Estimated landed cost'},{n:money(duty),l:'Duty ('+num(dr,2)+'% you entered)'},{n:money(fees),l:'Other port fees'}];`,
    note: 'How it works: <b>landed</b> = goods value + freight + insurance + duty + other fees. Duty = value × the HTS rate <b>you supply</b> (it is product-specific; look it up officially). Some fees (MPF/HMF) have caps — treat this as an estimate. Nothing you enter leaves your device.',
    related: [['freight-demurrage-port-storage-tracker', 'Demurrage'], ['intermodal-drayage-chassis-split-calc', 'Drayage Split'], ['air-cargo-chargeable-weight-calculator', 'Air Chargeable Weight']] },

  { slug: 'hazmat-freight-insurance-surcharge-calc', type: 'num', tool_title: 'HAZMAT Freight Cost & Surcharge Calculator', short: 'HAZMAT Cost', role: 'Carriers & Shippers',
    meta: 'Free HAZMAT lane-cost calculator — roll your own hazmat premium and compliance costs into a lane rate. On-device; no invented standard surcharge.',
    h1: 'Price the hazmat load on your real costs',
    lede: 'Regulated freight carries real extra cost, but there is no universal hazmat surcharge to quote. Enter your own premium and compliance costs and roll them into the lane. Runs on your device.',
    inputs: [{ id: 'base', label: 'Base lane rate ($)', def: '1800' }, { id: 'premium', label: 'Your hazmat insurance premium for the load ($)', def: '120' }, { id: 'permit', label: 'Permits / fees ($)', def: '40' }, { id: 'handling', label: 'Placarding / handling ($)', def: '60' }],
    compute: `var b=v('base'),pr=v('premium'),pm=v('permit'),hd=v('handling');var add=pr+pm+hd;return [{big:1,n:money(b+add),l:'Lane rate with your hazmat costs'},{n:money(add),l:'Added hazmat cost'},{n:money(pr),l:'Your insurance premium'}];`,
    note: 'How it works: it adds <b>your</b> premium, permit and handling costs to the base rate — there is no standard hazmat surcharge percentage, so enter your real figures. Carrying hazmat also requires the right endorsements and placarding; this tool only prices cost. Nothing you enter leaves your device.',
    related: [['trucking-operating-cost-per-mile', 'Cost Per Mile'], ['rate-con-setoff-clause-checker', 'Rate Con Checker'], ['rate-per-mile-calculator', 'Rate / Mile Tools']] },

  { slug: 'broker-bond-claim-viability-checker', type: 'checklist', tool_title: 'BMC-84 Freight Broker Bond Claim Checklist', short: 'Bond Claim Checklist', role: 'Carriers & Owner-Operators',
    meta: 'Free BMC-84 broker bond claim checklist — see whether your unpaid freight is a candidate and what to document. Guidance, not legal advice.',
    h1: 'Is your unpaid freight a bond-claim candidate?',
    lede: 'If a broker goes dark on your pay, the clock on their BMC-84 bond is already running. Check the boxes you can honestly tick to gauge where you stand. This is guidance, not legal advice.',
    calcH: 'Readiness checklist',
    hint: 'Tick each item that is true for your situation.',
    items: [
      'The broker held active operating authority and a BMC-84 bond on the load date',
      'Your invoice is past due (commonly 30+ days) with no valid dispute from the broker',
      'You have the signed rate confirmation for the load',
      'You have a signed proof of delivery (POD)',
      'You have sent a written demand for payment and kept a copy',
      'The broker is unresponsive, insolvent, or its authority has been revoked',
    ],
    note: 'A BMC-84 bond is typically $75,000 and is shared across <b>all</b> claimants, so filing promptly and completely matters. Deadlines and procedures vary — this checklist is organizational guidance, <b>not legal advice</b>; confirm with the surety and, where needed, an attorney.',
    ctaUrl: `${ORIGIN}/tools/verify-freight-broker-authority-bond/`, ctaLabel: 'Verify the broker', ctaH: 'Next time, vet the broker first.', ctaP: 'Check a broker\'s authority, bond and pay history before you haul — it is far cheaper than chasing a bond claim.',
    disclose: 'Guidance only — not legal advice. Bond-claim rules and deadlines vary by surety and situation; confirm before relying on this.',
    related: [['verify-freight-broker-authority-bond', 'Verify a Broker'], ['broker-days-to-pay-checklist', 'Days-to-Pay Check'], ['broker-short-pay-audit-tool', 'Short-Pay Audit']] },
];

let n = 0;
for (const s of SPECS) {
  const dir = join(root, 'tools', s.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), (s.type === 'checklist' ? checklistPage(s) : numericPage(s)) + '\n');
  n++;
}
console.log(`Built ${n} wave-2 calculator pages.`);
