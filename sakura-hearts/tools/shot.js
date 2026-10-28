const { chromium } = require('playwright');
(async () => {
  const [url, out, w, h] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w || 960, height: +h || 640 } });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto(url);
  await p.waitForTimeout(500);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
