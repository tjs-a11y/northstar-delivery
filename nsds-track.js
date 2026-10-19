// Anonymous outbound-click counter. Counts how many visitors click a partner (Freight Sidekick)
// link, so we can measure the marketing push. It sends ONE fixed, anonymous ping per click —
// no name, email, IP, page URL or anything visitor-specific — to our own counter at
// quickwell.app/api/event, which only increments a number. It never blocks or delays the click.
(function () {
  var ENDPOINT = 'https://quickwell.app/api/event';
  var PAYLOAD = JSON.stringify({ tool: 'northstar', event: 'outbound', target: 'freightsidekick' });

  function ping() {
    try {
      // Blob is text/plain so the request is "simple" (no CORS preflight); the server parses it as JSON.
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([PAYLOAD], { type: 'text/plain' }));
      } else {
        fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'content-type': 'text/plain' }, body: PAYLOAD }).catch(function () {});
      }
    } catch (e) { /* measurement must never break the page */ }
  }

  function wire() {
    try {
      var links = document.querySelectorAll('a[href*="freightsidekick.com"]');
      for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', ping, { passive: true });
        // Middle-click / open-in-new-tab
        links[i].addEventListener('auxclick', function (e) { if (e && e.button === 1) ping(); }, { passive: true });
      }
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
