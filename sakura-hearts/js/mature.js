// Adult-proportioned, knee-up illustrations of Nami and Aqua (both adults in
// their own series), drawn on an 80x144 grid at roughly six heads tall instead
// of the chibi 48x64 portraits. Used for their private flirty-tease scene.
//   MATURE.has(id) · MATURE.get(id, pose, expr, blink) -> canvas
//   pose: 'stand' | 'hip' | 'lift'   expr: 'smile' | 'wink' | 'blush' | 'smug'
(function (global) {
  'use strict';
  const { Buf, tint } = PX;
  const W = 80, H = 144;
  const SKIN = { base: '#fde3cc', shade: '#efc2a2', deep: '#e0a888', blush: '#f59aa6', lip: '#d8707e', mouth: '#a8424e' };
  const INK = '#3a2030';

  const mx = (x) => W - x;
  const mirror = (pts) => pts.map(([x, y]) => [mx(x), y]);
  function layer(draw, amt = 0.5) { const b = new Buf(W, H); draw(b); b.outline(amt); return b; }

  // ------------------------------------------------------------ the cast
  const LOOK = {
    nami: {
      eye: ['#5a2a18', '#a5582f', '#e0a070'],
      hair: { base: '#f2913d', light: '#fbbd6c', dark: '#c8621e' },
      brow: '#c8621e',
      dress: { c: '#8ec5f0', d: '#5a96d6', l: '#c4e2fa' },
      sash: { c: '#f4b847', d: '#d08a2a', l: '#fff3c4' },
      undies: { c: '#ffffff', d: '#dfe6f0', trim: '#f2913d', bow: '#f2913d' },
    },
    aqua: {
      eye: ['#1f4fae', '#3f86e0', '#a0d0ff'],
      hair: { base: '#8fd3f7', light: '#d0f1ff', dark: '#4f9fd6' },
      brow: '#4f9fd6',
      vest: { c: '#3b5fc8', d: '#2a4596', l: '#5d82e0' },
      undies: { c: '#d8f0ff', d: '#a8d0f0', trim: '#ffffff', bow: '#3b5fc8' },
    },
  };

  // ------------------------------------------------------------ body parts
  // Face: a slimmer, longer adult jaw with small almond eyes.
  function head(b) {
    b.poly([[30, 16], [50, 16], [51, 27], [49, 33], [45, 38], [41, 40], [39, 40], [35, 38], [31, 33], [29, 27]], SKIN.base);
    b.rect(29, 26, 1, 4, SKIN.shade); b.rect(51, 26, 1, 4, SKIN.shade); // ears peek out
  }
  function neck(b) {
    b.poly([[36, 37], [44, 37], [45, 45], [35, 45]], SKIN.base);
    b.rect(36, 39, 8, 2, SKIN.shade);
    b.set(37, 41, SKIN.shade); b.set(42, 41, SKIN.shade);
  }
  // Torso skin under the clothes (shoulders, collarbones, neckline).
  function torso(b) {
    b.poly([[35, 43], [45, 43], [53, 46], [55, 50], [25, 50], [27, 46]], SKIN.base);
    b.line(33, 46, 38, 47, SKIN.shade); b.line(47, 46, 42, 47, SKIN.shade);
  }
  // Legs from the hips down to just above the knee (where the frame ends).
  function legs(b, stock) {
    b.poly([[29, 92], [40, 94], [39.5, 104], [38, 128], [37, 144], [30, 144], [29, 128], [28, 108]], SKIN.base);
    b.poly([[51, 92], [40, 94], [40.5, 104], [42, 128], [43, 144], [50, 144], [51, 128], [52, 108]], SKIN.base);
    b.line(39, 98, 38, 130, SKIN.shade); b.line(41, 98, 42, 130, SKIN.shade);
    b.line(29, 110, 29, 128, SKIN.shade);
    if (stock) {
      b.clip = true;
      b.rect(26, 116, 28, 28, stock.c);
      b.rect(26, 116, 28, 2, stock.d);
      b.line(33, 120, 33, 143, stock.l); b.line(47, 120, 47, 143, stock.l);
      b.clip = false;
    }
  }
  // Arms. pose decides where the hands go.
  function arms(b, pose, sleeve) {
    const c = SKIN.base, s = SKIN.shade;
    const armL = (pts) => b.poly(pts, c), armR = (pts) => b.poly(mirror(pts), c);
    if (pose === 'lift') {
      // both hands at the front hem, lifting it
      armL([[26, 47], [30, 48], [30, 62], [33, 80], [36, 88], [33, 90], [28, 81], [25, 63]]);
      armR([[26, 47], [30, 48], [30, 62], [33, 80], [36, 88], [33, 90], [28, 81], [25, 63]]);
      b.ellipse(34.5, 88.5, 3, 2.6, c); b.ellipse(45.5, 88.5, 3, 2.6, c);
      b.line(33, 87, 36, 87, s); b.line(44, 87, 47, 87, s);
    } else if (pose === 'hip') {
      // hands on her hips
      for (const f of [(q) => q, mirror]) {
        b.poly(f([[26, 47], [30, 48], [27, 62], [22, 65], [22, 58]]), c);
        b.poly(f([[22, 62], [26, 61], [34, 72], [31, 76]]), c);
      }
      b.ellipse(32.5, 74.5, 2.8, 2.4, c); b.ellipse(mx(32.5), 74.5, 2.8, 2.4, c);
    } else {
      // relaxed: hands lightly clasped in front
      armL([[26, 47], [30, 48], [30, 62], [33, 76], [37, 82], [34, 84], [28, 77], [25, 63]]);
      armR([[26, 47], [30, 48], [30, 62], [33, 76], [37, 82], [34, 84], [28, 77], [25, 63]]);
      b.ellipse(40, 83, 4, 2.6, c);
      b.line(38, 83, 42, 83, s);
    }
    if (sleeve) {
      // detached sleeves (Aqua): white with a blue cuff, over the upper arm
      const sl = (pts) => { b.poly(pts, sleeve.c); };
      if (pose === 'hip') {
        sl([[24, 49], [31, 49], [28, 62], [21, 67], [20, 58]]);
        sl(mirror([[24, 49], [31, 49], [28, 62], [21, 67], [20, 58]]));
        b.line(21, 67, 28, 62, sleeve.cuff); b.line(mx(21), 67, mx(28), 62, sleeve.cuff);
      } else {
        sl([[24, 50], [30, 50], [30, 62], [32, 72], [26, 74], [24, 63]]);
        sl(mirror([[24, 50], [30, 50], [30, 62], [32, 72], [26, 74], [24, 63]]));
        b.line(26, 74, 32, 72, sleeve.cuff); b.line(mx(26), 74, mx(32), 72, sleeve.cuff);
      }
    }
  }

  // ------------------------------------------------------------ face
  const EYES = {
    open: ['..kkkk', 'kkkkkk', 'kwppik', '.wiiil', '..lll.'],
    soft: ['......', '......', 'kkkkkk', '.wpiil', '..lll.'],
    shut: ['......', '......', '.kkkk.', 'k....k', '......'],
  };
  function face(b, L, expr, blink) {
    const pal = { k: INK, w: '#ffffff', p: L.eye[0], i: L.eye[1], l: L.eye[2] };
    let le = 'open', re = 'open';
    if (expr === 'wink') re = 'shut';
    if (expr === 'smug') { le = 'soft'; re = 'soft'; }
    if (blink && le === 'open') le = 'soft';
    if (blink && re === 'open') re = 'soft';
    b.map(31, 24, EYES[le], pal, false);
    b.map(43, 24, EYES[re], pal, true);
    if (le === 'open') b.set(34, 26, '#ffffff');
    if (re === 'open') b.set(45, 26, '#ffffff');
    // brows
    const br = L.brow;
    if (expr === 'smug') { b.line(31, 21, 36, 22, br); b.line(44, 22, 49, 21, br); }
    else { b.line(31, 22, 36, 21, br); b.line(44, 21, 49, 22, br); }
    // nose
    b.set(40, 31, SKIN.deep);
    // mouth
    if (expr === 'blush') { b.rect(39, 34, 3, 2, SKIN.mouth); b.set(40, 35, SKIN.lip); }
    else if (expr === 'smug' || expr === 'wink') { b.line(38, 35, 41, 35, SKIN.mouth); b.set(42, 34, SKIN.mouth); b.set(39, 36, SKIN.lip); }
    else { b.set(37, 34, SKIN.mouth); b.line(38, 35, 42, 35, SKIN.mouth); b.set(43, 34, SKIN.mouth); }
    if (expr === 'blush' || expr === 'wink' || expr === 'smile') {
      for (const x of [32, 34, 36]) b.set(x, 31, SKIN.blush);
      for (const x of [44, 46, 48]) b.set(x, 31, SKIN.blush);
      if (expr === 'blush') { b.rect(32, 30, 5, 1, tint(SKIN.blush, 0.4)); b.rect(44, 30, 5, 1, tint(SKIN.blush, 0.4)); }
    }
  }

  // ------------------------------------------------------------ Nami
  function namiHairBack(b, L) {
    const h = L.hair;
    b.ellipse(40, 21, 13, 12, h.base);
    // long loose waves down to her waist
    b.poly([[28, 18], [52, 18], [56, 34], [57, 56], [60, 70], [56, 74], [54, 80], [49, 76], [31, 76], [26, 80], [24, 74], [20, 70], [23, 56], [24, 34]], h.base);
    b.clip = true;
    b.line(24, 40, 22, 68, h.dark); b.line(56, 40, 58, 68, h.dark);
    b.line(27, 44, 26, 72, h.light); b.line(53, 44, 54, 72, h.light);
    b.clip = false;
  }
  function namiHairFront(b, L) {
    const h = L.hair;
    // side-swept bangs parted on her right
    b.poly([[28, 26], [28, 17], [33, 11], [41, 9], [48, 11], [52, 17], [53, 28], [50, 22], [47, 18], [44, 22], [43, 17], [38, 21], [34, 24], [31, 28], [29, 33]], h.base);
    // locks framing the face, falling over the shoulders
    b.poly([[28, 22], [26, 34], [25, 48], [27, 54], [30, 47], [31, 30]], h.base);
    b.poly([[52, 22], [54, 34], [55, 48], [53, 54], [50, 47], [49, 30]], h.base);
    b.clip = true;
    for (let x = 31; x <= 49; x++) { const dy = Math.round(Math.pow((x - 40) / 9, 2) * 3); if (x % 3) b.set(x, 13 + dy, h.light); }
    b.line(46, 15, 50, 22, h.dark); b.line(36, 15, 32, 24, h.dark);
    b.line(27, 34, 26, 48, h.dark); b.line(53, 34, 54, 48, h.dark);
    b.clip = false;
  }
  function namiDress(b, L, pose) {
    const d = L.dress, s = L.sash;
    // fitted sundress bodice with thin straps
    b.poly([[29, 49], [36, 52], [40, 51], [44, 52], [51, 49], [52, 55], [50, 62], [47, 69], [48, 76], [32, 76], [33, 69], [30, 62], [28, 55]], d.c);
    b.rect(31, 44, 2, 6, d.c); b.rect(47, 44, 2, 6, d.c);
    b.clip = true;
    b.line(31, 60, 35, 62, d.d); b.line(36, 62, 39, 61, d.d); b.line(49, 60, 45, 62, d.d); b.line(44, 62, 41, 61, d.d); b.line(40, 62, 40, 74, d.d);
    b.line(33, 64, 34, 70, d.d); b.line(47, 64, 46, 70, d.d);
    b.line(30, 52, 34, 54, d.l); b.line(46, 54, 50, 52, d.l);
    b.clip = false;
    // checkered sash at the waist, with a bow on one side
    b.rect(31, 72, 18, 4, s.c);
    for (let x = 31; x < 49; x += 2) { b.set(x, 72, s.l); b.set(x + 1, 74, s.l); }
    b.poly([[47, 72], [53, 69], [54, 77], [48, 76]], s.c);
    b.poly([[48, 76], [51, 86], [48, 88], [46, 77]], s.c);
    b.line(49, 77, 50, 85, s.d);
    // skirt: flared to mid-thigh, or lifted at the front
    if (pose === 'lift') {
      b.poly([[31, 76], [49, 76], [55, 92], [57, 104], [51, 100], [47, 90], [44, 88], [40, 86], [36, 88], [33, 90], [29, 100], [23, 104], [25, 92]], d.c);
      b.clip = true;
      b.line(27, 92, 24, 102, d.d); b.line(53, 92, 56, 102, d.d);
      b.line(34, 84, 30, 96, d.l); b.line(46, 84, 50, 96, d.l);
      b.clip = false;
      b.line(36, 88, 44, 88, d.d);
    } else {
      b.poly([[31, 76], [49, 76], [55, 92], [58, 106], [22, 106], [25, 92]], d.c);
      b.clip = true;
      for (const x of [28, 34, 40, 46, 52]) b.line(x + (x - 40) * 0.05, 82, x + (x - 40) * 0.2, 105, d.d);
      b.line(31, 80, 27, 102, d.l); b.line(43, 80, 44, 102, d.l);
      b.clip = false;
      b.rect(22, 105, 36, 1, d.d);
    }
    // little white flower print
    const dots = pose === 'lift' ? [[34, 60], [45, 64], [28, 96], [52, 96], [38, 68]] : [[34, 60], [45, 64], [30, 90], [40, 96], [50, 88], [36, 102], [47, 101], [38, 68]];
    for (const [x, y] of dots) { b.set(x, y, '#ffffff'); b.set(x + 1, y, '#f08aa8'); b.set(x + 1, y - 1, '#ffffff'); b.set(x + 2, y, '#ffffff'); b.set(x + 1, y + 1, '#ffffff'); }
  }
  function namiTattoo(b) {
    // her pinwheel-and-tangerine tattoo on the left shoulder
    b.set(27, 52, '#4a7ad0'); b.set(26, 53, '#4a7ad0'); b.set(28, 53, '#4a7ad0'); b.set(27, 54, '#4a7ad0');
    b.set(27, 53, '#f2913d');
  }

  // ------------------------------------------------------------ Aqua
  function aquaHairBack(b, L) {
    const h = L.hair;
    b.ellipse(40, 21, 13, 12, h.base);
    // very long straight hair down past her hips
    b.poly([[28, 16], [52, 16], [56, 34], [58, 80], [60, 100], [54, 102], [50, 96], [30, 96], [26, 102], [20, 100], [22, 80], [24, 34]], h.base);
    // hair loop on top
    b.ellipse(40, 6, 5, 5, h.base);
    b.clip = true;
    b.line(23, 40, 22, 98, h.dark); b.line(57, 40, 58, 98, h.dark);
    b.line(26, 44, 25, 94, h.light); b.line(54, 44, 55, 94, h.light);
    b.clip = false;
    // hole in the loop
    for (let y = 3; y <= 8; y++) for (let x = 38; x <= 42; x++) { const dx = (x + 0.5 - 40) / 2.2, dy = (y + 0.5 - 6) / 2.4; if (dx * dx + dy * dy <= 1) b.d[y * W + x] = null; }
  }
  function aquaHairFront(b, L) {
    const h = L.hair;
    b.poly([[28, 27], [28, 17], [33, 11], [40, 10], [47, 11], [52, 17], [52, 27], [49, 21], [46, 24], [44, 18], [41, 23], [38, 18], [35, 24], [32, 20], [30, 26]], h.base);
    // long locks in front of the shoulders, tied low with blue rings
    b.poly([[28, 20], [26, 36], [25, 62], [27, 70], [30, 64], [31, 32]], h.base);
    b.poly([[52, 20], [54, 36], [55, 62], [53, 70], [50, 64], [49, 32]], h.base);
    b.clip = true;
    for (let x = 31; x <= 49; x++) { const dy = Math.round(Math.pow((x - 40) / 9, 2) * 3); if (x % 3) b.set(x, 13 + dy, h.light); }
    b.line(27, 36, 26, 60, h.dark); b.line(53, 36, 54, 60, h.dark);
    b.clip = false;
    b.rect(25, 56, 5, 2, '#3a6fd0'); b.rect(50, 56, 5, 2, '#3a6fd0');
    // hair ornament
    b.rect(37, 12, 6, 2, '#3a6fd0'); b.set(39, 12, '#7fa8f5');
  }
  function aquaOutfit(b, L, pose) {
    const v = L.vest;
    // blue vest with a white collar and a green bow, bare shoulders
    b.poly([[29, 49], [51, 49], [52, 55], [50, 62], [47, 70], [48, 78], [32, 78], [33, 70], [30, 62], [28, 55]], v.c);
    b.poly([[33, 47], [47, 47], [44, 53], [36, 53]], '#f4f7ff');
    b.rect(33, 53, 6, 3, '#5ccf8a'); b.rect(41, 53, 6, 3, '#5ccf8a'); b.rect(39, 53, 2, 3, '#2f9a5c');
    b.rect(39, 56, 2, 18, '#f2d36b');
    b.clip = true;
    b.line(31, 60, 35, 62, v.d); b.line(49, 60, 45, 62, v.d); b.line(33, 64, 34, 70, v.d); b.line(47, 64, 46, 70, v.d);
    b.line(30, 52, 33, 56, v.l);
    b.clip = false;
    b.rect(31, 76, 18, 2, '#f4f7ff');
    // pleated skirt with a gold hem
    if (pose === 'lift') {
      b.poly([[31, 78], [49, 78], [55, 92], [57, 104], [51, 100], [47, 90], [44, 88], [40, 86], [36, 88], [33, 90], [29, 100], [23, 104], [25, 92]], v.c);
      b.line(23, 104, 29, 100, '#f2d36b'); b.line(51, 100, 57, 104, '#f2d36b');
      b.line(33, 90, 47, 90, '#f2d36b'); b.line(36, 88, 44, 88, '#f2d36b');
      b.clip = true;
      for (const x of [27, 31, 49, 53]) b.line(x, 84, x + (x < 40 ? -2 : 2), 102, v.d);
      b.clip = false;
    } else {
      b.poly([[31, 78], [49, 78], [55, 92], [58, 104], [22, 104], [25, 92]], v.c);
      b.clip = true;
      for (let x = 24; x <= 56; x += 4) b.line(40 + (x - 40) * 0.6, 80, x, 103, v.d);
      b.clip = false;
      b.rect(22, 103, 36, 2, '#f2d36b');
    }
  }

  // ------------------------------------------------------------ underwear
  // Only shown in the 'lift' pose: plain, fully covering briefs with a bow.
  function undies(b, U) {
    b.poly([[32, 88], [48, 88], [49, 92], [44, 97], [41, 100], [39, 100], [36, 97], [31, 92]], U.c);
    b.line(32, 88, 48, 88, U.trim);
    b.line(31, 92, 36, 97, U.d); b.line(49, 92, 44, 97, U.d);
    b.set(39, 89, U.bow); b.set(41, 89, U.bow); b.set(40, 90, U.bow);
  }

  // ------------------------------------------------------------ build
  const cache = new Map();
  function build(id, pose, expr, blink) {
    const L = LOOK[id];
    const isNami = id === 'nami';
    const stock = isNami ? null : { c: '#f4f7ff', d: '#3a6fd0', l: '#ffffff' };
    const sleeve = isNami ? null : { c: '#f4f7ff', cuff: '#3a6fd0' };
    const out = new Buf(W, H);
    out.draw(layer((b) => (isNami ? namiHairBack : aquaHairBack)(b, L)));
    out.draw(layer((b) => legs(b, stock)));
    if (pose === 'lift') out.draw(layer((b) => undies(b, L.undies), 0.4));
    out.draw(layer((b) => { torso(b); if (isNami) namiTattoo(b); }));
    out.draw(layer((b) => (isNami ? namiDress : aquaOutfit)(b, L, pose)));
    out.draw(layer((b) => { neck(b); head(b); }));
    out.draw(layer((b) => arms(b, pose, sleeve)));
    // eyes, brows and mouth are unoutlined detail painted onto the head
    const f = new Buf(W, H); face(f, L, expr, blink); out.draw(f);
    out.draw(layer((b) => (isNami ? namiHairFront : aquaHairFront)(b, L)));
    return out.toCanvas(1);
  }
  function get(id, pose = 'stand', expr = 'smile', blink = false) {
    const k = [id, pose, expr, blink ? 1 : 0].join('|');
    if (!cache.has(k)) cache.set(k, build(id, pose, expr, blink));
    return cache.get(k);
  }
  const has = (id) => !!LOOK[id];

  global.MATURE = { get, has, W, H };
})(window);
