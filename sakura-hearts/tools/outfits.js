// Beach swimsuits, onsen towels, soaking together and the onsen date.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const adv = async () => { for (let i = 0; i < 40; i++) { await p.waitForTimeout(70); if (await p.isVisible('#world-ui')) return; if ((await p.$$('#menu .btn')).length && !(await p.$('#next.show'))) return; await p.click('#dialog', { timeout: 500 }).catch(() => {}); } };
  const setup = (o) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = o.day; S.time = o.time; S.money = 300;
    for (const [k, g] of Object.entries(S.girls)) { g.met = true; g.aff = o.aff || 70; g.dates = 3; S.daily['enc_' + k] = true; }
    __SH.state = S; __SH.initNPCs();
    if (o.room) __SH.enterRoom(o.room); else { S.inside = null; S.px = o.x * 16 + 8; S.py = o.y * 16 + 12; __SH.enterWorld(); }
  }, o);
  // 1. beach on a weekend afternoon: Nami and Aqua are there
  await setup({ day: 6, time: 700, x: 20, y: 34 });
  await p.evaluate(() => { const n = __SH.npcs.nami; n.path = []; n.idle = 99; const S = __SH.state; S.px = n.x + 14; S.py = n.y; S.dir = 'left'; });
  await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/o1-beach.png' });
  await p.keyboard.press('e'); await adv();
  await p.screenshot({ path: OUT + '/o2-beach-talk.png' });
  await p.click('.btn:has-text("Goodbye")');
  // 2. onsen at night with Zero Two
  await setup({ day: 3, time: 1180, room: 'onsen' });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const r = __SH.npcs.zerotwo.room; const S = __SH.state; S.px = r.x; S.py = r.y + 16; S.dir = 'up'; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/o3-onsen.png' });
  console.log('prompt:', (await p.textContent('#prompt')).trim());
  await p.keyboard.press('e'); await adv();
  console.log('menu:', await p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim())));
  await p.click('.btn:has-text("Soak together")');
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/o4-soak.png' });
  await adv();
  console.log('zero two aff after soak:', await p.evaluate(() => __SH.state.girls.zerotwo.aff), 'mode', await p.evaluate(() => __SH.mode));
  // 3. onsen date with Rem (asked at the maid café)
  await setup({ day: 3, time: 780, room: 'maidcafe', aff: 70 });
  await p.evaluate(() => { const r = __SH.npcs.rem.room; const S = __SH.state; S.px = r.x; S.py = 4 * 16 + 12; S.dir = 'up'; });
  await p.waitForTimeout(300);
  await p.keyboard.press('e'); await adv();
  await p.click('.btn:has-text("Ask on a date")'); await adv();
  await p.click('.btn:has-text("Sakura Onsen")'); await p.waitForTimeout(1600);
  await adv(); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/o5-onsen-date.png' });
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
