// Headless play-test: scripted opening, walk around town, then a random bot.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
const STEPS = +(process.argv[3] || 300);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet');
  await p.waitForTimeout(600);
  const adv = async (n = 30) => {
    for (let i = 0; i < n; i++) {
      await p.waitForTimeout(60);
      if (!(await p.isVisible('#dialog'))) return;
      if (await p.$('#next.show')) await p.click('#dialog', { timeout: 500 }).catch(() => {});
      else if ((await p.$$('#menu .btn')).length) return;
      else await p.click('#dialog', { timeout: 500 }).catch(() => {});
    }
  };
  const hold = async (key, ms) => { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); };
  await p.click('.btn:has-text("New game")');
  await p.click('.btn:has-text("Start here") >> nth=0');
  await p.fill('input.name', 'Aki');
  await p.click('.btn:has-text("Begin")');
  await adv();
  await p.screenshot({ path: OUT + '/o1-home.png' });
  // walk out of the house: down past the bed, east through the bedroom
  // doorway, around the sofa and out the front door
  const walkAxis = async (axis, target) => {
    const get = () => p.evaluate((a) => (a === 'x' ? __SH.state.px : __SH.state.py), axis);
    const v0 = await get();
    const key = axis === 'x' ? (target > v0 ? 'ArrowRight' : 'ArrowLeft') : (target > v0 ? 'ArrowDown' : 'ArrowUp');
    await p.keyboard.down(key);
    for (let i = 0; i < 150; i++) { const v = await get(); if (Math.abs(v - target) < 2 || (key === 'ArrowDown' && v > target) || (key === 'ArrowRight' && v > target) || (key === 'ArrowUp' && v < target) || (key === 'ArrowLeft' && v < target) || !(await p.evaluate(() => __SH.state.inside))) break; await p.waitForTimeout(25); }
    await p.keyboard.up(key);
  };
  for (const [axis, t] of [['y', 124], ['x', 120], ['y', 156], ['x', 152], ['y', 400]]) await walkAxis(axis, t);
  await p.waitForTimeout(300);
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/o2-outside.png' });
  console.log('after walking out:', await p.evaluate(() => 'inside=' + __SH.state.inside + ' mode=' + __SH.mode));
  // random bot
  const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  for (let s = 0; s < STEPS; s++) {
    if (await p.isVisible('#modal')) {
      const mb = await p.$$('#modal-body .btn:not([disabled])');
      const safe = [];
      for (const x of mb) if (!/return to title/i.test(await x.innerText())) safe.push(x);
      if (safe.length && Math.random() < 0.5) await safe[Math.floor(Math.random() * safe.length)].click({ timeout: 500 }).catch(() => {});
      else if (await p.isVisible('#modal-close')) await p.click('#modal-close', { timeout: 500 }).catch(() => {});
      else if (safe.length) await safe[0].click({ timeout: 500 }).catch(() => {});
      continue;
    }
    if (await p.isVisible('#world-ui')) {
      if (Math.random() < 0.3) await p.keyboard.press('e');
      else await hold(dirs[Math.floor(Math.random() * 4)], 150 + Math.random() * 700);
      continue;
    }
    const btns = await p.$$('#menu .btn:not([disabled])');
    if (btns.length) await btns[Math.floor(Math.random() * btns.length)].click({ timeout: 500 }).catch(() => {});
    else if (await p.isVisible('#dialog')) await p.click('#dialog', { timeout: 500 }).catch(() => {});
    await p.waitForTimeout(20);
  }
  await p.screenshot({ path: OUT + '/o5-bot.png' });
  console.log('HUD after bot:', (await p.textContent('#hud')).replace(/\s+/g, ' '));
  console.log('met:', await p.evaluate(() => Object.entries(__SH.state.girls).filter(([, g]) => g.met).map(([k, g]) => k + ':' + g.aff).join(' ')));
  console.log('errors:', errors.length ? [...new Set(errors)] : 'none');
  await b.close();
})();
