// Screenshots of the fullscreen layout at a given viewport: title, town, talk, interior.
const { chromium } = require('playwright');
const [OUT, W = '390', H = '844', TAG = 'p'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${TAG}-1title.png` });
  await p.evaluate(() => {
    const S = __SH.newState('Aki'); S.time = 600; S.day = 1;
    S.girls.aqua.met = true;
    __SH.state = S; __SH.initNPCs();
    const n = __SH.npcs.aqua; S.inside = null; S.px = n.x + 20; S.py = n.y + 10; __SH.enterWorld();
  });
  await p.waitForTimeout(400);
  // drag the joystick a bit
  const box = { x: +W * 0.3, y: +H * 0.6 };
  await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.move(box.x - 30, box.y + 5, { steps: 4 });
  await p.waitForTimeout(250);
  await p.screenshot({ path: `${OUT}/${TAG}-2town.png` });
  await p.mouse.up();
  await p.evaluate(() => __SH.girlMenu('aqua'));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${TAG}-3talk.png` });
  await p.click('.btn:has-text("Goodbye")');
  await p.evaluate(() => __SH.enterRoom('cafe'));
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${TAG}-4interior.png` });
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
