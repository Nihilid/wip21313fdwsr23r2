// utils.js

/**
 * Clamps a value between min and max.
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates an actor for basic operations.
 * @param {Actor} actor 
 * @returns {boolean}
 */
export function validateActor(actor) {
  if (!actor) {
    console.warn("[D&Degenerates] ⚠️ validateActor: No actor provided.");
    return false;
  }
  if (!actor.isOwner) {
    console.warn(`[D&Degenerates] ⚠️ validateActor: Actor ${actor.name} is not owned by user.`);
    return false;
  }
  return true;
}

/**
 * Updates a Bar Brawl stat bar.
 * @param {Actor} actor 
 * @param {number} barId 
 * @param {number} value 
 */
export async function updateBar(actor, barId, value) {
  if (!validateActor(actor)) return;

  const token = actor.getActiveTokens(true, true)[0];
  if (!token) return;

  await token.update({ [`flags.barbrawl.resourceBars.bar${barId}.value`]: value });
}

/**
 * Fetches the current value of a Bar Brawl stat bar.
 * @param {Actor} actor 
 * @param {number} barId 
 * @returns {number|null}
 */
export function getBarValue(actor, barId) {
  const token = actor.getActiveTokens(true, true)[0];
  if (!token) return null;
  return getProperty(token, `flags.barbrawl.resourceBars.bar${barId}.value`) ?? null;
}

/**
 * Safely detect actor gender for orgasm handling.
 * Returns "male", "female", or "neutral".
 */
export function detectGender(actor) {
  if (!actor) return "neutral";

  // PC (Character) gender lookup
  const pcGender = actor.system?.details?.gender?.value?.toLowerCase();
  if (pcGender) {
    if (pcGender.includes("female")) return "female";
    if (pcGender.includes("male")) return "male";
  }

  // NPC fallback: look at traits
  const traits = actor.system?.traits?.value || [];
  if (Array.isArray(traits) && traits.includes("female")) return "female";

  // Default to male for NPCs
  return "male";
}
