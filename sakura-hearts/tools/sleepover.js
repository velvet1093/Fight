// Overnight stays: at your place with a close friend (she gets the bed, you
// get the sofa) and at her place with a girlfriend (sharing the bed).
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.setDefaultTimeout(6000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const menuReady = async () => (await p.$$('#menu .btn')).length && !(await p.$('#next.show'));
  const clickThrough = async (until) => { for (let i = 0; i < 80; i++) { if (await until()) return true; await p.click('#dialog', { timeout: 300 }).catch(() => {}); await p.waitForTimeout(120); } return false; };
  const state = () => p.evaluate(() => ({ mode: __SH.mode, inside: __SH.state.inside, day: __SH.state.day, time: __SH.state.time }));
  const setup = (o) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = 2; S.time = o.time; S.money = 300;
    for (const g of Object.values(S.girls)) { g.met = true; g.aff = o.aff; g.dates = 3; g.gf = !!o.gf; }
    __SH.state = S; __SH.initNPCs();
    S.inside = null; S.px = 30 * 16 + 8; S.py = 20 * 16 + 12; __SH.enterWorld();
  }, o);
  const run = async (id, o, which, tag) => {
    await setup(o);
    await p.waitForTimeout(300);
    await p.evaluate((id) => __SH.girlMenu(id), id);
    await clickThrough(menuReady);
    const btn = await p.$eval('#menu .btn:has-text("Spend the night")', (e) => e.innerText.replace(/\s+/g, ' '));
    console.log(tag, 'button:', btn);
    await p.click('#menu .btn:has-text("Spend the night")');
    const opts = await p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim() + (e.disabled ? ' [disabled]' : '')));
    console.log(tag, 'options:', opts);
    await p.click(`#menu .btn >> nth=${which}`);
    // she says yes, then the arrival scene
    await clickThrough(async () => (await p.evaluate(() => __SH.state.inside)) !== null && (await p.evaluate(() => __SH.state.inside)) !== undefined && (await p.isVisible('#dialog')));
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/${tag}-1-arrive.png` });
    // night talk: pick the first reply
    await clickThrough(menuReady);
    await p.click('#menu .btn >> nth=0');
    // go on until lights out
    await clickThrough(async () => (await p.$eval('#dialog', (e) => e.innerText)).match(/asleep|sofa|curls|blanket|whisper/));
    await p.screenshot({ path: `${OUT}/${tag}-2-night.png` });
    await clickThrough(async () => (await state()).day === 3);
    await p.waitForTimeout(2600);
    await p.screenshot({ path: `${OUT}/${tag}-3-morning.png` });
    await clickThrough(async () => (await state()).mode === 'world');
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${tag}-4-after.png` });
    console.log(tag, 'after:', JSON.stringify(await state()), 'aff', await p.evaluate((id) => __SH.state.girls[id].aff, id), 'energy', await p.evaluate(() => __SH.state.energy));
  };
  await run('nami', { time: 1260, aff: 70 }, 0, 's1');
  await run('kurumi', { time: 1320, aff: 100, gf: true }, 1, 's2');
  await run('frieren', { time: 1300, aff: 100, gf: true }, 0, 's3');
  // too early / not close enough
  await setup({ time: 1000, aff: 40 });
  await p.evaluate(() => __SH.girlMenu('aqua')); await clickThrough(menuReady);
  console.log('aqua at 40 aff:', await p.$eval('#menu .btn:has-text("Spend the night")', (e) => e.innerText.replace(/\s+/g, ' ') + (e.disabled ? ' [disabled]' : '')));
  // reload a save made inside her room
  await p.evaluate(() => { __SH.SAVE.slot = 1; const S = __SH.state; S.inside = 'room_frieren'; __SH.autosave(true); });
  console.log('saved inside:', await p.evaluate(() => (__SH.slotRecord(1) || {}).state && __SH.slotRecord(1).state.inside));
  await p.evaluate(() => __SH.loadSlot(1)).catch((e) => console.log('load err', e.message));
  await p.waitForTimeout(500);
  console.log('loaded from bedroom save:', JSON.stringify(await state()));
  // wardrobe: Aqua in a nightgown with a nightcap
  await p.evaluate(() => __SH.openWardrobe('aqua', 'pajama'));
  await p.click('.pill:has-text("Nightgown")');
  await p.click('.wrow:has-text("Nightcap") .pill:has-text("On")');
  console.log('aqua pajama wardrobe:', JSON.stringify(await p.evaluate(() => __SH.state.wardrobe.aqua)));
  await p.screenshot({ path: OUT + '/s5-wardrobe.png' });
  await p.click('#modal-close');
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
