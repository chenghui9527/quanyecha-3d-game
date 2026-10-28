import { readFile, mkdir, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

// All three editions work from file://, without a local HTTP server.
const common = ['data', 'factions', 'campaign', 'combat', 'monsters', 'save', 'inuyasha', 'scenery', 'engine', 'art'];
const assets = ['heroes', 'title-scene', 'monsters/crow', 'monsters/spider', 'monsters/hornet', 'monsters/harpy', 'monsters/rat', 'monsters/crawler', 'monsters/maw', 'monsters/manyeye', 'monsters/eyeball', 'monsters/beetle', 'monsters/tongue', 'monsters/wingface', 'monsters/humpneck', 'monsters/cyclops', 'monsters/skullwhisker', 'characters/inuyasha-combat', 'characters/inuyasha-blood-claws', 'scenery/forest-tree', 'scenery/sacred-tree', 'scenery/village-house', 'scenery/wooden-door', 'scenery/bone-eaters-well', 'scenery/terrain', 'scenery/shrine-torii'];
const embedded = new Map();
for (const name of assets) embedded.set(name, `data:image/png;base64,${(await readFile(`assets/${name}.png`)).toString('base64')}`);
embedded.set('ui/title-logo', `data:image/png;base64,${(await readFile('assets/ui/title-logo.png')).toString('base64')}`);
embedded.set('ui/faction-scene', `data:image/png;base64,${(await readFile('assets/ui/faction-scene.png')).toString('base64')}`);
await mkdir('dist', { recursive: true });
for (const edition of [{ html: 'index', files: [...common, 'hud', 'audio', 'main'], entry: 'main' }, { html: 'monster-lab', files: [...common, 'audio', 'monster-lab'], entry: 'monster-lab' }, { html: 'scene-lab', files: [...common, 'scene-lab'], entry: 'scene-lab' }]) {
  let js = '';
  for (const name of edition.files) {
    const source = await readFile(`src/${name}.js`, 'utf8');
    js += source.replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '') + '\n';
  }
  let css = await readFile('styles.css', 'utf8');
  if (edition.html === 'index') css += '\n' + await readFile('home.css', 'utf8') + '\n' + await readFile('factions.css', 'utf8') + '\n' + await readFile('battle.css', 'utf8');
  for (const [name, data] of embedded) {
    js = js.replaceAll(`'./assets/${name}.png'`, `'${data}'`);
    css = css.replaceAll(`'./assets/${name}.png'`, `'${data}'`);
  }
  const script = `(() => {\n'use strict';\n${js}\n})();`;
  new vm.Script(script);
  let html = await readFile(`${edition.html}.html`, 'utf8');
  html = html.replace('<link rel="stylesheet" href="./styles.css">', () => `<style>${css}</style>`);
  html = html.replace('  <link rel="stylesheet" href="./home.css">\n', '');
  html = html.replace('  <link rel="stylesheet" href="./factions.css">\n', '');
  html = html.replace('  <link rel="stylesheet" href="./battle.css">\n', '');
  html = html.replace(`<script type="module" src="./src/${edition.entry}.js"></script>`, () => `<script>${script.replaceAll('</script', '<\\/script')}</script>`);
  await writeFile(`dist/${edition.html}.html`, html);
  console.log(`Self-contained edition: dist/${edition.html}.html (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB)`);
}
