// lust-utils.js
// Utility functions for LustEngine logic and aura interaction

import { round2, clamp, logDebug } from './utils.js';
import { applyEffect, hasEffect, removeEffect } from './effect-utils.js';

export function getBarValue(actor, barKey) {
  const raw = getProperty(actor?.token?.document ?? actor?.document, `flags.barbrawl.resourceBars.${barKey}.value`);
  return round2(clamp(Number(raw ?? 0)));
}

export function calculateLustDecay(current, libido, rate) {
  const decay = Math.max((current - libido) * rate, 0);
  return round2(Math.max(libido, current - decay));
}

export function calculateFalloff(distance, formula) {
  if (!formula) return 1;
  try {
    return Function("distance", `return ${formula}`)(distance);
  } catch (e) {
    logDebug(`Invalid falloff formula: ${formula}`);
    return 1;
  }
}

export function calculateStimulusIncrement({ base, formula, falloff, CHA, Libido }) {
  try {
    const context = { base, falloff, CHA, Libido };
    const compiled = Function(...Object.keys(context), `return ${formula}`);
    return compiled(...Object.values(context));
  } catch (e) {
    logDebug(`Invalid stimulus formula: ${formula}`);
    return base;
  }
}
