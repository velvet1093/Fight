// The full house: kitchen, shower, bath and sofa nap play as animations,
// and the furniture prompts work.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(6000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const adv = async () => { for (let i = 0; i < 60; i++) { await p.waitForTimeout(80); if (await p.isVisible('#world-ui')) return; if ((await p.$$('#menu .btn')).length && !(await p.$('#next.show'))) return; await p.click('#dialog', { timeout: 300 }).catch(() => {}); } };
  await p.evaluate(() => { const S = __SH.newState('Aki'); S.day = 2; S.time = 600; S.energy = 50; __SH.state = S; __SH.initNPCs(); __SH.enterRoom('home'); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/h0-home.png' });
  for (const [id, ms] of [['cook', 1200], ['shower', 1200], ['homebath', 1200], ['rest', 1200]]) {
    p.evaluate((id) => __SH.runActivity(DATA.ACTIVITIES.home.find((a) => a.id === id)), id);
    await p.waitForFunction(() => __SH.cut && __SH.cut.arrived !== null, null, { timeout: 8000 });
    await p.waitForTimeout(ms);
    await p.screenshot({ path: `${OUT}/h-${id}.png` });
    await adv();
    console.log(id, '→', JSON.stringify(await p.evaluate(() => ({ mode: __SH.mode, x: __SH.state.px, y: __SH.state.py, energy: __SH.state.energy, charm: __SH.state.stats.charm, time: __SH.state.time }))));
  }
  // prompts on the new furniture
  const labels = [];
  for (const [tx, ty, dir] of [[15, 3, 'up'], [14, 9, 'up'], [16, 10, 'up'], [13, 9, 'down'], [15, 9, 'up'], [3, 3, 'up']]) {
    await p.evaluate(([tx, ty, dir]) => { const S = __SH.state; S.px = tx * 16 + 8; S.py = ty * 16 + 12; S.dir = dir; }, [tx, ty, dir]);
    await p.waitForTimeout(700);
    labels.push((await p.textContent('#prompt')).trim());
  }
  console.log('prompts:', labels);
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
