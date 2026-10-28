const { chromium } = require('playwright');
const [OUT, TIME = '1290', X = '24', Y = '17'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  p.on('pageerror', (e) => console.log('err', e.message));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet');
  await p.waitForTimeout(400);
  await p.evaluate(([t, x, y]) => {
    const S = __SH.newState('Aki'); S.time = +t; S.day = 6;
    for (const g of Object.values(S.girls)) g.met = true;
    __SH.state = S; __SH.initNPCs(); S.inside = null; S.px = x * 16 + 8; S.py = y * 16 + 12; __SH.enterWorld();
  }, [TIME, X, Y]);
  await p.waitForTimeout(3000);
  await p.screenshot({ path: OUT + '/n1.png', clip: { x: 0, y: 0, width: 390, height: 360 } });
  await p.keyboard.press('m');
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/n2-map.png' });
  await b.close();
})();
