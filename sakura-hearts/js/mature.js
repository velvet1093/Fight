// Adult-proportioned art of Nami and Aqua (both adults in their own series)
// for their private flirty-tease scene, in a bold anime cel style: ink
// outlines, hard two-tone shadows, saturated colours. About 6.3 heads tall,
// never the chibi proportions. Drawn on a 56x72 knee-up grid at 2x
// (112x144, the height of a scene).
//   MATURE.get(id, pose, expr, blink) -> canvas · MATURE.has(id) · MATURE.W, MATURE.H
//   pose: 'stand' | 'hip' | 'lift'   expr: 'smile' | 'wink' | 'smug' | 'blush'
(function (global) {
  'use strict';
  const { Buf } = PX;
  const K = 2, BW = 56, BH = 72, W = BW * K, H = BH * K;
  const INK = '#1e0e14';
  const SKIN = { base: '#fde0c8', shade: '#e6a48c', blush: '#f0788a', mouth: '#a02a3a', tongue: '#e8737f' };

  const S = (pts) => pts.map(([x, y]) => [x * K, y * K]);
  const mir = (pts) => pts.map(([x, y]) => [BW - x, y]);
  const Pl = (b, pts, c) => b.poly(S(pts), c);
  const El = (b, x, y, rx, ry, c) => b.ellipse(x * K, y * K, rx * K, ry * K, c);
  const Ln = (b, x0, y0, x1, y1, c) => b.line(x0 * K, y0 * K, x1 * K, y1 * K, c);
  const R = (b, x, y, w, h, c) => b.rect(Math.round(x * K), Math.round(y * K), Math.max(1, Math.round(w * K)), Math.max(1, Math.round(h * K)), c);
  const shadow = (b, pts, c) => { b.clip = true; Pl(b, pts, c); b.clip = false; };
  const inked = (b) => { b.outline(0, INK); return b; };
  // a limb: tapered quads between joints, round joints
  function limb(b, pts, ws, c) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      Pl(b, [[x0 + nx * ws[i], y0 + ny * ws[i]], [x1 + nx * ws[i + 1], y1 + ny * ws[i + 1]], [x1 - nx * ws[i + 1], y1 - ny * ws[i + 1]], [x0 - nx * ws[i], y0 - ny * ws[i]]], c);
    }
    pts.forEach(([x, y], i) => El(b, x, y, ws[i], ws[i], c));
  }

  // ---------------------------------------------------------------- cast
  const LOOK = {
    nami: {
      hair: { base: '#ff8a2a', light: '#ffc070', dark: '#c45210', shine: '#fff0c0' },
      eye: { p: '#3a1408', i: '#b8581e', l: '#f0a050' },
      undies: { c: '#ffffff', d: '#d8dce8', trim: '#ff8a2a' },
      hairBack(b, h) {
        El(b, 28, 11, 10, 9.5, h.base);
        // side ponytail with spiky ends, falling past her shoulder
        Pl(b, [[33, 3], [39, 5], [43, 10], [45, 16], [43, 18], [47, 23], [44, 25], [47, 31], [43, 31], [45, 37], [41, 35], [41, 41], [38, 37], [37, 29], [36, 18], [34, 10]], h.base);
        Pl(b, [[19, 7], [17, 14], [17, 21], [20, 22], [21, 13]], h.base);
        shadow(b, [[39, 8], [43, 14], [42, 18], [45, 23], [42, 25], [43, 30], [40, 29], [38, 18]], h.dark);
        shadow(b, [[20, 16], [36, 16], [36, 22], [20, 22]], h.dark);
        b.clip = true; Ln(b, 41, 10, 44, 16, h.light); Ln(b, 42, 22, 44, 27, h.light); b.clip = false;
      },
      hairFront(b, h) {
        Pl(b, [[18, 14], [19, 7], [23, 3], [28, 2], [33, 3], [37, 7], [38, 15], [36.5, 11], [35, 8], [34, 9.6], [32, 7], [30, 9], [28, 6.4], [26, 9], [24, 7], [22, 9.6], [21, 8], [19.5, 14], [19, 17]], h.base);
        Pl(b, [[33, 2], [36, 2], [36, 4], [33, 4]], '#3f63c9');
      },
      outfit(b, pose) {
        const d = { c: '#5aaaf0', d: '#2e6ec8', l: '#a8dcff', hem: '#1e4ea0' }, s = { c: '#ffc02a', d: '#d07a10', l: '#fff0a0' };
        // sundress bodice and straps
        Pl(b, [[19, 24], [23, 23], [26, 25], [28, 24], [30, 25], [33, 23], [37, 24], [37, 28], [35, 31], [34, 35], [22, 35], [21, 31], [19, 28]], d.c);
        Pl(b, [[21, 20], [22, 20], [22, 24], [21, 24]], d.c); Pl(b, mir([[21, 20], [22, 20], [22, 24], [21, 24]]), d.c);
        // skirt, hanging or lifted at the front
        if (pose === 'lift') Pl(b, [[21, 36], [35, 36], [38, 44], [40, 52], [36.5, 50], [34, 45], [28, 42.6], [22, 45], [19.5, 50], [16, 52], [18, 44]], d.c);
        else Pl(b, [[21, 36], [35, 36], [38, 44], [40, 52], [16, 52], [18, 44]], d.c);
        // checkered sash with flowing ends
        Pl(b, [[20, 34], [36, 34], [36, 36], [20, 36]], s.c);
        Pl(b, [[20, 34], [15, 37], [11, 43], [13, 45], [15, 43], [16, 46], [18, 41], [21, 37]], s.c);
        Pl(b, [[36, 34], [41, 37], [45, 43], [43, 45], [41, 43], [40, 46], [38, 41], [35, 37]], s.c);
        // cel shading
        shadow(b, [[31, 25], [37, 24], [37, 28], [35, 31], [34, 35], [31, 35]], d.d);
        shadow(b, [[21, 29], [25, 30], [28, 29.6], [31, 30], [35, 29], [35, 30.6], [21, 30.6]], d.d);
        shadow(b, pose === 'lift' ? [[31, 36], [35, 36], [38, 44], [40, 52], [36, 50], [33, 44]] : [[31, 36], [35, 36], [38, 44], [40, 52], [33, 52]], d.d);
        b.clip = true;
        Ln(b, 21, 26, 23, 28, d.l); Ln(b, 20, 40, 18, 49, d.l);
        if (pose !== 'lift') { for (const x of [24, 28]) Ln(b, x, 38, x + (x - 28) * 0.3, 51, d.d); Pl(b, [[16, 51], [40, 51], [40, 52], [16, 52]], d.hem); }
        else { Ln(b, 22, 45, 28, 42.6, d.hem); Ln(b, 28, 42.6, 34, 45, d.hem); Ln(b, 34, 45, 36.5, 50, d.hem); Ln(b, 22, 45, 19.5, 50, d.hem); }
        for (let x = 20; x < 36; x += 2) R(b, x, 34, 1, 1, s.l);
        Ln(b, 19, 37, 13, 43, s.l); Ln(b, 37, 37, 43, 43, s.d);
        b.clip = false;
        const dots = pose === 'lift' ? [[23, 26], [32, 27], [27, 32], [20, 46], [24, 39], [33, 40], [37, 48]] : [[23, 26], [32, 27], [27, 32], [20, 45], [26, 41], [33, 43], [29, 48], [36, 49]];
        for (const [x, y] of dots) { R(b, x, y, 3, 1, '#ffffff'); R(b, x + 1, y - 1, 1, 3, '#ffffff'); R(b, x + 1, y, 1, 1, '#ff5a8a'); }
        // her tattoo, on the left shoulder
        El(b, 20.2, 22.6, 0.9, 0.9, '#3a6ad0'); R(b, 20, 22.4, 0.5, 0.5, '#ff8a2a');
      },
    },
    aqua: {
      hair: { base: '#7cc8f4', light: '#c4ecff', dark: '#3e8ed0', shine: '#ffffff' },
      eye: { p: '#14306e', i: '#2f78d8', l: '#9ccfff' },
      undies: { c: '#d4eeff', d: '#9cc8ec', trim: '#ffffff' },
      hairBack(b, h) {
        El(b, 28, 11, 10, 9.5, h.base);
        // very long straight hair down past her hips, and the hair loop on top
        Pl(b, [[19, 6], [37, 6], [40, 16], [41, 40], [42, 60], [38, 62], [36, 58], [20, 58], [18, 62], [14, 60], [15, 40], [16, 16]], h.base);
        El(b, 28, 1.6, 2.6, 2.2, h.base);
        shadow(b, [[33, 14], [40, 16], [41, 40], [42, 60], [38, 62], [36, 40]], h.dark);
        shadow(b, [[20, 16], [36, 16], [36, 22], [20, 22]], h.dark);
        b.clip = true; Ln(b, 17, 24, 16.5, 56, h.light); b.clip = false;
        b.clip = false; El(b, 28, 1.6, 1.1, 0.9, null);
        for (let y = 0; y < 3 * K + 2; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5) / K - 28, dy = (y + 0.5) / K - 1.6; if ((dx * dx) / 1.2 + (dy * dy) / 0.8 <= 1) b.d[y * W + x] = null; }
      },
      hairFront(b, h) {
        Pl(b, [[18, 15], [19, 7], [23, 3.4], [28, 2.6], [33, 3.4], [37, 7], [38, 15], [36.6, 11], [35, 8.4], [33.6, 10], [31.6, 7.4], [29.6, 9.4], [28, 7], [26.4, 9.4], [24.4, 7.4], [22.4, 10], [21, 8.4], [19.4, 14], [19, 18]], h.base);
        // long locks in front of the shoulders, tied with blue rings
        Pl(b, [[19, 12], [17.4, 20], [17, 34], [18.6, 38], [20.2, 34], [20.6, 20]], h.base);
        Pl(b, mir([[19, 12], [17.4, 20], [17, 34], [18.6, 38], [20.2, 34], [20.6, 20]]), h.base);
        b.clip = true; Ln(b, 36.6, 20, 37.4, 34, h.dark); b.clip = false;
        R(b, 17.2, 31, 3, 1, '#2f5fd0'); R(b, BW - 20.2, 31, 3, 1, '#2f5fd0');
        R(b, 25.6, 3.4, 4.8, 1.2, '#2f5fd0');
      },
      outfit(b, pose) {
        const v = { c: '#2f5fd0', d: '#1e3c98', l: '#5a8af0', hem: '#f4c84a' };
        // blue vest, white collar, green bow, gold stripe
        Pl(b, [[19, 24], [37, 24], [37, 28], [35, 31], [34, 36], [22, 36], [21, 31], [19, 28]], v.c);
        Pl(b, [[23, 22.6], [33, 22.6], [31, 26], [25, 26]], '#f8f8ff');
        Pl(b, [[24, 26], [27.4, 25.6], [27.4, 28], [24, 28.4]], '#3ec880'); Pl(b, mir([[24, 26], [27.4, 25.6], [27.4, 28], [24, 28.4]]), '#3ec880'); El(b, 28, 27, 1, 1, '#1e9a5a');
        R(b, 27.4, 28.4, 1.2, 6, v.hem);
        R(b, 21, 35, 14, 1.4, '#f8f8ff');
        // pleated skirt with a gold hem, hanging or lifted at the front
        if (pose === 'lift') Pl(b, [[21, 36.4], [35, 36.4], [38, 44], [40, 51], [36.5, 49], [34, 44.6], [28, 42.4], [22, 44.6], [19.5, 49], [16, 51], [18, 44]], v.c);
        else Pl(b, [[21, 36.4], [35, 36.4], [38, 44], [40, 51], [16, 51], [18, 44]], v.c);
        shadow(b, [[31, 24], [37, 24], [37, 28], [35, 31], [34, 36], [31, 36]], v.d);
        shadow(b, pose === 'lift' ? [[31, 36.4], [35, 36.4], [38, 44], [40, 51], [36.5, 49], [33, 44]] : [[31, 36.4], [35, 36.4], [38, 44], [40, 51], [33, 51]], v.d);
        b.clip = true;
        if (pose !== 'lift') { for (const x of [20, 24, 28, 32, 36]) Ln(b, 28 + (x - 28) * 0.55, 37, x, 50.6, v.d); Pl(b, [[16, 50], [40, 50], [40, 51], [16, 51]], v.hem); }
        else { Ln(b, 22, 44.6, 28, 42.4, v.hem); Ln(b, 28, 42.4, 34, 44.6, v.hem); Ln(b, 34, 44.6, 36.5, 49, v.hem); Ln(b, 22, 44.6, 19.5, 49, v.hem); Ln(b, 16, 50.6, 19.5, 49, v.hem); Ln(b, 36.5, 49, 40, 50.6, v.hem); }
        Ln(b, 20.4, 26, 21.6, 30, v.l);
        b.clip = false;
      },
      legwear(b) {
        // white thigh-high stockings with blue bands
        const st = [[21, 58], [27.4, 58], [26.3, 66], [26, 73], [22.4, 73], [22, 66]];
        Pl(b, st, '#f8f8ff'); Pl(b, mir(st), '#f8f8ff');
        Pl(b, [[21, 58], [27.4, 58], [27.3, 59.2], [21.1, 59.2]], '#2f5fd0'); Pl(b, mir([[21, 58], [27.4, 58], [27.3, 59.2], [21.1, 59.2]]), '#2f5fd0');
        shadow(b, mir([[21, 59], [24, 59], [23.6, 73], [22.4, 73]]), '#c8d0e8');
      },
      sleeves(b, pose) {
        // white detached sleeves with blue cuffs, over the upper arm
        const arm = pose === 'hip' ? [[15.2, 23], [20.6, 23], [17, 31], [12.4, 30]] : pose === 'lift' ? [[16, 23], [21, 23], [20.6, 32], [16.4, 33]] : [[16.4, 23], [20.8, 23], [20.6, 33], [16.6, 33]];
        Pl(b, arm, '#f8f8ff'); Pl(b, mir(arm), '#f8f8ff');
        const cuff = [arm[2], arm[3]];
        for (const pts of [cuff, mir(cuff)]) Ln(b, pts[0][0], pts[0][1], pts[1][0], pts[1][1], '#2f5fd0');
        shadow(b, mir([[16.4, 23], [18, 23], [18, 33], [16.6, 33]]), '#c8d0e8');
      },
    },
  };

  function arms(b, pose) {
    const c = SKIN.base;
    for (const side of [0, 1]) {
      const f = side ? mir : (p) => p;
      let pts;
      if (pose === 'hip') pts = [[18.6, 23], [14, 30.4], [20.4, 35]];
      else if (pose === 'lift') pts = [[18.6, 23], [18.4, 32.6], [23.4, 43.4]];
      else pts = [[18.6, 23], [18.6, 34], [18.4, 45.4]];
      limb(b, f(pts), [1.6, 1.3, 1.1], c);
      const [hx, hy] = f([pts[2]])[0];
      El(b, hx, hy + (pose === 'stand' ? 0.8 : 0), 1.6, 1.4, c);
    }
    // cel shading: the far arm, the near forearm
    shadow(b, mir(pose === 'hip' ? [[19, 22], [21, 22], [16, 31.6], [13, 31]] : pose === 'lift' ? [[17, 22], [18.6, 22], [18.6, 33], [17, 33]] : [[17, 22], [18, 22], [18, 47], [17, 47]]), SKIN.shade);
  }
  function legs(b, look, pose) {
    const leg = [[21, pose === 'lift' ? 44 : 48], [28, pose === 'lift' ? 44 : 48], [27, 58], [26.3, 66], [26, 73], [22.4, 73], [22, 66], [21, 58]];
    Pl(b, leg, SKIN.base); Pl(b, mir(leg), SKIN.base);
    shadow(b, mir([[21, 44], [24.6, 44], [24, 58], [23.6, 73], [22.4, 73], [22, 66], [21, 58]]), SKIN.shade);
    if (pose !== 'lift') shadow(b, [[15, 51], [41, 51], [41, 53.2], [15, 53.2]], SKIN.shade);
    else shadow(b, [[15, 50], [22, 46], [34, 46], [41, 50], [41, 52], [34, 47.4], [22, 47.4], [15, 52]], SKIN.shade);
    if (look.legwear) look.legwear(b);
  }
  // Only in the 'lift' pose: plain, fully covering briefs with a little bow.
  function undies(b, U) {
    Pl(b, [[22.4, 44], [33.6, 44], [33.4, 46.4], [30.6, 49], [25.4, 49], [22.6, 46.4]], U.c);
    shadow(b, [[30, 44], [33.6, 44], [33.4, 46.4], [30.6, 49], [29, 49]], U.d);
    b.clip = true; Ln(b, 22.4, 44.2, 33.6, 44.2, U.trim); b.clip = false;
    R(b, 27.2, 44.6, 0.6, 0.6, U.trim); R(b, 28.2, 44.6, 0.6, 0.6, U.trim); R(b, 27.7, 45.1, 0.6, 0.6, U.trim);
  }
  function headShape(b) {
    Pl(b, [[21, 7], [35, 7], [36, 11], [35, 14], [32, 17], [29, 18], [27, 18], [24, 17], [21, 14], [20, 11]], SKIN.base);
    shadow(b, [[32, 8], [36, 8], [36, 11], [35, 14], [32, 17], [33, 12]], SKIN.shade);
    shadow(b, [[20, 7], [36, 7], [36, 8.4], [20, 8.4]], SKIN.shade);
  }
  function face(b, look, expr, blink) {
    const E = look.eye;
    for (const s of [-1, 1]) {
      const ex = (28 + s * 4.6) * K, ey = 11.4 * K, ew = 2.6 * K, eh = 2.4 * K;
      const shut = (s > 0 && expr === 'wink') || blink;
      if (shut) {
        for (let i = 0; i < 2; i++) { b.line(ex - ew, ey + i, ex, ey - eh * 0.4 + i, INK); b.line(ex, ey - eh * 0.4 + i, ex + ew, ey + i, INK); }
        continue;
      }
      const half = expr === 'smug';
      b.ellipse(ex, ey + 1, ew, eh, '#ffffff');
      b.ellipse(ex - s * 0.5, ey + 1.5, ew * 0.72, eh * 0.95, E.i);
      b.ellipse(ex - s * 0.5, ey + 2, ew * 0.5, eh * 0.62, E.p);
      b.rect(Math.round(ex - ew * 0.6), Math.round(ey + eh * 0.55), Math.round(ew * 1.1), 1, E.l);
      b.rect(Math.round(ex - ew * 0.45), Math.round(ey - eh * 0.2), 2, 2, '#ffffff');
      if (half) b.rect(Math.round(ex - ew - 1), Math.round(ey - eh), Math.round(ew * 2 + 3), Math.round(eh * 0.9), SKIN.base);
      const lashY = half ? ey - eh * 0.1 : ey - eh * 0.5;
      for (let i = 0; i < 2; i++) b.line(ex - ew - 0.5, lashY + i, ex + ew + 0.5, lashY - eh * 0.25 + i, INK);
      b.line(ex + s * (ew + 0.5), lashY - eh * 0.1, ex + s * (ew + 2), lashY - eh * 0.5, INK);
    }
    const mx = 28 * K, my = 15.6 * K;
    if (expr === 'blush') { b.rect(Math.round(mx - 1), Math.round(my - 1), 3, 3, SKIN.mouth); b.set(Math.round(mx), Math.round(my + 1), SKIN.tongue); }
    else if (expr === 'wink') { b.line(mx - 2, my - 1, mx + 2, my - 1, SKIN.mouth); b.rect(Math.round(mx - 1), Math.round(my), 3, 1, SKIN.mouth); }
    else if (expr === 'smug') { b.line(mx - 2, my, mx + 1, my, SKIN.mouth); b.set(Math.round(mx + 2), Math.round(my - 1), SKIN.mouth); }
    else { b.set(Math.round(mx - 2), Math.round(my - 1), SKIN.mouth); b.line(mx - 1, my, mx + 1, my, SKIN.mouth); b.set(Math.round(mx + 2), Math.round(my - 1), SKIN.mouth); }
    const strong = expr === 'blush';
    for (const x of [22.5, 33.5]) {
      b.ellipse(x * K, 14.2 * K, (strong ? 2 : 1.6) * K, 0.6 * K, SKIN.blush);
      if (strong) for (let i = -1; i <= 1; i++) b.line(x * K + i * 2 - 1, 13.6 * K, x * K + i * 2 + 1, 13.6 * K - 2, '#e0506a');
    }
  }
  function shine(b, h) {
    b.clip = true;
    for (let x = 20; x <= 36; x += 1 / K) { const dy = Math.pow((x - 28) / 8, 2) * 2; if (Math.floor(x + dy) % 4 !== 0) b.set(x * K, (4.2 + dy) * K, h.light); }
    for (let x = 22; x <= 34; x += 3) b.set(x * K, (4.6 + Math.pow((x - 28) / 8, 2) * 2) * K, h.shine);
    Ln(b, 33, 8, 36, 12, h.dark); Ln(b, 23, 8, 21, 12, h.dark);
    b.clip = false;
  }

  function build(id, pose, expr, blink) {
    const L = LOOK[id];
    const layer = (fn) => inked((() => { const b = new Buf(W, H); fn(b); return b; })());
    const out = new Buf(W, H);
    out.draw(layer((b) => L.hairBack(b, L.hair)));
    out.draw(layer((b) => legs(b, L, pose)));
    if (pose === 'lift') out.draw(layer((b) => undies(b, L.undies)));
    out.draw(layer((b) => {
      R(b, 26, 17, 4, 4, SKIN.base); shadow(b, [[26, 17], [30, 17], [30, 19], [26, 19]], SKIN.shade);
      for (const pts of [[[18, 21], [24, 20], [28, 20], [28, 25], [18, 25]], mir([[18, 21], [24, 20], [28, 20], [28, 25], [18, 25]])]) Pl(b, pts, SKIN.base);
      shadow(b, mir([[18, 21], [21, 20.6], [21, 25], [18, 25]]), SKIN.shade);
    }));
    out.draw(layer((b) => L.outfit(b, pose)));
    out.draw(layer((b) => { arms(b, pose); if (L.sleeves) L.sleeves(b, pose); }));
    const hd = layer(headShape); face(hd, L, expr, blink); out.draw(hd);
    out.draw(layer((b) => { L.hairFront(b, L.hair); shine(b, L.hair); }));
    return out.toCanvas(1);
  }
  const cache = new Map();
  function get(id, pose = 'stand', expr = 'smile', blink = false) {
    const k = [id, pose, expr, blink ? 1 : 0].join('|');
    if (!cache.has(k)) cache.set(k, build(id, pose, expr, blink));
    return cache.get(k);
  }
  global.MATURE = { get, has: (id) => !!LOOK[id], W, H };
})(window);
