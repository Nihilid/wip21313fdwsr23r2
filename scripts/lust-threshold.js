// lust-threshold.js

/**
 * Calculates the dynamic Lust Threshold for actors,
 * based on their current exposed body regions and associated severity values.
 * 
 * Used by lust-engine.js to cap passive Lust gains at appropriate levels.
 */

import { BODY_REGIONS } from "./bodymap.js";
import { EXPOSURE_SEVERITY, EXPOSURE_VALUES } from "./exposure.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class LustThreshold {
  static initialize() {
    console.log(`[D&Degenerates] ✅ Lust Threshold system initialized`);
  }

  /**
   * Calculates the actor's current Lust Threshold based on exposure state.
   * Always starts from Libido value and adds exposure bonuses.
   * 
   * @param {Actor} actor The actor to evaluate
   * @returns {number} The maximum Lust value the actor can passively reach
   */
  static calculateThreshold(actor) {
    if (!actor || !actor.isOwner) {
      console.warn(`[D&Degenerates] ⚠️ LustThreshold.calculateThreshold called with invalid actor.`);
      return 0;
    }

    const token = actor.getActiveTokens(true, true)[0];
    if (!token) {
      console.warn(`[D&Degenerates] ⚠️ LustThreshold: No active token for actor ${actor.name}.`);
      return 0;
    }

    const libido = LustThreshold.getLibido(actor);
    const exposedRegions = LustThreshold.getExposedRegions(actor);

    let bonus = 0;
    for (const region of exposedRegions) {
      const severity = EXPOSURE_SEVERITY[region];
      const bonusValue = EXPOSURE_VALUES[severity] ?? 0;
      bonus += bonusValue;
    }

    const finalThreshold = Math.min(libido + bonus, 100); // Never exceed 100
    console.log(`[D&Degenerates] 🎯 Lust Threshold for ${actor.name}: Libido (${libido}) + Exposure Bonus (${bonus}) → Threshold (${finalThreshold})`);
    return finalThreshold;
  }

  /**
   * Placeholder for detecting which body regions are currently exposed.
   * 
   * TODO: Integrate with attire-system.js once it provides live exposure data.
   * 
   * For now, assumes always chest exposed (testing purposes).
   */
  static getExposedRegions(actor) {
    // TODO: Pull real exposure flags from attire-system.js
    return [
      BODY_REGIONS.CHEST.id // Always chest exposed for now (for testing)
    ];
  }

  /**
   * Returns the actor's Libido (Bar4) value.
   */
  static getLibido(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return 0;

    return getProperty(token, `flags.barbrawl.resourceBars.bar4.value`) ?? 0;
  }
}
