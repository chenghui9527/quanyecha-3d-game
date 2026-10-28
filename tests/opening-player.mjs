// A player using only normal controls: no teleporting, damage edits or invincibility.
export function playOpening(game, onScene = () => {}) {
  const scenes = [];
  for (let id = 0; id < 6; id++) {
    if (!game.start(id)) throw new Error(`Scene ${id} stayed locked`);
    onScene(game, 'start');
    let retries = 0, frames = 0;
    for (; frames < 60 * 300 && game.state !== 'victory'; frames++) {
      if (game.state === 'dialogue') { game.nextDialogue(); continue; }
      if (game.state === 'dead') {
        if (++retries > 3) throw new Error(`Scene ${id}: player died repeatedly`);
        game.retry(); continue;
      }
      const h = game.hero, input = {}, item = game.availableInteractions()[0];
      const enemies = game.enemies.filter(e => e.hp > 0);
      const anchors = game.anchors.filter(a => a.hp > 0);
      const target = (anchors.length ? anchors : enemies).sort((a,b) => Math.abs(a.x-h.x)-Math.abs(b.x-h.x))[0];
      let destination = item ? item.x - 15 : game.level.length - 100;
      if (target) {
        if (game.active !== 'kagome' && game.health.kagome > 0) input.two = true;
        const reach = game.active === 'kagome' ? anchors.length ? 65 : 240 : 60;
        destination = Math.max(game.bossSpawned ? game.level.bossX - 510 : 20, target.x - reach);
        if (game.encounter) destination = Math.max(game.level.encounters[game.encounter.index].x - 210, destination);
        const incoming = enemies.some(e => e.windup > 0 && e.windup < 0.25);
        if ((incoming || anchors.length && frames % 100 < 3) && h.grounded) input.jump = !game.previous.jump;
      }
      if (Math.abs(destination - h.x) > 20) {
        input.left = destination < h.x;
        input.right = destination > h.x;
      } else if (target) {
        const distance = target.x - h.x;
        if (h.facing !== Math.sign(distance)) { input.left = distance < 0; input.right = distance > 0; }
        input.attack = true;
        input.skill1 = frames % 24 === 0;
        input.skill2 = frames % 80 === 0;
      }
      if (item && Math.abs(h.x + 15 - item.x) < 58 && !target) {
        input.left = false; input.right = false;
        if (item.hero && game.active !== item.hero) input.two = true;
        else input.interact = frames % 2 === 0;
      }
      const gap = game.level.gaps.find(([x,w]) => input.right && x > h.x && x - h.x < 80 || input.left && x+w < h.x+30 && h.x-(x+w) < 55);
      if (gap && h.grounded) input.jump = true;
      game.update(1/60, input);
      if (frames % 30 === 0) onScene(game, 'tick');
    }
    if (game.state !== 'victory') throw new Error(`Scene ${id}: stalled at x=${Math.round(game.hero.x)}, state=${game.state}, encounter=${JSON.stringify(game.encounter)}, enemies=${game.enemies.filter(e=>e.hp>0).map(e=>`${e.type}:${Math.round(e.hp)}`).join(',')}, events=${[...game.events]}`);
    scenes.push({ id, frames, retries, damage: game.damageTaken });
    onScene(game, 'complete');
  }
  return scenes;
}
