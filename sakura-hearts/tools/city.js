// Train to Hoshimachi City: a solo trip (McRonald's, the Megamall) and a
// city date with Aqua (train ride, fried chicken, fashion, purikura, home).
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(8000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const st = () => p.evaluate(() => ({ mode: __SH.mode, inside: __SH.state.inside, time: __SH.state.time, money: __SH.state.money, energy: __SH.state.energy }));
  const menuReady = async () => (await p.$$('#menu .btn')).length && !(await p.$('#next.show'));
  const adv = async (until) => { for (let i = 0; i < 120; i++) { if (until ? await until() : (await p.evaluate(() => __SH.mode)) === 'world' || await menuReady()) return; await p.click('#dialog', { timeout: 300 }).catch(() => {}); await p.waitForTimeout(100); } };
  const tp = (tx, ty, dir) => p.evaluate(([tx, ty, dir]) => { const S = __SH.state; S.px = tx * 16 + 8; S.py = ty * 16 + 12; S.dir = dir; }, [tx, ty, dir]);
  const act = async () => { await p.waitForTimeout(250); await p.keyboard.press('e'); await p.waitForTimeout(150); };
  const pick = (txt) => p.click(`#menu .btn:has-text("${txt}")`);
  const setup = (o) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = 6; S.time = o.time; S.money = 400; S.energy = 60;
    for (const [k, g] of Object.entries(S.girls)) { g.met = true; g.aff = o.aff || 40; g.dates = 1; }
    __SH.state = S; __SH.initNPCs(); S.inside = null; __SH.enterWorld();
  }, o);

  // ---- solo
  await setup({ time: 700 });
  const m = await p.evaluate(() => [WORLD.B.station.mat.x, WORLD.B.station.mat.y]);
  await tp(m[0], m[1], 'up'); await act();
  console.log('station prompt menu:', await p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim())));
  await pick('Ride to Hoshimachi');
  await p.waitForTimeout(1800);
  await p.screenshot({ path: OUT + '/c1-train.png' });
  await adv(async () => (await p.evaluate(() => __SH.state.inside)) === 'city' && (await p.evaluate(() => __SH.mode)) === 'world');
  await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/c2-city.png' });
  console.log('arrived:', JSON.stringify(await st()));
  await tp(10, 6, 'up'); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(300); await p.keyboard.up('ArrowUp');
  await p.waitForTimeout(300);
  console.log('bumped into McRonald\'s:', (await st()).inside);
  await tp(3, 4, 'up'); await act(); await adv();
  console.log('menu:', await p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim())));
  await pick("Kids' meal");
  await p.waitForTimeout(2200);
  await p.screenshot({ path: OUT + '/c3-eat.png' });
  await adv();
  console.log('after kids meal:', JSON.stringify(await st()), 'toy', await p.evaluate(() => __SH.state.inv.toy));
  await tp(6, 7, 'down'); await p.keyboard.down('ArrowDown'); await p.waitForTimeout(500); await p.keyboard.up('ArrowDown');
  await p.waitForTimeout(200);
  console.log('walked out to:', JSON.stringify(await st()));
  await tp(26, 6, 'up'); await act(); await adv();
  console.log('in mall:', (await st()).inside);
  await p.screenshot({ path: OUT + '/c4-mall.png' });
  await tp(13, 8, 'up'); await act();
  console.log('gift boutique:', await p.$$eval('#modal-body .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 30))));
  await p.click('#modal-close');

  // ---- date with Aqua
  await setup({ time: 780, aff: 50 });
  await p.evaluate(() => __SH.girlMenu('aqua')); await adv();
  await pick('Ask on a date'); await adv();
  await pick('Hoshimachi City');
  await p.waitForTimeout(3600);
  await p.screenshot({ path: OUT + '/c5-train-date.png' });
  await adv(async () => (await p.evaluate(() => __SH.state.inside)) === 'city' && (await p.evaluate(() => __SH.mode)) === 'world');
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(900); await p.keyboard.up('ArrowRight');
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/c6-city-date.png' });
  console.log('aqua aff at arrival:', await p.evaluate(() => __SH.state.girls.aqua.aff), 'dates', await p.evaluate(() => __SH.state.girls.aqua.dates));
  await tp(15, 6, 'up'); await act(); await adv();
  console.log('in kitsune:', (await st()).inside);
  await tp(3, 4, 'up'); await act(); await adv();
  await pick('Bucket');
  await p.waitForTimeout(2300);
  await p.screenshot({ path: OUT + '/c7-eat-date.png' });
  await adv();
  console.log('aqua after chicken:', await p.evaluate(() => __SH.state.girls.aqua.aff));
  await tp(6, 7, 'down'); await p.keyboard.down('ArrowDown'); await p.waitForTimeout(500); await p.keyboard.up('ArrowDown');
  await tp(26, 6, 'up'); await act(); await adv();
  await tp(14, 4, 'up'); await act();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/c8-purikura.png' });
  await adv(async () => !(await p.evaluate(() => document.getElementById('modal').hidden)));
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/c9-photo.png' });
  await p.click('#modal-body .btn');
  await adv();
  await tp(4, 3, 'up'); await act(); await adv();
  await pick('Buy it for her'); await adv();
  console.log('aqua after mall:', await p.evaluate(() => __SH.state.girls.aqua.aff), 'photos', await p.evaluate(() => __SH.state.photos.length));
  await tp(9, 11, 'down'); await p.keyboard.down('ArrowDown'); await p.waitForTimeout(400); await p.keyboard.up('ArrowDown');
  await tp(3, 6, 'up'); await act();
  await pick('Ride home with Aqua');
  await adv(async () => (await p.evaluate(() => __SH.state.inside)) === null && (await p.evaluate(() => __SH.mode)) === 'world');
  await p.waitForTimeout(400);
  console.log('home again:', JSON.stringify(await st()), 'aqua', await p.evaluate(() => __SH.state.girls.aqua.aff), 'following', await p.evaluate(() => !!__SH.npcs.aqua.follow));
  await p.screenshot({ path: OUT + '/c10-home.png' });

  // ---- late train
  await setup({ time: 780, aff: 50 });
  await p.evaluate(() => __SH.girlMenu('rem')); await adv();
  await pick('Ask on a date'); await adv();
  await pick('Hoshimachi City');
  await adv(async () => (await p.evaluate(() => __SH.state.inside)) === 'city' && (await p.evaluate(() => __SH.mode)) === 'world');
  await p.evaluate(() => { __SH.state.time = 1379; });
  await adv(async () => (await p.evaluate(() => __SH.state.inside)) === null && (await p.evaluate(() => __SH.mode)) === 'world');
  console.log('late train home:', JSON.stringify(await st()), 'following', await p.evaluate(() => !!__SH.npcs.rem.follow));
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
