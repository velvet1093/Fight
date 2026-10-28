// Nami and Aqua's private flirty tease: only offered somewhere private, plays
// with the adult-proportioned MATURE art, and screenshots each step.
// Usage: node tools/tease.js <outdir>
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const setup = (o) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = 9; S.time = 1200; S.weather = 'sunny'; S.money = 300;
    for (const id of o.gfs) Object.assign(S.girls[id], { met: true, aff: 100, dates: 5, gf: true, love: { stage: 'serious', since: 2, dates: 4, anniv: {}, last: 9 } });
    __SH.state = S; __SH.initNPCs();
    for (const n of Object.values(__SH.npcs)) { n.path = []; n.idle = 99; }
    S.inside = null; S.px = 20 * 16 + 8; S.py = 25 * 16 + 12; __SH.enterWorld();
    for (const id of o.follow) __SH.startFollow(id);
    if (o.room) __SH.enterRoom(o.room);
  }, o);
  const teaseBtn = async () => p.evaluate(() => {
    const btn = [...document.querySelectorAll('#menu .btn')].find((x) => x.textContent.includes('Flirty tease'));
    return btn ? { disabled: btn.disabled, note: (btn.querySelector('.note') || {}).textContent } : null;
  });
  const openMenu = async (id) => { p.evaluate((id) => __SH.girlMenu(id), id); await p.waitForTimeout(600); for (let i = 0; i < 20 && !(await teaseBtn()); i++) { await p.click('#dialog', { timeout: 300 }).catch(() => {}); await p.waitForTimeout(120); } };

  // 1. out in town with her: the button is there but needs privacy
  await setup({ gfs: ['nami'], follow: ['nami'] });
  await openMenu('nami');
  console.log('in town:', JSON.stringify(await teaseBtn()));

  // 2. at home with Nami and Aqua both along: still not private
  await setup({ gfs: ['nami', 'aqua'], follow: ['nami', 'aqua'], room: 'home' });
  await openMenu('nami');
  console.log('home, both along:', JSON.stringify(await teaseBtn()));

  // 3. alone at home with each of them: she says yes, the scene plays with the adult art
  for (const id of ['nami', 'aqua']) {
    await setup({ gfs: [id], follow: [id], room: 'home' });
    await openMenu(id);
    console.log(id, 'home alone:', JSON.stringify(await teaseBtn()));
    await p.evaluate(() => { Math.__r = Math.random; Math.random = () => 0.1; });
    await p.evaluate(() => [...document.querySelectorAll('#menu .btn')].find((x) => x.textContent.includes('Flirty tease')).click());
    const seen = [];
    for (let i = 0; i < 40; i++) {
      await p.waitForTimeout(250);
      const st = await p.evaluate(() => ({ cg: __SH.cg ? __SH.cg.pose + '/' + __SH.cg.expr : null, text: document.getElementById('text').textContent, next: !!document.querySelector('#next.show') }));
      if (st.cg && st.next && !seen.includes(st.cg)) { seen.push(st.cg); await p.screenshot({ path: `${OUT}/tease-${id}-${seen.length}.png` }); }
      if (!st.cg && seen.length && (await p.$$('#menu .btn')).length) break;
      if (st.next) await p.click('#dialog').catch(() => {});
    }
    await p.evaluate(() => { Math.random = Math.__r; });
    console.log(id, 'poses shown:', seen.join(', '), '| back at menu, button:', JSON.stringify(await teaseBtn()));
  }

  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await b.close();
})();
