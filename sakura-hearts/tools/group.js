// Hanging out with up to three girls: invites, girl-to-girl banter, a group
// trip to the city (fancy dinner, piano, purikura), a second girlfriend,
// and date clothes in the wardrobe.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(8000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const st = () => p.evaluate(() => ({ mode: __SH.mode, inside: __SH.state.inside, time: __SH.state.time, money: __SH.state.money }));
  const menuReady = async () => (await p.$$('#menu .btn')).length && !(await p.$('#next.show'));
  const adv = async (until) => { for (let i = 0; i < 150; i++) { if (until ? await until() : (await p.evaluate(() => __SH.mode)) === 'world' || await menuReady()) return; await p.click('#dialog', { timeout: 300 }).catch(() => {}); await p.waitForTimeout(100); } };
  const inWorld = (inside) => async () => (await p.evaluate(() => __SH.mode)) === 'world' && (inside === undefined || (await p.evaluate(() => __SH.state.inside)) === inside);
  const tp = (tx, ty, dir) => p.evaluate(([tx, ty, dir]) => { const S = __SH.state; S.px = tx * 16 + 8; S.py = ty * 16 + 12; S.dir = dir; }, [tx, ty, dir]);
  const act = async () => { await p.waitForTimeout(250); await p.keyboard.press('e'); await p.waitForTimeout(150); };
  const pick = (txt) => p.click(`#menu .btn:has-text("${txt}")`);
  const btns = () => p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim() + (e.disabled ? ' [off]' : '')));
  const textNow = () => p.$eval('#dialog', (e) => e.innerText.replace(/\s+/g, ' '));

  await p.evaluate(() => {
    const S = __SH.newState('Aki'); S.day = 6; S.time = 700; S.money = 900; S.energy = 80;
    for (const [k, g] of Object.entries(S.girls)) { g.met = true; g.aff = 55; g.dates = 1; S.daily['enc_' + k] = true; }
    __SH.state = S; __SH.initNPCs(); S.inside = null; S.px = 30 * 16 + 8; S.py = 21 * 16 + 12; __SH.enterWorld();
  });
  await p.waitForTimeout(300);
  for (const id of ['aqua', 'kurumi', 'marin']) {
    await p.evaluate((id) => { const n = __SH.npcs[id]; n.inside = null; n.x = __SH.state.px + 30; n.y = __SH.state.py; n.path = []; }, id);
    await p.evaluate((id) => __SH.girlMenu(id), id); await adv();
    console.log(id, 'walk button:', (await btns()).find((t) => t.includes('Walk') || t.includes('Invite')));
    await p.click('#menu .btn:has-text("Walk together"), #menu .btn:has-text("Invite to hang out")'); await adv(inWorld(null));
  }
  console.log('party:', await p.evaluate(() => Object.keys(__SH.npcs).filter((k) => __SH.npcs[k].follow)));
  await p.evaluate(() => { const n = __SH.npcs.nami; n.inside = null; n.x = __SH.state.px + 30; n.y = __SH.state.py; n.path = []; });
  await p.evaluate(() => __SH.girlMenu('nami')); await adv();
  console.log('4th girl:', (await btns()).find((t) => t.includes('Invite')));
  await pick('Goodbye'); await adv(inWorld(null));
  // walk a bit so the trail forms, then let time pass for banter
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(900); await p.keyboard.up('ArrowRight');
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/g1-group.png' });
  await p.evaluate(() => { __SH.state.time += 12; });
  await p.waitForFunction(() => __SH.cut, null, { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(900);
  await p.screenshot({ path: OUT + '/g2-banter.png' });
  console.log('banter line:', await textNow().catch(() => ''));
  await adv(inWorld(null));
  console.log('pairs done:', await p.evaluate(() => Object.keys(__SH.state.daily).filter((k) => k.startsWith('pair_'))));
  await p.evaluate(() => { for (const k of ['aqua|marin', 'kurumi|marin']) __SH.state.daily['pair_' + k] = true; });

  // the whole group to the city
  const m = await p.evaluate(() => [WORLD.B.station.mat.x, WORLD.B.station.mat.y]);
  await tp(m[0], m[1], 'up'); await act();
  console.log('station:', await btns());
  await pick('Ride to Hoshimachi City');
  await p.waitForTimeout(2600);
  await p.screenshot({ path: OUT + '/g3-train.png' });
  await adv(inWorld('city'));
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1200); await p.keyboard.up('ArrowRight');
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/g4-city.png' });
  console.log('city outfits:', await p.evaluate(() => ['player', 'aqua', 'kurumi', 'marin'].map((k) => k + ':' + __SH.outfitFor(k, 'city')).join(' ')));
  await p.evaluate(() => { __SH.state.time = 1050; });
  await tp(33, 6, 'up'); await act(); await adv(inWorld('fancy'));
  console.log('in:', (await st()).inside);
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/g5-fancy.png' });
  await tp(7, 4, 'up'); await act(); await adv();
  console.log('fancy menu:', await btns());
  await pick('tasting menu');
  await p.waitForFunction(() => __SH.cut && __SH.cut.arrived !== null, null, { timeout: 8000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/g6-dinner.png' });
  await adv(inWorld('fancy'));
  console.log('aff after dinner:', await p.evaluate(() => ['aqua', 'kurumi', 'marin'].map((k) => k + ' ' + __SH.state.girls[k].aff).join(', ')));
  await tp(2, 4, 'up'); await act();
  await p.waitForTimeout(2000);
  await p.screenshot({ path: OUT + '/g7-piano.png' });
  await adv(inWorld('fancy'));
  await tp(7, 8, 'down'); await p.keyboard.down('ArrowDown'); await p.waitForTimeout(400); await p.keyboard.up('ArrowDown');
  await p.waitForTimeout(200);
  await p.evaluate(() => { __SH.state.time = 1080; });
  await tp(26, 6, 'up'); await act(); await adv(inWorld('megamall'));
  await tp(14, 4, 'up'); await act();
  await adv(async () => !(await p.evaluate(() => document.getElementById('modal').hidden)));
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/g8-photo.png' });
  await p.click('#modal-body .btn'); await adv(inWorld('megamall'));
  await tp(9, 11, 'down'); await p.keyboard.down('ArrowDown'); await p.waitForTimeout(400); await p.keyboard.up('ArrowDown');
  await tp(3, 6, 'up'); await act();
  console.log('home menu:', await btns());
  await pick('Ride home');
  await adv(inWorld(null));
  console.log('home:', JSON.stringify(await st()), 'party', await p.evaluate(() => Object.keys(__SH.npcs).filter((k) => __SH.npcs[k].follow)), 'dates', await p.evaluate(() => ['aqua', 'kurumi', 'marin'].map((k) => __SH.state.girls[k].dates)));

  // a second girlfriend
  await p.evaluate(() => { const S = __SH.state; S.girls.nami.gf = true; S.girls.nami.aff = 100; Object.assign(S.girls.zerotwo, { aff: 92, dates: 3, events: 2 }); S.stats.fitness = 60; S.time = 800; const n = __SH.npcs.zerotwo; n.inside = null; n.x = S.px + 14; n.y = S.py; });
  await p.evaluate(() => __SH.girlMenu('zerotwo')); await adv();
  await pick('Confess');
  let harem = false;
  for (let i = 0; i < 40 && !harem; i++) { const t = await textNow().catch(() => ''); if (/still my darling/.test(t)) harem = true; await p.click('#dialog', { timeout: 300 }).catch(() => {}); await p.waitForTimeout(150); }
  console.log('harem line shown:', harem);
  await adv(async () => !(await p.evaluate(() => document.getElementById('modal').hidden)));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/g9-ending.png' });
  console.log('girlfriends:', await p.evaluate(() => Object.keys(__SH.state.girls).filter((k) => __SH.state.girls[k].gf)));
  await p.click('#modal-body .btn.primary').catch(() => {});
  await adv(inWorld());

  // date clothes in the wardrobe
  await p.evaluate(() => __SH.openWardrobe('marin', 'casual'));
  await p.screenshot({ path: OUT + '/g10-wardrobe.png' });
  await p.click('.tabs .btn:has-text("Daily")');
  await p.click('.pill:has-text("Date clothes")');
  console.log('marin wardrobe:', JSON.stringify(await p.evaluate(() => __SH.state.wardrobe.marin)));
  await p.click('#modal-close');
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
