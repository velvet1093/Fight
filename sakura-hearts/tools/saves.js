// Save-slot test: new game in slot 1, walk, reload, continue, save to slot 2,
// then check the load screen lists both. Local (browser) storage only.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  const url = 'file://' + process.cwd() + '/index.html?debug&quiet';
  await p.goto(url); await p.waitForTimeout(500);
  const adv = async () => { for (let i = 0; i < 30; i++) { await p.waitForTimeout(60); if (!(await p.isVisible('#dialog'))) return; if ((await p.$$('#menu .btn')).length && !(await p.$('#next.show'))) return; await p.click('#dialog', { timeout: 500 }).catch(() => {}); } };
  await p.click('.btn:has-text("New game")');
  await p.screenshot({ path: OUT + '/s1-newslot.png' });
  await p.click('.btn:has-text("Start here") >> nth=0');
  await p.fill('input.name', 'Mika');
  await p.click('.btn:has-text("Begin")');
  await adv();
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
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(500); await p.keyboard.up('ArrowDown');
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1500); await p.keyboard.up('ArrowRight');
  await p.waitForTimeout(1600); // let the coalesced local save land
  const before = await p.evaluate(() => ({ x: Math.round(__SH.state.px), y: Math.round(__SH.state.py), t: __SH.state.time, slot: __SH.SAVE.slot }));
  console.log('before reload', before);
  await p.reload(); await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/s2-title.png' });
  console.log('continue button:', (await p.textContent('#menu .btn.primary')).replace(/\s+/g, ' ').trim());
  await p.click('.btn:has-text("Continue")'); await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({ x: Math.round(__SH.state.px), y: Math.round(__SH.state.py), t: __SH.state.time, slot: __SH.SAVE.slot, mode: __SH.mode }));
  console.log('after continue', after);
  // save to slot 2 via phone
  await p.click('#btn-phone'); await p.click('.tabs .btn >> nth=3');
  await p.screenshot({ path: OUT + '/s3-system.png' });
  await p.click('.btn:has-text("Save to another slot")');
  await p.click('.slot-card >> nth=1 >> .btn');
  await p.waitForTimeout(200);
  console.log('active slot now', await p.evaluate(() => __SH.SAVE.slot));
  await p.click('#btn-phone'); await p.click('.tabs .btn >> nth=3');
  await p.click('.btn:has-text("Load a slot")');
  await p.screenshot({ path: OUT + '/s4-load.png' });
  const cards = await p.$$eval('.slot-card .slot-info', (els) => els.map((e) => e.textContent));
  console.log('slots:', cards);
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
