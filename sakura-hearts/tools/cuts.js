// In-world cutscenes (soak, swim, hug, love potion) and the wardrobe.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(6000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const adv = async () => { for (let i = 0; i < 60; i++) { await p.waitForTimeout(70); if (await p.isVisible('#world-ui')) return; if ((await p.$$('#menu .btn')).length && !(await p.$('#next.show'))) return; await p.click('#dialog', { timeout: 500 }).catch(() => {}); } };
  const setup = (o) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = o.day; S.time = o.time; S.money = 500;
    for (const g of Object.values(S.girls)) { g.met = true; g.aff = o.aff || 70; g.dates = o.dates === undefined ? 3 : o.dates; }
    if (o.wardrobe) S.wardrobe = o.wardrobe;
    __SH.state = S; __SH.initNPCs();
    if (o.room) __SH.enterRoom(o.room); else { S.inside = null; S.px = o.x * 16 + 8; S.py = o.y * 16 + 12; __SH.enterWorld(); }
  }, o);
  const near = (id, dx = 14) => p.evaluate(([id, dx]) => { const n = __SH.npcs[id]; const S = __SH.state; const r = n.room || n; S.px = r.x + dx; S.py = r.y; S.dir = 'left'; }, [id, dx]);

  // 1. soak together in the onsen
  await setup({ day: 3, time: 1180, room: 'onsen' });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const r = __SH.npcs.zerotwo.room; const S = __SH.state; S.px = r.x; S.py = r.y + 16; S.dir = 'up'; });
  await p.keyboard.press('e'); await adv();
  await p.click('.btn:has-text("Soak together")');
  await p.waitForTimeout(3000);
  await p.screenshot({ path: OUT + '/c1-soak.png' });
  await adv();

  console.log('soak ok');
  // 2. swim at the beach with Nami in a custom bikini, and you in trunks only
  await setup({ day: 6, time: 700, x: 20, y: 34, wardrobe: { nami: { color: '#ff8ab0' }, player: { shirt: false, trunks: '#d83c4c' } } });
  await p.waitForTimeout(500);
  await adv();
  p.evaluate(() => __SH.runActivity(DATA.ACTIVITIES.outdoor.swim));
  await p.waitForTimeout(2200);
  await p.screenshot({ path: OUT + '/c2-swim.png' });
  await adv();

  console.log('swim ok, mode', await p.evaluate(() => __SH.mode));
  // 3. hug interaction in town
  await setup({ day: 2, time: 800, x: 30, y: 20 });
  await p.waitForTimeout(500);
  const gid = await p.evaluate(() => Object.keys(__SH.npcs).find((k) => !__SH.npcs[k].bld));
  await p.evaluate((id) => { __SH.state.girls[id].gf = true; }, gid);
  await near(gid, 30);
  await p.waitForTimeout(200);
  await p.evaluate((id) => __SH.girlMenu(id), gid); await adv();
  await p.click('.btn:has-text("Interact")');
  await p.click('.btn:has-text("Hug")');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/c3-hug.png' });
  await adv();
  await p.click('.btn:has-text("Goodbye")').catch(() => {});

  console.log('hug ok');
  // 4. buy a love potion from Frieren and give it to her (dates 0 → capped at 45)
  await setup({ day: 2, time: 800, x: 30, y: 20, aff: 44, dates: 0 });
  await p.waitForTimeout(500);
  await near('frieren');
  await p.evaluate(() => __SH.girlMenu('frieren')); await adv();
  await p.click('.btn:has-text("Love Potion")'); await adv();
  await p.click('.btn:has-text("Buy one")'); await adv();
  console.log('potions:', await p.evaluate(() => __SH.state.inv.lovepotion), 'money', await p.evaluate(() => __SH.state.money));
  await p.click('.btn:has-text("Give a gift")');
  await p.click('.btn:has-text("Love Potion")');
  for (let i = 0; i < 30 && !(await p.evaluate(() => document.querySelector('#panel').hidden)); i++) { await p.waitForTimeout(200); await p.click('#dialog', { timeout: 300 }).catch(() => {}); }
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/c4-potion.png' });
  await adv();
  console.log('frieren aff after potion (cap 45):', await p.evaluate(() => __SH.state.girls.frieren.aff));

  // 5. wardrobe
  await p.click('.btn:has-text("Goodbye")').catch(() => {});
  await p.evaluate(() => __SH.openWardrobe('aqua', 'swim'));
  await p.click('.pill:has-text("Bikini")');
  await p.click('.swatch >> nth=1');
  await p.screenshot({ path: OUT + '/c5-wardrobe.png' });
  console.log('aqua wardrobe:', JSON.stringify(await p.evaluate(() => __SH.state.wardrobe.aqua)));
  await p.click('.chip:has-text("Aki")');
  await p.click('.tabs .btn:has-text("Daily")');
  await p.click('.swatch >> nth=1');
  await p.screenshot({ path: OUT + '/c6-wardrobe-me.png' });
  console.log('player wardrobe:', JSON.stringify(await p.evaluate(() => __SH.state.wardrobe.player)));
  await p.click('#modal-close');
  console.log('mode after close:', await p.evaluate(() => __SH.mode));
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
