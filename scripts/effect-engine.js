// Dungeons & Degenerates – Effect Engine Module
// Version: 1.3.0
// Last Updated: 2025-04-13

import { UUIDS } from './uuid-defs.js';
import { SETTINGS, getSetting } from './settings.js';
import { getGenderCategory, getBarValue } from './utils.js';
import { applyEffect, removeEffect, hasEffect, applyOrgasmArousalDrop, runClimaxCascade, incrementFlag } from './effect-utils.js';
import { logDebug } from './utils.js';

/**
 * Apply the Aroused effect if the actor does not already have it.
 * @param {Actor} actor
 */
export async function applyArousedEffect(actor) {
  if (!hasEffect(actor, UUIDS.AROUSED)) {
    await applyEffect(actor, UUIDS.AROUSED);
    logDebug("info", `[D&Degenerates] ${actor.name} reached Arousal ≥ 75. Applying 'Aroused' effect.`);
  }
}

/**
 * Remove the Aroused effect if the actor currently has it.
 * @param {Actor} actor
 */
export async function removeArousedEffect(actor) {
  if (hasEffect(actor, UUIDS.AROUSED)) {
    await removeEffect(actor, UUIDS.AROUSED);
    logDebug("info", `[D&Degenerates] ${actor.name} Arousal < 75. Removing 'Aroused' effect.`);
  }
}

/**
 * Apply or remove the Aroused effect based on current arousal value.
 * @param {Actor} actor
 * @param {number} arousal
 */
export async function applyArousedEffectIfNeeded(actor, arousal) {
  if (arousal >= 75) {
    await applyArousedEffect(actor);
  } else {
    await removeArousedEffect(actor);
  }
}

/**
 * Apply orgasm effects based on gender category.
 * Includes Arousal drop, Slowed condition, effect application, and orgasm tracking.
 * @param {Actor} actor
 */
export async function applyOrgasmEffect(actor) {
  const category = getGenderCategory(actor);
  const token = actor.getActiveTokens()[0];

  if (!token) return;

  const arousal = getBarValue(token, 2);
  const libido = getBarValue(token, 4);

  await applyOrgasmArousalDrop(actor, category, arousal, libido);

  const effectUUID = category === "feminine" ? UUIDS.CUMMING : category === "masculine" ? UUIDS.EJACULATING : null;
  if (effectUUID) {
    await applyEffect(actor, effectUUID);
    logDebug("info", `[D&Degenerates] ${actor.name} climaxed — Applied effect from ${effectUUID}`);
  }

  await actor?.increaseCondition("stunned", { value: 1 });
  logDebug("info", `[D&Degenerates] ${actor.name} gains Stunned 1 after climax.`);

  await incrementFlag(actor, "dndegenerates", "orgasms");

  if (category === "feminine") {
    await runClimaxCascade(actor);
  }
  if (actor.sheet?.rendered) actor.sheet.render();
}
