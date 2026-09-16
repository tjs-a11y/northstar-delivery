export function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDateLong(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const STYLE = `
  :root{
    --nsnn-navy:#0b1520;
    --nsnn-navy-2:#101f2e;
    --nsnn-line:#1c2c3d;
    --nsnn-blue:#3d8bfd;
    --nsnn-amber:#f2994a;
    --nsnn-paper:#eef2f6;
    --nsnn-paper-dim:#9aa9ba;
  }
  *{box-sizing:border-box;}
  body.nsnn{
    margin:0;
    background:var(--nsnn-navy);
    color:var(--nsnn-paper);
    font-family:'Public Sans', sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .nsnn h1,.nsnn h2,.nsnn h3{
    font-family:'Oswald', sans-serif;
    text-transform:uppercase;
    letter-spacing:0.02em;
    margin:0;
  }
  .nsnn a{color:inherit;}
  .nsnn .wrap{max-width:920px; margin:0 auto; padding:0 24px;}
  .nsnn header{
    position:sticky; top:0; z-index:50;
    background:rgba(11,21,32,0.94);
    backdrop-filter:blur(8px);
    border-bottom:1px solid var(--nsnn-line);
  }
  .nsnn nav.wrap{display:flex; align-items:center; justify-content:space-between; height:70px;}
  .nsnn .logo{display:flex; align-items:center; gap:10px; text-decoration:none; font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; letter-spacing:0.04em;}
  .nsnn .logo .mark{
    width:32px; height:32px; border:2px solid var(--nsnn-blue); border-radius:50%;
    display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:var(--nsnn-blue);
  }
  .nsnn .logo .sub{display:block; font-family:'Public Sans',sans-serif; font-size:9px; letter-spacing:0.14em; color:var(--nsnn-paper-dim); text-transform:uppercase; font-weight:600;}
  .nsnn nav ul{list-style:none; display:flex; gap:26px; margin:0; padding:0;}
  .nsnn nav ul a{font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; text-decoration:none; color:var(--nsnn-paper-dim);}
  .nsnn nav ul a:hover{color:var(--nsnn-blue);}

  .nsnn .ticker{
    border-bottom:1px solid var(--nsnn-line);
    background:var(--nsnn-navy-2);
    overflow:hidden;
    white-space:nowrap;
    position:relative;
  }
  .nsnn .ticker-track{
    display:inline-block;
    padding:9px 0;
    font-family:'IBM Plex Mono', monospace;
    font-size:12px;
    letter-spacing:0.04em;
    color:var(--nsnn-amber);
    animation:nsnn-scroll 32s linear infinite;
  }
  .nsnn .ticker-track span{padding:0 28px; color:var(--nsnn-paper-dim);}
  .nsnn .ticker-track span.hl{color:var(--nsnn-blue); font-weight:600;}
  @keyframes nsnn-scroll{
    0%{transform:translateX(0);}
    100%{transform:translateX(-50%);}
  }
  @media (prefers-reduced-motion: reduce){
    .nsnn .ticker-track{animation:none;}
  }

  .nsnn .page-head{padding:48px 0 8px;}
  .nsnn .eyebrow{
    display:inline-flex; align-items:center; gap:9px;
    font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase;
    color:var(--nsnn-blue); margin-bottom:14px;
  }
  .nsnn .eyebrow::before{content:''; width:22px; height:2px; background:var(--nsnn-blue);}
  .nsnn .page-head h1{font-size:clamp(26px,4vw,38px); line-height:1.1;}
  .nsnn .page-head p.lede{color:var(--nsnn-paper-dim); font-size:15px; line-height:1.6; margin:14px 0 0; max-width:600px;}

  .nsnn .brief{
    background:var(--nsnn-navy-2);
    border:1px solid var(--nsnn-line);
    border-radius:4px;
    padding:26px 28px;
    margin:22px 0;
  }
  .nsnn .brief .date{
    font-family:'IBM Plex Mono', monospace;
    font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--nsnn-blue);
  }
  .nsnn .brief h2{font-size:20px; margin:8px 0 14px; line-height:1.25;}
  .nsnn .brief .script{font-size:15px; line-height:1.7; color:var(--nsnn-paper); white-space:pre-line;}
  .nsnn .brief .sources{margin-top:18px; padding-top:14px; border-top:1px dashed var(--nsnn-line);}
  .nsnn .brief .sources .k{font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:var(--nsnn-paper-dim); font-weight:700; display:block; margin-bottom:8px;}
  .nsnn .brief .sources ul{list-style:none; margin:0; padding:0; display:grid; gap:6px;}
  .nsnn .brief .sources li{font-size:13px;}
  .nsnn .brief .sources a{color:var(--nsnn-paper-dim); text-decoration:none;}
  .nsnn .brief .sources a:hover{color:var(--nsnn-blue);}
  .nsnn .brief .sources .src-tag{color:var(--nsnn-amber); font-family:'IBM Plex Mono',monospace; font-size:11px; margin-right:6px;}

  .nsnn .archive-link{margin:36px 0 60px; text-align:center;}
  .nsnn .archive-link a{
    display:inline-block; padding:11px 22px; border:1.5px solid var(--nsnn-paper-dim); border-radius:2px;
    font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; text-decoration:none;
  }
  .nsnn .archive-link a:hover{border-color:var(--nsnn-blue); color:var(--nsnn-blue);}

  .nsnn .empty{color:var(--nsnn-paper-dim); font-size:15px; padding:40px 0 80px;}

  .nsnn .partners{padding:20px 0 44px;}
  .nsnn .partners-head{max-width:560px; margin:0 0 26px;}
  .nsnn .partners-head h2{font-size:clamp(20px,2.6vw,28px); line-height:1.15; margin:10px 0 0;}
  .nsnn .partners-grid{
    display:grid;
    grid-template-columns:repeat(3, 1fr);
    gap:14px;
  }
  .nsnn .partner-card{
    display:flex; flex-direction:column; gap:8px;
    background:var(--nsnn-navy-2);
    border:1px solid var(--nsnn-line);
    border-radius:4px;
    padding:20px 20px 18px;
    text-decoration:none;
    color:var(--nsnn-paper);
    transition:border-color 0.2s ease, transform 0.2s ease;
  }
  .nsnn .partner-card:hover{border-color:var(--nsnn-blue); transform:translateY(-2px);}
  .nsnn .partner-card .partner-tag{
    font-family:'IBM Plex Mono', monospace; font-size:10px; font-weight:600;
    letter-spacing:0.08em; color:var(--nsnn-amber);
  }
  .nsnn .partner-card h3{font-size:16px; margin:2px 0 0;}
  .nsnn .partner-card p{font-size:13px; line-height:1.55; color:var(--nsnn-paper-dim); margin:0; flex-grow:1;}
  .nsnn .partner-card .partner-cta{font-size:12px; font-weight:700; letter-spacing:0.04em; color:var(--nsnn-blue);}
  .nsnn .partners-disclosure{font-size:11px; color:var(--nsnn-paper-dim); line-height:1.6; margin:16px 0 0;}

  .nsnn footer{padding:36px 0 50px; border-top:1px solid var(--nsnn-line); margin-top:0;}
  .nsnn footer .bottom{font-size:12px; color:var(--nsnn-paper-dim);}

  @media (max-width: 700px){
    .nsnn .partners-grid{grid-template-columns:1fr;}
  }
`;

// Placeholder affiliate links — swap each "#affiliate-link-*" for the real tracked
// affiliate URL before launch. Kept as data so both the web page and the newsletter
// email render the same copy from one place.
export const PARTNERS = [
  {
    tag: 'FACTORING',
    name: 'Summar Financial',
    blurb: 'Freight factoring built for owner-operators — get paid on your terms, not the shipper’s.',
    href: '#affiliate-link-summar-financial',
  },
  {
    tag: 'DISPATCH & TMS',
    name: 'Trucking365 TMS',
    blurb: 'Dispatch, invoicing, and load tracking in one system built for small carriers.',
    href: '#affiliate-link-trucking365-tms',
  },
  {
    tag: 'FUEL CARD',
    name: 'RTS Fuel Card',
    blurb: 'Discounted fuel pricing and one card across major truck stop networks nationwide.',
    href: '#affiliate-link-rts-fuel-card',
  },
];

function ticker(entries) {
  const latest = entries[0];
  const dieselPart = latest?.dieselPrice
    ? `Diesel (EIA weekly avg): $${Number(latest.dieselPrice.dollarsPerGallon).toFixed(3)}/gal`
    : 'Diesel price data pending';
  const headlinePart = latest?.topHeadline ? latest.topHeadline : 'Freight news brief updates daily';
  const items = [
    '<span>NSNN — NorthStar News Network</span>',
    `<span>${escapeHtml(dieselPart)}</span>`,
    `<span class="hl">${escapeHtml(headlinePart)}</span>`,
  ];
  const track = items.join('') + items.join('');
  return `<div class="ticker"><div class="ticker-track">${track}</div></div>`;
}

function navHeader(active) {
  const link = (href, label, key) =>
    `<li><a href="${href}"${active === key ? ' class="active"' : ''}>${label}</a></li>`;
  return `
<header>
  <nav class="wrap">
    <a href="index.html" class="logo">
      <span class="mark">N</span>
      <span>NSNN<span class="sub">NorthStar News Network</span></span>
    </a>
    <ul>
      ${link('index.html', 'Today', 'today')}
      ${link('archive.html', 'Archive', 'archive')}
      ${link('../index.html', 'Main Site', 'main')}
    </ul>
  </nav>
</header>`;
}

function partnersSection() {
  const cards = PARTNERS.map(
    (p) => `
    <a class="partner-card" href="${escapeHtml(p.href)}" target="_blank" rel="noopener sponsored">
      <span class="partner-tag">${escapeHtml(p.tag)}</span>
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.blurb)}</p>
      <span class="partner-cta">Learn More →</span>
    </a>`
  ).join('');

  return `
<section class="wrap partners">
  <div class="partners-head">
    <span class="eyebrow">Recommended Partners</span>
    <h2>Tools our carriers actually use.</h2>
  </div>
  <div class="partners-grid">${cards}
  </div>
  <p class="partners-disclosure">NorthStar Delivery Solutions may earn a commission if you sign up through these links, at no extra cost to you. (Links above are placeholders — swap in the real affiliate URLs before this goes live.)</p>
</section>`;
}

function footer() {
  return `
${partnersSection()}
<footer>
  <div class="wrap">
    <div class="bottom">© 2026 NorthStar Delivery Solutions LLC. NSNN is an independent NorthStar Delivery Solutions production, not affiliated with any broadcast news network.</div>
  </div>
</footer>`;
}

function briefBlock(entry) {
  const sourcesList = (entry.sources || [])
    .map(
      (s) =>
        `<li><span class="src-tag">${escapeHtml(s.source || '')}</span><a href="${escapeHtml(s.link || '#')}" target="_blank" rel="noopener">${escapeHtml(s.title || '')}</a></li>`
    )
    .join('');
  return `
<div class="brief">
  <span class="date">${escapeHtml(formatDateLong(entry.date))}</span>
  <h2>${escapeHtml(entry.subject || 'NSNN Daily Freight Brief')}</h2>
  <div class="script">${escapeHtml(entry.script || '')}</div>
  ${sourcesList ? `<div class="sources"><span class="k">Sources referenced</span><ul>${sourcesList}</ul></div>` : ''}
</div>`;
}

function pageShell({ title, description, active, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body class="nsnn">
${body}
</body>
</html>
`;
}

export function renderIndexPage(entries, recentCount) {
  const recent = entries.slice(0, recentCount);
  const hasArchive = entries.length > recentCount;

  const body = `
${navHeader('today')}
${ticker(entries)}
<section class="wrap">
  <div class="page-head">
    <span class="eyebrow">Daily Freight Brief</span>
    <h1>NSNN — NorthStar News Network</h1>
    <p class="lede">A short, original daily read on freight rates, diesel prices, and the news moving your lanes — written for owner-operators and dispatchers, not read off the wire.</p>
  </div>
  ${
    recent.length
      ? recent.map(briefBlock).join('\n')
      : '<p class="empty">The first NSNN brief hasn\'t published yet — check back soon.</p>'
  }
  ${hasArchive ? '<div class="archive-link"><a href="archive.html">View Full Archive →</a></div>' : ''}
</section>
${footer()}`;

  return pageShell({
    title: 'NSNN — NorthStar News Network | Daily Freight Brief',
    description: 'NSNN (NorthStar News Network) — a daily, original freight industry brief from NorthStar Delivery Solutions LLC covering rates, diesel prices, and trade news.',
    active: 'today',
    body,
  });
}

export function renderArchivePage(entries, recentCount) {
  const archived = entries.slice(recentCount);

  const body = `
${navHeader('archive')}
<section class="wrap">
  <div class="page-head">
    <span class="eyebrow">NSNN Archive</span>
    <h1>Past Briefs</h1>
    <p class="lede">Every previous NSNN daily brief, newest first.</p>
  </div>
  ${
    archived.length
      ? archived.map(briefBlock).join('\n')
      : '<p class="empty">Nothing archived yet — recent briefs live on the <a href="index.html" style="color:var(--nsnn-blue);">Today</a> page until they roll off.</p>'
  }
</section>
${footer()}`;

  return pageShell({
    title: 'NSNN Archive — NorthStar News Network',
    description: 'Archive of past NSNN daily freight briefs from NorthStar Delivery Solutions LLC.',
    active: 'archive',
    body,
  });
}
