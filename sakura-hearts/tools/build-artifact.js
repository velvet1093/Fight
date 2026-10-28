// Bundle the game into one self-contained HTML page for publishing as a claude.ai Artifact.
// Usage: node tools/build-artifact.js <out.html>
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.argv[2] || path.join(root, 'dist', 'sakura-hearts.html');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const body = html.split('<body>')[1].split('</body>')[0].replace(/<script src="[^"]+"><\/script>\s*/g, '');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map((m) => fs.readFileSync(path.join(root, m[1]), 'utf8'));
const page = `<title>Sakura Hearts</title>
<meta name="theme-color" content="#2a2238">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">
<style>
${css}
/* artifact host: fit inside the host's safe-area padding */
:root { color-scheme: dark; background: var(--bg); }
html, body { height: 100%; }
#app { height: 100%; padding: 0; }
</style>
${body.trim()}
${scripts.map((s) => `<script>\n${s}\n</script>`).join('\n')}
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log('wrote', out, (page.length / 1024).toFixed(1) + ' KB');
