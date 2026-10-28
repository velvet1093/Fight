// Fast-forward one girl's route: put the player next to her in town (or in her
// building), talk, then confess and reach the ending. Uses index.html?debug.
const { chromium } = require('playwright');
const [OUT, GIRL = 'aqua', TIME = '600'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet');
  await p.waitForTimeout(400);
  const where = await p.evaluate(([g, t]) => {
    const S = __SH.newState('Aki');
    S.day = 3; S.time = +t; S.money = 500;
    S.stats = { charm: 50, smarts: 50, fitness: 50 }; S.offerings = 6;
    Object.assign(S.girls[g], { met: true, aff: 92, dates: 3, events: 2 });
    __SH.state = S; __SH.initNPCs();
    const n = __SH.npcs[g];
    if (n.inside) {
      __SH.enterRoom(n.inside);
      const room = INTERIORS[n.inside], r = n.room;
      // stand on the first free tile below her, facing up
      for (let k = 1; k < 4; k++) {
        const ty = Math.floor((r.y - 1) / 16) + k, tx = Math.floor(r.x / 16);
        if (!room.isSolid(tx, ty)) { S.px = r.x; S.py = ty * 16 + 12; break; }
      }
      S.dir = 'up';
      return 'inside ' + n.inside;
    }
    S.inside = null; S.px = n.x; S.py = n.y + 14; S.dir = 'up';
    __SH.enterWorld();
    return 'outside at ' + Math.round(n.x) + ',' + Math.round(n.y);
  }, [GIRL, TIME]);
  console.log(GIRL, where);
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/r0-near.png' });
  const adv = async () => { for (let i = 0; i < 40; i++) { await p.waitForTimeout(80); if (await p.$('#menu .btn')) return; if (await p.isVisible('#modal')) return; await p.click('#dialog', { timeout: 500 }).catch(() => {}); } };
  await p.keyboard.press('e');
  await adv();
  await p.screenshot({ path: OUT + '/r1-menu.png' });
  await p.click('.btn:has-text("Confess")');
  await adv();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/r2-ending.png' });
  console.log('gf:', await p.evaluate((g) => __SH.state.girls[g].gf, GIRL));
  await p.click('.btn:has-text("Continue your life")').catch(() => console.log('no continue button'));
  await p.waitForTimeout(500);
  console.log('mode after ending:', await p.evaluate(() => __SH.mode));
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
