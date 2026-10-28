// Main-outfit artwork for portraits and phone avatars. Overworld sprites and
// alternate outfits keep the original procedural renderer. The atlas images
// are embedded as data URLs by cast-atlas.js so the offline build stays local.
(function (global) {
  'use strict';
  const definitions = global.CAST_ATLAS || { sheets: [], characters: {} };
  const characters = new Map();
  const cache = new Map();
  const errors = [];
  const DIRECTIONS = ['down', 'left', 'up'];
  const EXPRESSIONS = new Set(['neutral', 'smile', 'happy', 'blush', 'love', 'sad', 'surprised', 'smug', 'calm']);
  // Facial landmarks on the 96×128 portrait canvas. Only visible eyes animate:
  // Rem's and Kurumi's fringes continue to cover their other eye.
  const FEATURES = {
    nami: { eyes: [[36, 30, 9, 10], [52, 30, 10, 10]], mouth: [49, 43] },
    aqua: { eyes: [[36, 41, 10, 11], [53, 41, 10, 11]], mouth: [49, 54] },
    yumeko: { eyes: [[35, 33, 10, 10], [53, 33, 10, 10]], mouth: [49, 46] },
    kurumi: { eyes: [[34, 33, 11, 10]], mouth: [48, 46] },
    rem: { eyes: [[50, 33, 10, 12]], mouth: [48, 48] },
    zerotwo: { eyes: [[33, 31, 11, 11], [50, 31, 11, 11]], mouth: [47, 45] },
    frieren: { eyes: [[35, 31, 10, 11], [52, 31, 10, 11]], mouth: [47, 44] },
    marin: { eyes: [[33, 31, 11, 11], [51, 31, 11, 11]], mouth: [48, 45] },
    krul: { eyes: [[32, 35, 11, 13], [50, 35, 11, 13]], mouth: [46, 50] },
    asuna: { eyes: [[32, 28, 10, 13], [49, 28, 10, 13]], mouth: [46, 43] },
  };

  function canvas(w, h) {
    const image = document.createElement('canvas');
    image.width = w; image.height = h;
    image.getContext('2d').imageSmoothingEnabled = false;
    return image;
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Atlas image could not be decoded'));
      image.src = source;
    });
  }

  function cropFrame(image, rect) {
    const x = Math.max(0, Math.round(rect.x)), y = Math.max(0, Math.round(rect.y));
    const w = Math.min(Math.round(rect.w), image.width - x), h = Math.min(Math.round(rect.h), image.height - y);
    if (w <= 0 || h <= 0) throw new Error('Invalid atlas frame rectangle');
    const cell = canvas(w, h), cx = cell.getContext('2d');
    cx.drawImage(image, x, y, w, h, 0, 0, w, h);
    const pixels = cx.getImageData(0, 0, w, h).data;
    const rowCounts = new Uint32Array(h), colCounts = new Uint32Array(w);
    let transparent = 0, visible = 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const alpha = pixels[(j * w + i) * 4 + 3];
      if (alpha < 8) transparent++;
      if (alpha > 24) { visible++; rowCounts[j]++; colCounts[i]++; }
    }
    if (visible < 32) throw new Error('Empty atlas frame');
    if (transparent / (w * h) < 0.005) throw new Error('Atlas frame needs a transparent background');
    // Ignore isolated stray pixels without cutting away hands or props.
    const rowMinimum = Math.max(2, Math.floor(w * 0.003));
    const colMinimum = Math.max(2, Math.floor(h * 0.003));
    let minX = 0, minY = 0, maxX = w - 1, maxY = h - 1;
    while (minX < maxX && colCounts[minX] < colMinimum) minX++;
    while (maxX > minX && colCounts[maxX] < colMinimum) maxX--;
    while (minY < maxY && rowCounts[minY] < rowMinimum) minY++;
    while (maxY > minY && rowCounts[maxY] < rowMinimum) maxY--;
    minX = Math.max(0, minX - 1); minY = Math.max(0, minY - 1);
    maxX = Math.min(w - 1, maxX + 1); maxY = Math.min(h - 1, maxY + 1);
    const result = canvas(maxX - minX + 1, maxY - minY + 1);
    result.getContext('2d').drawImage(cell, minX, minY, result.width, result.height, 0, 0, result.width, result.height);
    let footX = 0, footPixels = 0;
    for (let j = Math.max(minY, maxY - Math.ceil(result.height * 0.06)); j <= maxY; j++) {
      for (let i = minX; i <= maxX; i++) if (pixels[(j * w + i) * 4 + 3] > 64) { footX += i - minX; footPixels++; }
    }
    return { image: result, footX: footPixels ? footX / footPixels : result.width / 2 };
  }

  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    const light = (max + min) / 2;
    let hue = 0;
    if (delta) {
      if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      else if (max === g) hue = ((b - r) / delta + 2) / 6;
      else hue = ((r - g) / delta + 4) / 6;
    }
    return [hue, delta ? delta / (1 - Math.abs(2 * light - 1)) : 0, light];
  }

  function rgb(h, s, l) {
    const f = (n) => { const k = (n + h * 12) % 12; return Math.round(255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return [f(0), f(8), f(4)];
  }
  const hexRGB = (value) => [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16));

  function recolored(frame, options, id) {
    const tint = options && options.tint && options.tint.normal;
    const changes = Object.entries(tint || {}).filter(([key, to]) => /^#[0-9a-f]{6}@[0-3]$/i.test(key) && /^#[0-9a-f]{6}$/i.test(to));
    if (!changes.length) return frame.image;
    const image = canvas(frame.image.width, frame.image.height), cx = image.getContext('2d');
    cx.drawImage(frame.image, 0, 0);
    const data = cx.getImageData(0, 0, image.width, image.height);
    const mappings = changes.map(([key, to]) => ({ band: +key.slice(-1), from: hsl(...hexRGB(key.slice(0, 7))), to: hsl(...hexRGB(to)) }));
    // Wardrobe dye starts below the face, including Aqua's lower-set head.
    // Use the same fitted geometry as the portrait landmarks rather than a
    // fixed percentage that can reach her eyes.
    const scale = Math.min(92 / image.width, 124 / image.height);
    const fittedHeight = Math.round(image.height * scale);
    const faceBottom = FEATURES[id] ? FEATURES[id].mouth[1] + 4 : 46;
    const headEnd = Math.ceil((faceBottom - (126 - fittedHeight)) * image.height / fittedHeight);
    for (let y = Math.max(Math.floor(image.height * 0.35), headEnd); y < image.height; y++) {
      const t = y / image.height, band = t < 0.57 ? 0 : t < 0.73 ? 1 : t < 0.91 ? 2 : 3;
      // A conservative body mask avoids recolouring long hair at the sides.
      const half = image.height * (band === 3 ? 0.23 : 0.21);
      for (let x = Math.max(0, Math.floor(frame.footX - half)); x < Math.min(image.width, frame.footX + half); x++) {
        const i = (y * image.width + x) * 4;
        if (data.data[i + 3] < 24) continue;
        const source = hsl(data.data[i], data.data[i + 1], data.data[i + 2]);
        // Preserve skin and the dark hand-drawn outlines.
        if (source[2] < 0.1 || (source[0] > 0.035 && source[0] < 0.14 && source[1] < 0.65 && source[2] > 0.43)) continue;
        let match = null, distance = Infinity;
        for (const mapping of mappings) {
          if (mapping.band !== band) continue;
          const hue = Math.min(Math.abs(source[0] - mapping.from[0]), 1 - Math.abs(source[0] - mapping.from[0]));
          const grey = source[1] < 0.15 && mapping.from[1] < 0.15;
          if (!grey && (hue > 0.075 || Math.abs(source[1] - mapping.from[1]) > 0.5)) continue;
          const d = hue + Math.abs(source[2] - mapping.from[2]) * 0.25;
          if (d < distance && Math.abs(source[2] - mapping.from[2]) < 0.4) { match = mapping; distance = d; }
        }
        if (!match) continue;
        const next = rgb(match.to[0], match.to[1], Math.max(0.04, Math.min(0.98, match.to[2] + source[2] - match.from[2])));
        data.data[i] = next[0]; data.data[i + 1] = next[1]; data.data[i + 2] = next[2];
      }
    }
    cx.putImageData(data, 0, 0);
    return image;
  }

  function frameFor(id, dir, options) {
    const character = characters.get(id);
    if (!character) return null;
    const direction = dir === 'right' ? 'left' : DIRECTIONS.includes(dir) ? dir : 'down';
    const frame = character[direction];
    const key = ['source', id, direction, JSON.stringify(options && options.tint || {})].join('|');
    if (!cache.has(key)) cache.set(key, { image: recolored(frame, options, id), footX: frame.footX });
    return cache.get(key);
  }

  function fit(image, frame, padding, flip) {
    const cx = image.getContext('2d'), source = frame.image;
    const scale = Math.min((image.width - padding * 2) / source.width, (image.height - padding * 2) / source.height);
    const w = Math.max(1, Math.round(source.width * scale)), h = Math.max(1, Math.round(source.height * scale));
    let x = Math.round(image.width / 2 - frame.footX * scale);
    x = Math.max(padding, Math.min(image.width - padding - w, x));
    const y = image.height - padding - h;
    if (flip) { cx.save(); cx.translate(image.width, 0); cx.scale(-1, 1); }
    cx.drawImage(source, x, y, w, h);
    if (flip) cx.restore();
    return { x, y, w, h, scaleX: w / source.width, scaleY: h / source.height };
  }

  function basePortrait(id, options) {
    const key = ['base-portrait', id, JSON.stringify(options || {})].join('|');
    if (!cache.has(key)) {
      const image = canvas(96, 128);
      const layout = fit(image, frameFor(id, 'down', options), 2, false);
      cache.set(key, { image, layout });
    }
    return cache.get(key);
  }

  function expressionLayer(image, base, id, expression, blink) {
    const f = FEATURES[id];
    if (!f) return;
    const cx = image.getContext('2d'), pixels = base.getContext('2d').getImageData(0, 0, 96, 128).data;
    const color = (x, y) => {
      const i = (Math.round(y) * 96 + Math.round(x)) * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2]];
    };
    const skinPixel = (p) => p[0] > 180 && p[0] > p[1] && p[1] > p[2] && p[1] > 135 && p[0] - p[2] < 115;
    const skinAt = (x, y) => {
      // Sample the neighbouring cheek so every character keeps her own skin
      // palette. Never sample the hair or paint over the covering fringe.
      const [mx, my] = f.mouth;
      for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1], [-2, 0], [2, 0]]) {
        const p = color(x + dx, y + dy);
        if (skinPixel(p)) return `rgb(${p.join(',')})`;
      }
      const p = color(mx, my - 4);
      return skinPixel(p) ? `rgb(${p.join(',')})` : '#ffe5cf';
    };
    const lash = '#38232e';
    const line = (points, ink = lash) => {
      cx.fillStyle = ink;
      for (let n = 1; n < points.length; n++) {
        const a = points[n - 1], b = points[n], steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
        for (let j = 0; j <= steps; j++) cx.fillRect(Math.round(a[0] + (b[0] - a[0]) * j / (steps || 1)), Math.round(a[1] + (b[1] - a[1]) * j / (steps || 1)), 1, 1);
      }
    };
    const eraseEye = ([x, y, w, h]) => {
      for (let row = 0; row < h; row++) {
        cx.fillStyle = skinAt(f.mouth[0], y + row);
        cx.fillRect(x, y + row, w, 1);
      }
    };
    const closed = blink || expression === 'happy' || expression === 'love';
    f.eyes.forEach((eye, i) => {
      const [x, y, w, h] = eye;
      const mid = Math.round(x + (w - 1) / 2), left = x + 1, right = x + w - 2;
      if (closed) {
        eraseEye(eye);
        const ey = y + Math.round(h * .52);
        if (!blink && expression === 'happy') {
          line([[left, ey + 1], [mid - 1, ey - 2], [mid + 1, ey - 2], [right, ey + 1]]);
          line([[left, ey + 2], [left + 1, ey]]);
        } else {
          line([[left, ey], [mid - 1, ey + 2], [mid + 1, ey + 2], [right, ey]]);
          line([[left - 1, ey - 1], [left + 1, ey + 1]]);
        }
      } else if (expression === 'calm' || expression === 'smug' || expression === 'sad') {
        // Keep the original coloured irises; animate the lids above them.
        const cover = expression === 'calm' ? 3 : expression === 'smug' ? (i ? 4 : 2) : 2;
        for (let col = 0; col < w; col++) {
          const slope = expression === 'sad' ? Math.round((i ? w - col - 1 : col) / w * 3) : 0;
          cx.fillStyle = skinAt(f.mouth[0], y + 2);
          cx.fillRect(x + col, y, 1, cover + slope);
        }
        const lidY = y + cover;
        if (expression === 'sad') line([[left, lidY + (i ? 2 : 0)], [right, lidY + (i ? 0 : 2)]]);
        else line([[left, lidY], [right, lidY + (expression === 'smug' && !i ? -1 : 0)]]);
      } else if (expression === 'surprised') {
        eraseEye(eye);
        // Opening the existing eyes keeps eye colours and tiny highlights.
        cx.drawImage(base, x, y, w, h, x, y, w, h + 1);
        line([[left + 1, y - 2], [right - 1, y - 2]], '#a96f60');
      }
    });
    const [mx, my] = f.mouth;
    cx.fillStyle = skinAt(mx, my - 2);
    cx.fillRect(mx - 4, my - 2, 9, 6);
    const mouth = '#ae6260', light = '#eaa095';
    if (expression === 'happy') {
      cx.fillStyle = mouth; cx.fillRect(mx - 2, my - 1, 5, 3); cx.fillRect(mx - 1, my + 2, 3, 1);
      cx.fillStyle = '#f19b9e'; cx.fillRect(mx - 1, my + 1, 3, 1);
    } else if (expression === 'surprised') {
      line([[mx - 1, my - 1], [mx + 1, my - 1], [mx + 2, my], [mx + 2, my + 1], [mx, my + 2], [mx - 1, my + 1], [mx - 1, my - 1]], mouth);
    } else if (expression === 'sad') line([[mx - 2, my + 1], [mx, my], [mx + 2, my + 1]], mouth);
    else if (expression === 'blush') line([[mx - 2, my], [mx - 1, my + 1], [mx, my], [mx + 1, my + 1], [mx + 2, my]], mouth);
    else if (expression === 'smug') line([[mx - 2, my + 1], [mx + 1, my + 1], [mx + 3, my - 1]], mouth);
    else if (expression === 'calm') line([[mx - 1, my], [mx + 1, my]], light);
    else if (expression === 'neutral') line([[mx - 1, my], [mx + 2, my]], mouth);
    else line([[mx - 3, my - 1], [mx - 2, my + 1], [mx + 1, my + 1], [mx + 3, my - 1]], mouth);
    if (expression === 'blush' || expression === 'love') {
      f.eyes.forEach(([x, y, w, h]) => {
        const cheekY = y + h;
        cx.fillStyle = expression === 'blush' ? '#ee9a9f' : '#eda5a4';
        cx.fillRect(x + 2, cheekY, Math.max(3, w - 4), 1);
        cx.fillStyle = '#f6b6ae'; cx.fillRect(x + 3, cheekY + 1, Math.max(2, w - 6), 1);
      });
    }
  }

  function moodIcon(cx, expr, width) {
    // Optional accents accompany the animated face during dialogue.
    const x = width - 13, y = 10;
    if (expr === 'love' || expr === 'blush') {
      const rows = ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
      cx.fillStyle = expr === 'blush' ? '#f4a0ad' : '#ff739b';
      rows.forEach((row, j) => [...row].forEach((p, i) => { if (p === 'x') cx.fillRect(x + i, y + j, 1, 1); }));
    } else if (expr === 'surprised') {
      cx.fillStyle = '#ffd76b'; cx.fillRect(x + 3, y, 2, 5); cx.fillRect(x + 3, y + 7, 2, 2);
    } else if (expr === 'sad') {
      cx.fillStyle = '#84bce9'; cx.fillRect(x + 3, y, 1, 2); cx.fillRect(x + 2, y + 2, 3, 3);
    }
  }

  function portrait(id, expr = 'neutral', blink = false, options = null) {
    if (!characters.has(id)) return null;
    expr = EXPRESSIONS.has(expr) ? expr : 'neutral';
    const key = ['portrait', id, expr, !!blink, JSON.stringify(options || {})].join('|');
    if (!cache.has(key)) {
      const image = canvas(96, 128);
      const base = basePortrait(id, options).image;
      image.getContext('2d').drawImage(base, 0, 0);
      expressionLayer(image, base, id, expr, blink);
      moodIcon(image.getContext('2d'), expr, 96);
      cache.set(key, image);
    }
    return cache.get(key);
  }

  function walker(id, dir = 'down', frame = 0, gesture = null, phase = 0, options = null) {
    if (!characters.has(id)) return null;
    const p = Math.max(0, Math.min(1, Number(phase) || 0));
    const stage = gesture && p >= 0.2 && p < 0.95 ? p < 0.6 ? 1 : 2 : 0;
    const step = Math.abs(Math.trunc(frame)) % 3;
    const key = ['walker', id, dir, step, gesture || '', stage, JSON.stringify(options || {})].join('|');
    if (!cache.has(key)) {
      const image = canvas(16, 24), cx = image.getContext('2d');
      // One transparent row below the feet leaves room for both walk steps.
      fit(image, frameFor(id, dir, options), 1, dir === 'right');
      if (step) {
        const base = canvas(16, 24); base.getContext('2d').drawImage(image, 0, 0);
        cx.clearRect(0, 19, 16, 5);
        const dy = step === 1 ? 1 : -1;
        // Only the lower legs move; knees, clothing and map anchors stay fixed.
        cx.drawImage(base, 0, 19, 8, 5, 0, 19 + dy, 8, 5);
        cx.drawImage(base, 8, 19, 8, 5, 8, 19 - dy, 8, 5);
      }
      if (stage) {
        // Tiny nod/sparkle gestures retain the supplied outfit and silhouette.
        const symbols = { wink: '#ffb5c8', shy: '#ffb5c8', proud: '#ffe18a', bounce: '#ffe18a', curtsy: '#cbb4ff', calm: '#cbb4ff', regal: '#ffe18a', salute: '#aee1ff' };
        cx.fillStyle = symbols[gesture] || '#ffb5c8';
        const x = stage === 1 ? 0 : 14, y = ['curtsy', 'calm'].includes(gesture) ? 7 : 3;
        cx.fillRect(x, y, 2, 1); cx.fillRect(x + (stage === 1 ? 1 : 0), y - 1, 1, 3);
      }
      cache.set(key, image);
    }
    return cache.get(key);
  }

  function face(id, expr = 'neutral', options = null) {
    const frame = frameFor(id, 'down', options);
    if (!frame) return null;
    const key = ['face', id, expr, JSON.stringify(options || {})].join('|');
    if (!cache.has(key)) {
      const image = canvas(64, 64), cx = image.getContext('2d'), source = frame.image;
      const layout = basePortrait(id, options).layout;
      const crop = characters.get(id).faceCrop;
      const top = crop ? Math.round(source.height * crop.y) : 0;
      const h = Math.min(source.height - top, Math.round(source.height * (crop ? crop.h : 0.39)));
      const size = Math.min(source.width, crop ? Math.round(source.width * crop.w) : Math.max(h, Math.round(source.height * 0.36)));
      const x = Math.max(0, Math.min(source.width - size, Math.round(frame.footX - size / 2)));
      const scale = Math.min(64 / size, 64 / h);
      const dw = Math.round(size * scale), dh = Math.round(h * scale);
      cx.drawImage(portrait(id, expr, false, options), layout.x + x * layout.scaleX, layout.y + top * layout.scaleY,
        size * layout.scaleX, h * layout.scaleY, Math.round((64 - dw) / 2), 64 - dh, dw, dh);
      cache.set(key, image);
    }
    return cache.get(key);
  }

  const api = { has: (id) => characters.has(id), portrait, walker, face, errors, ready: null };
  global.CAST_ART = api;
  api.ready = Promise.all((definitions.sheets || []).map(async (sheet, sheetIndex) => {
    try {
      const image = await loadImage(sheet.src);
      const cols = sheet.cols || 5, rows = sheet.rows || 3;
      for (const [id, spec] of Object.entries(definitions.characters || {})) {
        if (spec.sheet !== sheetIndex) continue;
        try {
          const frames = {};
          DIRECTIONS.forEach((dir, row) => {
            const rect = spec.frames && spec.frames[dir] || { x: spec.column * image.width / cols, y: row * image.height / rows, w: image.width / cols, h: image.height / rows };
            frames[dir] = cropFrame(image, rect);
          });
          characters.set(id, { ...frames, faceCrop: spec.face || null });
        } catch (error) { errors.push(`${id}: ${error.message}`); }
      }
    } catch (error) { errors.push(`Atlas ${sheetIndex}: ${error.message}`); }
  })).then(() => api);
})(window);
