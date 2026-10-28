// Games & fun: console and arcade minigames (solo and versus), the casino,
// Yumeko's cards, Marin's cosplay shoot, work from home, rich Kurumi, the
// WhatsUp chat app and the guide. Screenshots go to OUT.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet'); await p.waitForTimeout(500);
  const adv = async () => { for (let i = 0; i < 60; i++) { await p.waitForTimeout(70); if (await p.isVisible('#world-ui')) return; if ((await p.$$('#menu .btn')).length && !(await p.$('#next.show'))) return; if (await p.isVisible('#modal')) return; await p.click('#dialog', { timeout: 500 }).catch(() => {}); } };
  const setup = (o) => p.evaluate((o) => {
    const S = __SH.newState('Aki'); S.day = o.day || 3; S.time = o.time || 1100; S.weather = 'sunny'; S.money = o.money === undefined ? 500 : o.money;
    for (const [id, aff] of Object.entries(o.aff || {})) Object.assign(S.girls[id], { met: true, aff, dates: 3, gf: aff >= 100 });
    __SH.state = S; __SH.initNPCs();
    for (const n of Object.values(__SH.npcs)) { n.path = []; n.idle = 99; }
    if (o.room) __SH.enterRoom(o.room); else { S.inside = null; S.px = o.x * 16 + 8; S.py = o.y * 16 + 12; __SH.enterWorld(); }
  }, o);
  const useAct = (act) => p.evaluate((act) => { const R = __SH.state.inside; const pr = window.INTERIORS[R].spec.props.find((q) => q.act === act); __SH.useProp(pr); }, act);
  const menu = () => p.$$eval('#menu .btn', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
  const money = () => p.evaluate(() => __SH.state.money);
  // play a skill game: press Start, mash/tap for a while, Continue
  const playSkill = async (shot) => {
    await p.click('#modal .btn:has-text("Start")');
    for (let i = 0; i < 60; i++) { await p.keyboard.press('Space'); await p.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight'); await p.waitForTimeout(40); if (i === 20 && shot) await p.screenshot({ path: OUT + '/' + shot }); }
    await p.waitForSelector('#modal .btn:has-text("Continue")', { timeout: 45000 });
    const res = await p.textContent('.mg-result');
    await p.click('#modal .btn:has-text("Continue")');
    return res.replace(/\s+/g, ' ');
  };

  const START = +(process.env.START || 1);
  if (START <= 1) {
  // 1. console at home, solo then versus Zero Two (in the room with you)
  await setup({ room: 'home', aff: { zerotwo: 60 } });
  await p.evaluate(() => { const n = __SH.npcs.zerotwo; __SH.startFollow('zerotwo'); });
  await p.waitForTimeout(300);
  console.log('playmates at home:', await p.evaluate(() => __SH.playmates()));
  await useAct('tv'); await adv();
  console.log('tv menu:', await menu());
  await p.click('#menu .btn:has-text("Play video games")'); await adv();
  console.log('console menu:', await menu());
  await p.click('#menu .btn:has-text("Brawl Mash")'); await adv();
  console.log('who menu:', await menu());
  await p.click('#menu .btn:has-text("Play alone")'); await p.waitForTimeout(300);
  console.log('solo mash:', await playSkill('g1-mash.png'));
  await adv(); await p.waitForTimeout(300);
  await useAct('tv'); await adv(); await p.click('#menu .btn:has-text("Play video games")'); await adv();
  await p.click('#menu .btn:has-text("Kart Dash")'); await adv();
  const aff0 = await p.evaluate(() => __SH.state.girls.zerotwo.aff);
  await p.click('#menu .btn:has-text("Play against Zero Two")'); await adv();
  console.log('vs kart:', await playSkill('g2-kart.png'));
  await adv(); await p.waitForTimeout(400);
  console.log('zero two aff', aff0, '->', await p.evaluate(() => __SH.state.girls.zerotwo.aff), 'mode', await p.evaluate(() => __SH.mode));

  }
  if (START <= 2) {
  // 2. arcade: rhythm cabinet, ¥5
  await setup({ room: 'arcade' });
  let m0 = await money();
  await useAct('rhythm'); await adv();
  await p.click('#menu .btn:has-text("Play alone")'); await p.waitForTimeout(300);
  console.log('arcade rhythm:', await playSkill('g3-rhythm.png'));
  await adv();
  console.log('arcade cost', m0 - await money());
  await useAct('puzzle'); await adv(); await p.click('#menu .btn:has-text("Play alone")'); await p.waitForTimeout(300);
  console.log('arcade stack:', await playSkill('g4-stack.png')); await adv();

  }
  if (START <= 3) {
  // 3. casino exterior + interior, slots and blackjack
  await setup({ x: 81, y: 20, time: 1200, aff: { yumeko: 50 } });
  await p.waitForTimeout(700);
  await p.screenshot({ path: OUT + '/g5-casino-out.png' });
  await setup({ room: 'casino', time: 1260, aff: { yumeko: 50 } });
  await p.waitForTimeout(700);
  console.log('yumeko in casino:', await p.evaluate(() => __SH.npcs.yumeko.inside), 'goal', await p.evaluate(() => __SH.goalFor('yumeko')));
  await p.screenshot({ path: OUT + '/g6-casino-in.png' });
  m0 = await money();
  await useAct('slots'); await p.waitForTimeout(300);
  await p.click('#modal .btn:has-text("50")').catch(() => {});
  for (let i = 0; i < 4; i++) { await p.click('#modal .btn:has-text("Spin")'); await p.waitForTimeout(1600); }
  await p.screenshot({ path: OUT + '/g7-slots.png' });
  await p.click('#modal .btn:has-text("Cash out")'); await adv();
  console.log('slots net', await money() - m0);
  m0 = await money();
  await useAct('blackjack'); await p.waitForTimeout(300);
  console.log('bj buttons:', await p.$$eval('#modal .btn', (e) => e.map((x) => x.innerText.trim())));
  for (let r = 0; r < 3; r++) {
    await p.click('#modal .btn:has-text("Deal")').catch(() => {}); await p.waitForTimeout(500);
    if (r === 0) await p.screenshot({ path: OUT + '/g8-blackjack.png' });
    await p.click('#modal .btn:has-text("Stand")').catch(() => {}); await p.waitForTimeout(1500);
  }
  await p.click('#modal .btn:has-text("Leave")'); await adv();
  console.log('blackjack net', await money() - m0);

  }
  if (START <= 4) {
  // 4. Yumeko cards: at the casino (blackjack) and at school (high-low)
  for (const room of ['casino', 'school']) {
    await setup({ room, time: room === 'casino' ? 1260 : 600, aff: { yumeko: 50 } });
    await p.evaluate(() => { __SH.girlMenu('yumeko'); }); await adv();
    console.log(room, 'yumeko menu has cards:', (await menu()).find((x) => /cards/.test(x)));
    await p.click('#menu .btn:has-text("Play cards")'); await adv();
    console.log(room, 'card modal:', await p.textContent('#modal-title'));
    if (room === 'school') {
      for (let i = 0; i < 12 && await p.isVisible('#modal .btn:has-text("Higher")'); i++) { await p.click('#modal .btn:has-text("Higher")'); await p.waitForTimeout(400); if (i === 1) await p.screenshot({ path: OUT + '/g9-highlow.png' }); }
      await p.click('#modal .btn:has-text("Continue")', { timeout: 1500 }).catch(() => {});
      await p.click('#modal .btn:has-text("Stop")', { timeout: 1500 }).catch(() => {});
    } else {
      await p.click('#modal .btn:has-text("Deal")').catch(() => {}); await p.waitForTimeout(400);
      await p.click('#modal .btn:has-text("Stand")').catch(() => {}); await p.waitForTimeout(1500);
      await p.click('#modal .btn:has-text("Leave")');
    }
    await adv();
    console.log(room, 'after cards menu:', (await menu()).slice(0, 3), 'aff', await p.evaluate(() => __SH.state.girls.yumeko.aff));
  }

  }
  if (START <= 5) {
  // 5. Marin cosplay shoot
  await setup({ x: 20, y: 25, time: 900, aff: { marin: 50 } });
  await p.evaluate(() => { const n = __SH.npcs.marin, S = __SH.state; n.inside = null; n.room = null; n.x = S.px + 16; n.y = S.py; });
  await p.evaluate(() => { __SH.girlMenu('marin'); }); await adv();
  await p.click('#menu .btn:has-text("Cosplay photoshoot")'); await adv();
  console.log('costumes:', await menu());
  await p.click('#menu .btn:has-text("Rizu-kyun")'); await adv();
  await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/g10-cosplay.png' });
  await adv();
  await p.click('#menu .btn:has-text("cool")'); await adv();
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/g11-photo.png' });
  await p.click('#modal .btn:has-text("Amazing")'); await adv();
  console.log('marin outfit now:', await p.evaluate(() => __SH.outfitFor('marin', null, 0, 0)), 'photos', await p.evaluate(() => __SH.state.photos.length));

  }
  if (START <= 6) {
  // 6. work from home
  await setup({ room: 'home', time: 600 });
  m0 = await money();
  await useAct('desk'); await adv();
  console.log('desk menu:', await menu());
  await p.click('#menu .btn:has-text("Work from home")'); await adv(); await adv();
  console.log('wfh earned', await money() - m0, 'time', await p.evaluate(() => __SH.state.time));

  }
  if (START <= 7) {
  // 7. Kurumi: rich, helps when broke
  await setup({ x: 20, y: 25, time: 900, money: 20, aff: { kurumi: 60 } });
  await p.evaluate(() => { __SH.girlMenu('kurumi'); }); await adv();
  console.log('kurumi menu:', await menu());
  await p.click('#menu .btn:has-text("Ask Kurumi")'); await adv();
  console.log('money after help', await money(), 'kurumi savings', await p.evaluate(() => Math.round(__SH.state.girls.kurumi.life.money)));

  }
  if (START <= 8) {
  // 8. WhatsUp: list, Nami chat, meet up, group chat
  await setup({ x: 20, y: 25, time: 700, aff: { nami: 50, rem: 100, marin: 100 } });
  await p.evaluate(() => __SH.chatPush('nami', { text: '🍊 Nami: Hey! Meet me at the beach around 3pm?' }));
  await p.click('#btn-phone'); await p.waitForTimeout(200);
  await p.click('#modal .tabs .btn:has-text("WhatsUp")'); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/g12-chats.png' });
  console.log('chat rows:', await p.$$eval('.wa-row', (e) => e.map((x) => x.innerText.replace(/\s+/g, ' ').trim())));
  await p.click('.wa-row:has-text("Nami")'); await p.waitForTimeout(200);
  await p.click('.wa-chip:has-text("Hey")'); await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/g13-typing.png' });
  await p.waitForTimeout(1000);
  await p.click('.wa-chip:has-text("meet up")'); await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/g14-chat.png' });
  console.log('nami bubbles:', await p.$$eval('.wa-msg', (e) => e.map((x) => x.innerText.replace(/\s+/g, ' '))));
  console.log('invites:', JSON.stringify(await p.evaluate(() => __SH.state.invites)));
  await p.click('.wa-back'); await p.waitForTimeout(200);
  await p.click('.wa-row:has-text("Girlfriends")'); await p.waitForTimeout(200);
  await p.click('.wa-chip:has-text("Morning")'); await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + '/g15-group.png' });
  console.log('group bubbles:', await p.$$eval('.wa-msg', (e) => e.length));
  await p.click('#modal-close');

  }
  if (START <= 9) {
  // 9. guide from the phone and the wardrobe cosplay option
  await p.click('#btn-phone'); await p.waitForTimeout(200);
  await p.click('#modal .tabs .btn >> nth=3'); await p.waitForTimeout(200);
  await p.click('#modal .btn:has-text("Walkthrough")'); await p.waitForTimeout(200);
  await p.click('#modal .tabs .btn:has-text("Girls")'); await p.waitForTimeout(200);
  await p.click('.guide-girl:has-text("Yumeko") summary'); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/g16-guide.png' });
  await p.click('#modal .tabs .btn:has-text("Fun")'); await p.waitForTimeout(200);
  console.log('guide fun items:', await p.$$eval('.guide li', (e) => e.length));
  await p.click('#modal-close');
  await p.evaluate(() => __SH.openWardrobe('marin', 'normal')); await p.waitForTimeout(200);
  await p.click('.pill:has-text("Cosplay")'); await p.waitForTimeout(200);
  await p.click('.pill:has-text("Shizuku")'); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/g17-wardrobe.png' });
  console.log('marin daily wardrobe:', JSON.stringify(await p.evaluate(() => __SH.state.wardrobe.marin)), 'outfit', await p.evaluate(() => __SH.outfitFor('marin', null, 0, 0)));

  }
  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
