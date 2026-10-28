import { clamp } from './data.js';

export function reducedDamage(amount, type = 'physical', target = {}) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (target.immunities?.includes(type)) return 0;
  const own = clamp(target.defense?.[type] || 0, 0, 1), clothing = clamp(target.clothing?.[type] || 0, 0, 1);
  return amount * (1 - Math.min(0.8, 1 - (1 - own) * (1 - clothing)));
}
export function absorbBarrier(barrier, amount, type) {
  if (!barrier || barrier.hp <= 0 || barrier.life <= 0) return false;
  barrier.hp = Math.max(0, barrier.hp - reducedDamage(amount, type, barrier));
  return true; // The breaking hit never spills into the body.
}
