// stimulation-utils.js
// Helper logic for stimulation decay and orgasm handling

import { clamp, round2 } from './utils.js';
import { applyOrgasmEffect } from './effect-engine.js';

/**
 * Calculates stimulation decay over time based on configured rate.
 * Adds safety via destructured defaults to avoid NaN issues.
 */
export function calculateStimulationDecay({ current = 0, rate = 0, minutes = 0 }) {
  const decay = rate * minutes;
  return clamp(current - decay, 0, 100);
}

/**
 * Determines whether the actor should trigger orgasm effects.
 * Logs activity if debug mode is active and prevents duplicate applications.
 */
export async function handleOrgasmTrigger(actor, stimulationValue = 100) {
  if (!actor || stimulationValue < 100) return false;

  const traits = actor.system?.traits?.value || [];

  // Prevent reapplication of orgasm effects if already present
  const hasOrgasmEffect = actor.items.some(i => ["Cumming", "Ejaculating"].includes(i.name));
  if (hasOrgasmEffect) return false;

  // Log only in debug mode if desired
  if (game.settings.get('dungeons-and-degenerates-pf2e', 'debugMode')) {
    console.log(`[D&Degenerates] 🫦 Orgasm triggered for ${actor.name}`);
  }

  await applyOrgasmEffect(actor, traits);
  return true;
}
