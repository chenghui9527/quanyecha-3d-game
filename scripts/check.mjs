import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

let failed = false;
for (const folder of ['src', 'scripts', 'tests']) {
  for (const name of await readdir(folder)) {
    if (!/\.(m?js)$/.test(name)) continue;
    const result = spawnSync(process.execPath, ['--check', path.join(folder, name)], { encoding: 'utf8' });
    if (result.status !== 0) { console.error(result.stderr); failed = true; }
  }
}
for (const file of ['index.html', 'monster-lab.html', 'scene-lab.html', 'styles.css', 'home.css', 'factions.css', 'battle.css', 'companions.css', 'docs/game-interface-design.md', 'docs/faction-selection-design.md', 'docs/faction-scene-art-prompt.md', 'docs/title-logo-art-prompt.md', 'docs/game-design.md', 'docs/opening-three-chapters.md', 'docs/story-system-design.md', 'docs/monster-system-design.md', 'docs/monster-art-prompts.md', 'docs/scene-assets-design.md', 'docs/scene-art-prompts.md', 'docs/progress.md']) {
  if (!(await readFile(file, 'utf8')).trim()) { console.error(`Empty file: ${file}`); failed = true; }
}
if (failed) process.exitCode = 1;
else console.log('JavaScript syntax and required project files verified.');
