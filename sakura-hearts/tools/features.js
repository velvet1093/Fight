// Exercise the newer features and screenshot them: interiors, furniture,
// weather, interactions, walking together and morning texts.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const adv = async () => { for (let i = 0; i < 40; i++) { await p.waitForTimeout(70); if (await p.isVisible('#world-ui')) return; if ((await p.$$('#menu .btn')).length && !(await p.$('#next.show'))) return; await p.click('#dialog', { timeout: 500 }).catch(() => {}); } };
  const setup = (opts) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = o.day || 3; S.time = o.time || 600; S.weather = o.weather || 'sunny'; S.money = 300;
    for (const [id, aff] of Object.entries(o.aff || {})) { Object.assign(S.girls[id], { met: true, aff, dates: 3 }); S.daily['enc_' + id] = true; } // no random run-ins mid-test
    __SH.state = S; __SH.initNPCs();
    if (o.room) __SH.enterRoom(o.room); else { S.inside = null; S.px = o.x * 16 + 8; S.py = o.y * 16 + 12; __SH.enterWorld(); }
  }, opts);

  // 1. café with Nami behind the counter
  await setup({ room: 'cafe', aff: { nami: 70 } });
  await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/f1-cafe.png' });
  // walk up to the counter (away from Nami) and use it
  await p.evaluate(() => { const S = __SH.state; S.px = 5 * 16 + 8; S.py = 4 * 16 + 12; S.dir = 'up'; });
  await p.waitForTimeout(200);
  console.log('prompt at counter:', (await p.textContent('#prompt')).trim());
  await p.keyboard.press('e'); await p.waitForTimeout(700);
  console.log('counter options:', await p.$$eval('#menu .btn .lbl', (els) => els.map((e) => e.textContent)));
  await p.click('.btn:has-text("Never mind")');
  // 2. talk to Nami across the counter, open Interact
  await p.evaluate(() => { const S = __SH.state; const r = __SH.npcs.nami.room; S.px = r.x; S.py = 4 * 16 + 12; S.dir = 'up'; });
  await p.waitForTimeout(200);
  console.log('prompt at Nami:', (await p.textContent('#prompt')).trim());
  await p.keyboard.press('e'); await adv();
  await p.click('.btn:has-text("Interact")'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/f2-interact.png' });
  console.log('interactions:', await p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim())));
  await p.click('.btn:has-text("Hold hands")'); await adv();
  console.log('nami aff after hold hands:', await p.evaluate(() => __SH.state.girls.nami.aff));
  await p.click('.btn:has-text("Goodbye")');

  // 3. storm in the plaza, 4. blossom at the park
  await setup({ x: 24, y: 19, weather: 'storm', time: 700 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/f3-storm.png' });
  console.log('storm goals:', await p.evaluate(() => Object.fromEntries(Object.entries(__SH.npcs).map(([k, n]) => [k, n.goal]))));
  await setup({ x: 20, y: 25, weather: 'blossom', time: 840 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/f4-blossom.png' });
  console.log('blossom goals:', await p.evaluate(() => Object.fromEntries(Object.entries(__SH.npcs).map(([k, n]) => [k, n.goal]))));

  // 5. walk together with Aqua at the shrine, then walk south
  await setup({ x: 24, y: 7, time: 700, aff: { aqua: 40 } });
  await p.evaluate(() => { const n = __SH.npcs.aqua; n.path = []; n.idle = 99; const S = __SH.state; S.px = n.x; S.py = n.y + 14; S.dir = 'up'; });
  await p.waitForTimeout(150);
  await p.keyboard.press('e'); await adv();
  await p.click('.btn:has-text("Walk together")'); await adv();
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(1600); await p.keyboard.up('ArrowDown');
  await p.waitForTimeout(400);
  const fol = await p.evaluate(() => { const n = __SH.npcs.aqua, S = __SH.state; return { following: !!n.follow, gap: Math.round(Math.hypot(n.x - S.px, n.y - S.py)) }; });
  console.log('walk together:', fol);
  await p.screenshot({ path: OUT + '/f5-walk.png' });

  // 6. morning texts
  await p.evaluate(() => { const S = __SH.state; for (const g of Object.values(S.girls)) { g.met = true; g.aff = 50; } });
  let invites = 0;
  for (let i = 0; i < 6 && !invites; i++) {
    await p.evaluate(() => __SH.newDay(100)); await p.waitForTimeout(1200);
    invites = await p.evaluate(() => __SH.state.invites.length);
  }
  console.log('invites:', await p.evaluate(() => __SH.state.invites), 'msgs:', await p.evaluate(() => __SH.state.msgs.map((m) => m.text)));
  console.log('woke up in:', await p.evaluate(() => __SH.state.inside + ' mode=' + __SH.mode + ' weather=' + __SH.state.weather));
  await p.screenshot({ path: OUT + '/f6-home.png' });
  console.log('errors:', errors.length ? [...new Set(errors)] : 'none');
  await b.close();
})();
