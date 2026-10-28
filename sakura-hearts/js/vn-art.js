// Painted visual-novel artwork (the user's own images, backgrounds cut out)
// for girls who have it. Used for the dialogue portrait in her main outfit and
// for the private tease. Expressions are shown with overlays (blush, emotes)
// and motion, since each girl has one painted pose so far.
// Images: assets/vn/<id>.webp, embedded by tools/build-vn-art.js.
(function (global) {
  'use strict';
  const DATA = global.VN_ART_DATA || {};
  // Source-image coordinates (1024x1536): crops, cheeks for blush, and the
  // spot beside her head where emotes appear.
  const LAYOUT = {
    nami: { size: [1024, 1536], bust: [222, 0, 600, 640], knee: [222, 0, 600, 1150], cheeks: [[446, 178], [531, 172]], emote: [610, 60], blush: 0.15 },
    aqua: { size: [1024, 1536], bust: [262, 10, 690, 690], knee: [262, 10, 690, 1150], cheeks: [[482, 268], [556, 258]], emote: [664, 128], blush: 0.15 },
  };
  const BLUSH = { blush: 0.75, love: 0.7, happy: 0.35, wink: 0.45, smug: 0.25, smile: 0.2 };
  const images = {};
  for (const id of Object.keys(DATA)) {
    if (!LAYOUT[id]) continue;
    const image = new Image();
    image.src = DATA[id];
    images[id] = image;
  }
  const has = (id) => !!images[id];
  const ready = (id) => has(id) && images[id].complete && images[id].naturalWidth > 0;

  function heart(cx, x, y, r, color) {
    cx.fillStyle = color;
    cx.beginPath();
    cx.moveTo(x, y + r * 0.9);
    cx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.2, x, y - r * 0.35);
    cx.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
    cx.fill();
  }
  function sparkle(cx, x, y, r, color) {
    cx.fillStyle = color;
    cx.beginPath();
    cx.moveTo(x, y - r); cx.quadraticCurveTo(x, y, x + r, y); cx.quadraticCurveTo(x, y, x, y + r);
    cx.quadraticCurveTo(x, y, x - r, y); cx.quadraticCurveTo(x, y, x, y - r);
    cx.fill();
  }
  function emote(cx, expr, x, y, s, t) {
    const k = Math.min(1, t / 250), pop = s * (0.6 + 0.4 * k);
    cx.save();
    cx.globalAlpha *= k;
    if (expr === 'love' || expr === 'blush') {
      for (let i = 0; i < 3; i++) {
        const ph = ((t / 1400) + i / 3) % 1;
        cx.globalAlpha = k * (1 - ph);
        heart(cx, x + Math.sin(ph * 6 + i) * 2 * s, y + 4 * s - ph * 14 * s, (2.2 - i * 0.4) * pop, i % 2 ? '#ff8fb0' : '#ff5c8a');
      }
    } else if (expr === 'surprised') {
      cx.fillStyle = '#ff5050';
      cx.fillRect(x - 0.9 * pop, y - 5 * pop, 1.8 * pop, 6 * pop);
      cx.fillRect(x - 0.9 * pop, y + 2.2 * pop, 1.8 * pop, 1.8 * pop);
    } else if (expr === 'sad') {
      cx.fillStyle = '#8fd0ff';
      cx.beginPath();
      cx.moveTo(x, y - 3 * pop); cx.quadraticCurveTo(x + 2.4 * pop, y + 1 * pop, x, y + 2.4 * pop); cx.quadraticCurveTo(x - 2.4 * pop, y + 1 * pop, x, y - 3 * pop);
      cx.fill();
    } else if (expr === 'smug' || expr === 'wink' || expr === 'happy') {
      const tw = 0.75 + 0.25 * Math.sin(t / 180);
      sparkle(cx, x, y, 3 * pop * tw, '#fff6c0');
      sparkle(cx, x + 4 * s, y + 4 * s, 1.6 * pop * tw, '#ffe27a');
    }
    cx.restore();
  }

  // Draw into the scene (192x144 units). o: { crop: 'bust'|'knee', x: centre,
  // y: top, h: height, expr, t: ms since shown, alpha, react: {x,y,angle,scale} }
  function draw(cx, id, o) {
    if (!ready(id)) return false;
    const L = LAYOUT[id], image = images[id], k = image.naturalWidth / L.size[0];
    const [sx, sy, sw, sh] = L[o.crop || 'bust'];
    const h = o.h, w = (sw / sh) * h, s = h / sh;
    const r = o.react || { x: 0, y: 0, angle: 0, scale: 1 };
    const t = o.t || 0, breathe = Math.sin(t / 900) * 0.6;
    const left = o.x - w / 2, top = o.y + breathe;
    const at = ([px, py]) => [left + (px - sx) * s, top + (py - sy) * s];
    cx.save();
    cx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    cx.translate(o.x + r.x, top + h + r.y);
    cx.rotate(r.angle || 0);
    cx.scale(r.scale || 1, r.scale || 1);
    cx.translate(-o.x, -(top + h));
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(image, sx * k, sy * k, sw * k, sh * k, left, top, w, h);
    // blush on her cheeks
    const b = BLUSH[o.expr] != null ? BLUSH[o.expr] : L.blush;
    if (b > 0) {
      for (const c of L.cheeks) {
        const [x, y] = at(c), rx = 26 * s, ry = 12 * s;
        const g = cx.createRadialGradient(x, y, 0, x, y, rx);
        g.addColorStop(0, `rgba(255,110,140,${(0.55 * b).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,110,140,0)');
        cx.fillStyle = g;
        cx.save(); cx.translate(x, y); cx.scale(1, ry / rx); cx.translate(-x, -y);
        cx.beginPath(); cx.arc(x, y, rx, 0, Math.PI * 2); cx.fill();
        cx.restore();
        if (b >= 0.45) {
          cx.strokeStyle = `rgba(240,90,120,${(0.6 * b).toFixed(3)})`;
          cx.lineWidth = Math.max(0.25, 2.2 * s);
          cx.beginPath();
          for (let i = -1; i <= 1; i++) { cx.moveTo(x + i * 10 * s - 3 * s, y + 6 * s); cx.lineTo(x + i * 10 * s + 3 * s, y - 6 * s); }
          cx.stroke();
        }
      }
    }
    const [ex, ey] = at(L.emote);
    emote(cx, o.expr, ex, ey, Math.max(1, 9 * s), t);
    cx.restore();
    return true;
  }

  global.VN_ART = { has, ready, draw, LAYOUT };
})(window);
