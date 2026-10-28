// Screenshots of the new girls in their new places.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const shot = async (name, o) => {
    await p.evaluate((o) => {
      const S = __SH.newState('Aki'); S.day = o.day || 3; S.time = o.time; S.weather = o.weather || 'sunny';
      for (const g of Object.values(S.girls)) g.met = true;
      __SH.state = S; __SH.initNPCs();
      if (o.room) __SH.enterRoom(o.room); else { S.inside = null; S.px = o.x * 16 + 8; S.py = o.y * 16 + 12; __SH.enterWorld(); }
    }, o);
    await p.waitForTimeout(o.wait || 1500);
    await p.screenshot({ path: `${OUT}/${name}.png` });
    console.log(name, await p.evaluate(() => Object.entries(__SH.npcs).map(([k, n]) => k + ':' + (n.inside || n.goal)).join(' ')));
  };
  await shot('n1-maidcafe', { room: 'maidcafe', time: 600 });
  await shot('n2-flowers', { x: 62, y: 26, time: 760 });
  await shot('n3-cape', { x: 68, y: 34, time: 1000 });
  await shot('n4-clock', { room: 'clocktower', time: 1000 });
  await p.evaluate(() => { __SH.state = null; });
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
