// The run button, per-girl lines, wardrobe part colours, typed chat, pixel
// icons, and loading an old save that still has Rei in it.
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
    const S = __SH.newState('Aki'); S.day = 3; S.time = o.time || 780; S.weather = 'sunny'; S.money = 300;
    for (const [id, aff] of Object.entries(o.aff || {})) Object.assign(S.girls[id], { met: true, aff, dates: 3, gf: aff >= 100 });
    __SH.state = S; __SH.initNPCs();
    for (const n of Object.values(__SH.npcs)) { n.path = []; n.idle = 99; }
    S.inside = null; S.px = 20 * 16 + 8; S.py = 25 * 16 + 12; __SH.enterWorld();
  }, o);

  // 1. old save with Rei: she's gone, nothing breaks
  await p.evaluate(() => {
    const S = __SH.newState('Old');
    S.girls.rei = { met: true, aff: 80, gf: true };
    S.invites = [{ id: 'rei', place: 'dojo', start: 900, end: 1020, done: false }, { id: 'nami', place: 'park', start: 900, end: 1020, done: false }];
    S.msgs = [{ day: 1, from: 'rei', text: '⚔️ Rei: ...hello.' }, { day: 1, from: 'nami', text: '🍊 Nami: hi' }];
    S.photos = [{ ids: ['rei', 'nami'], day: 1 }, { ids: ['nami'], day: 1 }];
    S.endingsSeen = ['rei'];
    S.wardrobe = { rei: { pj: 'gown' } };
    localStorage.setItem('sakura-hearts-slot-1', JSON.stringify({ v: 3, savedAt: Date.now(), state: S }));
  });
  await p.evaluate(() => __SH.loadSlot(1)); await p.waitForTimeout(800);
  console.log('old save:', JSON.stringify(await p.evaluate(() => { const S = __SH.state; return { rei: 'rei' in S.girls, invites: S.invites.map((v) => v.id), msgs: S.msgs.map((m) => m.from), photos: S.photos.length, endings: S.endingsSeen, wardrobe: Object.keys(S.wardrobe), girls: Object.keys(S.girls).length, mode: __SH.mode }; })));

  // 2. run: faster than walking
  await setup({});
  const dist = async (run) => {
    await p.evaluate(() => { const S = __SH.state; S.px = 20 * 16 + 8; S.py = 25 * 16 + 12; });
    if (run) await p.click('#btn-run');
    await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500); await p.keyboard.up('ArrowRight');
    if (run) await p.click('#btn-run');
    return Math.round(await p.evaluate(() => __SH.state.px - (20 * 16 + 8)));
  };
  console.log('walk distance', await dist(false), 'run distance', await dist(true));

  // 3. her own refusal lines, never the same twice in a row
  await setup({ aff: { kurumi: 5, frieren: 5 } });
  const lines = {};
  for (const id of ['kurumi', 'frieren']) {
    await p.evaluate((id) => { const n = __SH.npcs[id], S = __SH.state; n.inside = null; n.room = null; n.x = S.px + 16; n.y = S.py; __SH.girlMenu(id); }, id); await adv();
    lines[id] = [];
    for (let k = 0; k < 3; k++) { await p.click('#menu .btn:has-text("Ask on a date")'); await p.waitForTimeout(450); lines[id].push((await p.textContent('#dialog .text, #dialog')).replace(/\s+/g, ' ').trim().slice(0, 70)); await adv(); }
    await p.click('#menu .btn:has-text("Goodbye")').catch(() => {}); await adv();
  }
  console.log('date refusals:', JSON.stringify(lines));
  console.log('back-to-back repeats:', Object.values(lines).some((l) => l.some((x, i) => i && x === l[i - 1])));

  // 4. wardrobe part colours persist and reach the walker
  await setup({ aff: { marin: 50 } });
  await p.evaluate(() => __SH.openWardrobe('marin', 'casual')); await p.waitForTimeout(200);
  const parts = await p.$$eval('.pill.part', (e) => e.map((x) => x.innerText));
  await p.click('.pill.part >> nth=0'); await p.waitForTimeout(100);
  await p.click('.wrow:has-text("Colour:") .swatch >> nth=16'); await p.waitForTimeout(150);
  await p.screenshot({ path: OUT + '/u1-wardrobe.png' });
  await p.click('#modal-close');
  console.log('marin parts:', parts.join(', '), '| saved', JSON.stringify(await p.evaluate(() => __SH.state.wardrobe.marin)));

  // 5. typed chat: understands, remembers, invites
  await setup({ aff: { rem: 60, nami: 100, marin: 100 } });
  await p.click('#btn-phone'); await p.waitForTimeout(150);
  await p.click('#modal .tabs .btn:has-text("WhatsUp")'); await p.waitForTimeout(150);
  await p.click('.wa-row:has-text("Rem")'); await p.waitForTimeout(150);
  const say = async (msg) => { await p.fill('.wa-input input', msg); await p.press('.wa-input input', 'Enter'); await p.waitForFunction(() => !__SH.state.chatTyping, null, { timeout: 5000 }); await p.waitForTimeout(120); return (await p.$$eval('.wa-msg.in', (e) => e.slice(-1)[0].innerText.replace(/\s+/g, ' '))); };
  for (const m of ['hello rem', 'how are you?', 'I love cats', 'do you remember what I like?', 'you are stupid', 'sorry', 'good night']) console.log('  me:', m, '=> rem:', await say(m));
  await p.screenshot({ path: OUT + '/u2-chat.png' });
  await p.click('.wa-back'); await p.waitForTimeout(150);
  await p.click('.wa-row:has-text("Girlfriends")'); await p.waitForTimeout(150);
  console.log('  group:', await say('who wants ramen?'));
  await p.click('#modal-close');

  // 6. no raw emoji left in the visible UI
  await p.click('#btn-bag'); await p.waitForTimeout(200);
  const raw = await p.evaluate(() => { const re = /\p{Extended_Pictographic}/u; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const bad = []; while (tw.nextNode()) { const t = tw.currentNode.nodeValue; if (re.test(t) && !/[♥♡♠♣♦▶◀⬇⬜]/.test(t.match(re)[0])) bad.push(t.trim().slice(0, 30)); } return bad; });
  console.log('icons shown', await p.$$eval('img.ic', (e) => e.length), 'raw emoji text left:', JSON.stringify(raw.slice(0, 5)));
  await p.screenshot({ path: OUT + '/u3-bag.png' });

  console.log('errors:', errors.length ? errors : 'none');
  await b.close();
})();
