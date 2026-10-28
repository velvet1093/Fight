// Walk diagonally and with the joystick; the player's on-screen position must stay
// fixed and the camera must move in whole device pixels.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  p.on('pageerror', (e) => console.log('err', e.message));
  await p.goto('file://' + process.cwd() + '/index.html?debug&quiet');
  await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __SH.newState('Aki'); S.time = 600; __SH.state = S; __SH.initNPCs(); S.inside = null; S.px = 24 * 16 + 8; S.py = 21 * 16 + 12; __SH.enterWorld(); });
  const sample = async (label) => {
    const out = [];
    for (let i = 0; i < 40; i++) { out.push(await p.evaluate(() => __SH.screenPos())); await p.waitForTimeout(16); }
    const sx = new Set(out.map((o) => o[0])), sy = new Set(out.map((o) => o[1]));
    const fracCam = out.some((o) => Math.abs(o[2] - Math.round(o[2])) > 1e-6 || Math.abs(o[3] - Math.round(o[3])) > 1e-6);
    console.log(label, 'player screen x values:', [...sx].map((v) => +v.toFixed(3)), 'y values:', [...sy].map((v) => +v.toFixed(3)), 'camera off-pixel:', fracCam);
  };
  await p.keyboard.down('ArrowRight'); await p.keyboard.down('ArrowDown');
  await sample('diagonal');
  await p.keyboard.up('ArrowRight'); await p.keyboard.up('ArrowDown');
  await p.mouse.move(200, 500); await p.mouse.down(); await p.mouse.move(160, 470, { steps: 5 });
  await sample('joystick');
  await p.mouse.up();
  await b.close();
})();
