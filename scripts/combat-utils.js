/**
 * Utility functions for combat-based size logic and effect handling.
 * Shared by GrappleEngine, AI Combat Assistant integrations, and related systems.
 * @module combat-utils
 */

// Ordered size tiers from smallest to largest
export const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];

/**
 * Get numeric index of a size string from SIZE_ORDER
 * @param {string} size - Size string (e.g., "med", "lg")
 * @returns {number} Index in SIZE_ORDER array
 */
export function getSizeIndex(size) {
  return SIZE_ORDER.indexOf(size ?? "med");
}

/**
 * Validate token has an actor with a size trait
 * @param {Token} token - Foundry token document
 * @returns {boolean} True if token has valid actor data
 */
export function isValidActorToken(token) {
  return token?.actor && token.actor.system?.traits?.size?.value;
}

/**
 * Apply an Active Effect to an actor via UUID
 * @param {Actor} actor - Actor to receive effect
 * @param {string} uuid - UUID of the effect to apply
 * @param {boolean} [log=true] - Whether to log application
 */
export async function applyEffectByUuid(actor, uuid, log = true) {
  try {
    const effect = await fromUuid(uuid);
    if (effect) {
      const existing = actor.itemTypes.effect.find(e => e.slug === effect.system.slug);
      if (!existing) {
        await actor.createEmbeddedDocuments("Item", [effect.toObject()]);
        if (log) console.log(`[D&Degenerates] 💥 Effect ${effect.name} applied to ${actor.name}`);
      }
    }
  } catch (err) {
    console.warn(`[D&Degenerates] ❌ Failed to apply effect: ${uuid}`, err);
  }
}

/**
 * Remove effects from an actor by slug
 * @param {Actor} actor - Actor to remove effects from
 * @param {string[]} slugs - Array of effect slugs to remove
 */
export async function removeEffectsBySlug(actor, slugs = []) {
  const toRemove = actor.itemTypes.effect.filter(e => slugs.includes(e.slug));
  for (const effect of toRemove) {
    await effect.delete();
  }
}
