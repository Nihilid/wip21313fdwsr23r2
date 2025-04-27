// lust-threshold.js

/**
 * Calculates the dynamic Lust Threshold for actors,
 * based on their current exposed body regions and associated severity values.
 * 
 * Used by lust-engine.js to cap passive Lust gains at appropriate levels.
 */

import { BODY_REGIONS } from "./attire-bodymap.js";
import { EXPOSURE_SEVERITY, EXPOSURE_VALUES } from "./attire-severity.js";
import { AttireExposure } from "./attire-exposure.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class LustThreshold {
  /**
   * Calculates the current Lust Threshold for the actor.
   * Base: Libido + exposure bonuses.
   * @param {Actor} actor 
   * @returns {number}
   */
  static calculateThreshold(actor) {
    if (!actor || !actor.isOwner) return 0;

    const libido = LustThreshold.getLibido(actor);

    let bonus = 0;
    const exposedRegions = AttireExposure.getExposedRegions(actor);

    for (const regionId of exposedRegions) {
      const severity = EXPOSURE_SEVERITY[regionId];
      if (severity) {
        bonus += EXPOSURE_VALUES[severity] ?? 0;
      }
    }

    const totalThreshold = libido + bonus;

    console.log(`[D&Degenerates] 🎯 Lust Threshold for ${actor.name}: Libido (${libido}) + Exposure Bonus (${bonus}) → Threshold (${totalThreshold})`);

    return totalThreshold;
  }

  /**
   * Helper to get the Libido (Bar 4) value.
   * @param {Actor} actor 
   * @returns {number}
   */
  static getLibido(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return 0;

    return getProperty(token, `flags.barbrawl.resourceBars.bar4.value`) ?? 0;
  }
}
