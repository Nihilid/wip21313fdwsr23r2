// effect-engine.js
import { validateActor } from "./utils.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class EffectEngine {
  /**
   * Apply an effect to an actor by UUID.
   * @param {Actor} actor
   * @param {string} effectUUID
   */
  static async applyEffect(actor, effectUUID) {
    if (!validateActor(actor)) return;
    if (!effectUUID) {
      console.warn(`[D&Degenerates] ⚠️ No effect UUID provided for application.`);
      return;
    }

    try {
      const effect = await fromUuid(effectUUID);
      if (!effect) {
        console.warn(`[D&Degenerates] ⚠️ Could not find effect for UUID: ${effectUUID}`);
        return;
      }

      // Prevent duplicate effect
      const existing = actor.itemTypes.effect.find(e => e.sourceId === effectUUID);
      if (existing) {
        console.log(`[D&Degenerates] ℹ️ Effect already present on actor: ${effect.name}`);
        return;
      }

      await actor.createEmbeddedDocuments("Item", [effect.toObject()]);
      console.log(`[D&Degenerates] ✅ Applied effect: ${effect.name} to ${actor.name}`);
    } catch (err) {
      console.error(`[D&Degenerates] ❌ Failed to apply effect:`, err);
    }
  }

  /**
   * Remove an effect from an actor by UUID.
   * @param {Actor} actor
   * @param {string} effectUUID
   */
  static async removeEffect(actor, effectUUID) {
    if (!validateActor(actor)) return;
    if (!effectUUID) {
      console.warn(`[D&Degenerates] ⚠️ No effect UUID provided for removal.`);
      return;
    }

    try {
      const existing = actor.itemTypes.effect.find(e => e.sourceId === effectUUID);
      if (!existing) {
        console.log(`[D&Degenerates] ℹ️ No existing effect found to remove for UUID: ${effectUUID}`);
        return;
      }

      await existing.delete();
      console.log(`[D&Degenerates] ✅ Removed effect: ${existing.name} from ${actor.name}`);
    } catch (err) {
      console.error(`[D&Degenerates] ❌ Failed to remove effect:`, err);
    }
  }
}

// Convenience re-exports
export const applyEffect = EffectEngine.applyEffect;
export const removeEffect = EffectEngine.removeEffect;
