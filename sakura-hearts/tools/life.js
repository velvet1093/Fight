// Life mode: needs drain, accidents, toilets, groceries, rent, eviction,
// collapsing, game over + retry, pacifist mode, and the girls' money/needs.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(8000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  p.on('console', (m) => { if (m.text().startsWith('GAMEOVER')) console.log(m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const L = () => p.evaluate(() => { const l = __SH.state.life; return Object.fromEntries(Object.entries(l).filter(([k]) => typeof l[k] !== 'object').map(([k, v]) => [k, typeof v === 'number' ? Math.round(v) : v])); });
  const menuReady = async () => (await p.$$('#menu .btn')).length && !(await p.$('#next.show'));
  const adv = async (until) => { for (let i = 0; i < 120; i++) { if (until ? await until() : (await p.evaluate(() => __SH.mode)) === 'world' || await menuReady()) return; await p.click('#dialog', { timeout: 300 }).catch(() => {}); await p.waitForTimeout(100); } };
  const world = async () => (await p.evaluate(() => __SH.mode)) === 'world';
  const modalOpen = async () => !(await p.evaluate(() => document.getElementById('modal').hidden));
  const setup = (o = {}) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = o.day || 2; S.time = o.time || 700; S.money = o.money === undefined ? 300 : o.money; S.energy = 80;
    for (const [k, g] of Object.entries(S.girls)) { g.met = true; g.aff = 40; S.daily['enc_' + k] = true; }
    Object.assign(S.life, o.life || {});
    __SH.state = S; __SH.initNPCs();
    if (o.room) __SH.enterRoom(o.room); else { S.inside = null; S.px = 30 * 16 + 8; S.py = 21 * 16 + 12; __SH.enterWorld(); }
  }, o);

  // 1. new game: choose the mode, needs show under the clock
  await p.click('.btn:has-text("New game")');
  await p.click('.btn:has-text("Start here") >> nth=0');
  await p.screenshot({ path: OUT + '/l0-newgame.png' });
  await p.fill('input.name', 'Aki'); await p.click('.btn:has-text("Begin")');
  await adv(world);
  console.log('needs bar visible:', await p.isVisible('#hud-needs'), 'pacifist:', await p.evaluate(() => __SH.state.pacifist));

  // 2. needs drain over time
  await setup();
  await p.waitForTimeout(300);
  const before = await L();
  await p.evaluate(() => __SH.advanceTime(120));
  await p.waitForTimeout(200);
  console.log('2h later:', JSON.stringify(before), '→', JSON.stringify(await L()));

  // 3. an accident
  await setup({ life: { bladder: 0 } });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/l1-accident.png' });
  await adv(world);
  console.log('after accident:', JSON.stringify(await L()));

  // 4. home: toilet, fridge, stove without groceries, then groceries
  await setup({ room: 'home', life: { bladder: 30, groceries: 0, hunger: 30 } });
  await p.evaluate(() => { const S = __SH.state; S.px = 15 * 16 + 8; S.py = 9 * 16 + 12; S.dir = 'up'; });
  await p.waitForTimeout(300); await p.keyboard.press('e'); await adv(world);
  console.log('toilet:', (await L()).bladder);
  await p.evaluate(() => { const S = __SH.state; S.px = 15 * 16 + 8; S.py = 3 * 16 + 12; S.dir = 'up'; });
  await p.waitForTimeout(300); await p.keyboard.press('e'); await adv();
  console.log('stove menu:', await p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim())));
  await p.click('#menu .btn:has-text("Never mind")'); await adv(world);
  await p.evaluate(() => __SH.openShop('bakery'));
  console.log('bakery:', (await p.$$eval('#modal-body .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()))).filter((t) => t.includes('Groceries')));
  await p.click('#modal-body .btn:has-text("Groceries")'); await p.click('#modal-close');
  await p.evaluate(() => { const S = __SH.state; S.px = 15 * 16 + 8; S.py = 3 * 16 + 12; S.dir = 'up'; });
  await p.waitForTimeout(300); await p.keyboard.press('e'); await adv();
  await p.click('#menu .btn:has-text("Cook a meal")');
  await adv(world);
  console.log('after cooking:', JSON.stringify(await L()));

  // 5. rent: can't pay on Monday, then pays later
  await setup({ day: 7, money: 40 });
  await p.evaluate(() => __SH.newDay(100)); await p.waitForTimeout(1500);
  console.log('monday, ¥40:', JSON.stringify(await L()), 'money', await p.evaluate(() => __SH.state.money));
  await p.evaluate(() => { __SH.state.money = 500; }); await p.evaluate(() => __SH.newDay(100)); await p.waitForTimeout(1500);
  console.log('next day, ¥500:', (await L()).overdue, 'money', await p.evaluate(() => __SH.state.money));

  // 6. eviction → game over → keep playing in pacifist mode
  await setup({ day: 14, money: 0, life: { overdue: 2 } });
  await p.evaluate(() => __SH.newDay(100));
  await adv(modalOpen);
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/l2-evicted.png' });
  console.log('game over:', await p.$eval('#modal-body', (e) => e.innerText.replace(/\s+/g, ' ').slice(0, 80)));
  await p.click('#modal-body .btn:has-text("Pacifist")');
  await adv(world); await p.waitForTimeout(300);
  console.log('modal after pacifist click hidden:', await p.evaluate(() => document.getElementById('modal').hidden));
  console.log('pacifist now:', await p.evaluate(() => __SH.state.pacifist), 'needs bar visible:', await p.isVisible('#hud-needs'), 'over:', (await L()).over);

  // 7. collapse with money → clinic; collapse broke → game over → retry
  await setup({ money: 300, life: { health: 0.5, hunger: 0 } });
  await adv(async () => (await p.evaluate(() => __SH.state.day)) === 3 && await world());
  console.log('after collapse:', JSON.stringify(await L()), 'money', await p.evaluate(() => __SH.state.money), 'day', await p.evaluate(() => __SH.state.day));
  await p.evaluate(() => __SH.newDay(100)); await p.waitForTimeout(1500);
  await p.evaluate(() => { const S = __SH.state; S.money = 0; S.life.health = 0.5; S.life.hunger = 0; });
  await adv(modalOpen);
  console.log('broke collapse:', await p.$eval('#modal-title', (e) => e.innerText), JSON.stringify(await L()), await p.evaluate(() => [__SH.state.day, __SH.state.money, __SH.state.life.over, __SH.mode, document.getElementById('modal-body').innerText.slice(0, 60)]));
  await p.click('#modal-body .btn:has-text("Try again")');
  await adv(world);
  console.log('retried:', JSON.stringify(await L()), 'money', await p.evaluate(() => __SH.state.money));

  // 8. the girls: money, needs, plans
  await setup({ time: 800 });
  await p.evaluate(() => { const g = __SH.state.girls.nami.life; g.money = -10; g.hunger = 30; const n = __SH.npcs.nami; n.inside = null; n.x = __SH.state.px + 14; n.y = __SH.state.py; });
  await p.evaluate(() => __SH.girlMenu('nami')); await adv();
  console.log('nami menu:', (await p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()))).filter((t) => /Lend|Treat/.test(t)));
  const a0 = await p.evaluate(() => __SH.state.girls.nami.aff);
  await p.click('#menu .btn:has-text("Lend her")'); await adv();
  console.log('lent: nami ¥', await p.evaluate(() => Math.round(__SH.state.girls.nami.life.money)), 'aff', a0, '→', await p.evaluate(() => __SH.state.girls.nami.aff));
  await p.click('#menu .btn:has-text("Goodbye")'); await adv(world);
  await p.evaluate(() => { const g = __SH.state.girls.frieren.life; g.hunger = 10; g.eating = true; });
  console.log('hungry Frieren heads to:', await p.evaluate(() => __SH.goalFor('frieren')));
  await p.evaluate(() => { const g = __SH.state.girls.frieren.life; g.hunger = 90; g.eating = false; g.energy = 5; g.resting = true; });
  console.log('exhausted Frieren heads to:', await p.evaluate(() => __SH.goalFor('frieren')));
  await p.click('#btn-phone'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/l3-phone.png' });
  await p.click('.tabs .btn >> nth=2'); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/l4-me.png' });
  await p.click('#modal-close');
  await p.screenshot({ path: OUT + '/l5-hud.png' });
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
