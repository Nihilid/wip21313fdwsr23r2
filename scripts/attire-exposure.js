// attire-exposure.js

/**
 * Manages live detection of body region exposure based on attire coverage.
 * Integrates with attire-system.js for coverage tracking.
 */

import { BODY_REGIONS } from "./attire-bodymap.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

/**
 * Exposure thresholds by body region.
 * - 0% coverage → fully exposed
 * - 1-50% coverage → partially exposed
 * - 51-100% coverage → covered
 */
export const EXPOSURE_THRESHOLDS = {
  full: 0,
  partial: 50
};

export class AttireExposure {
  /**
   * Returns an array of currently exposed regions for the given actor.
   * @param {Actor} actor 
   * @returns {string[]} Array of BODY_REGIONS ids (e.g., ["chest", "groin"])
   */
  static getExposedRegions(actor) {
    if (!actor || !actor.isOwner) return [];

    const coverage = actor.flags?.["dungeons-and-degenerates-pf2e"]?.coverage || {};

    const exposed = [];

    for (const regionKey of Object.keys(BODY_REGIONS)) {
      const region = BODY_REGIONS[regionKey];
      const regionCoverage = coverage[region.id] ?? 100; // Assume fully covered if undefined

      if (regionCoverage <= EXPOSURE_THRESHOLDS.partial) {
        exposed.push(region.id);
      }
    }

    return exposed;
  }

  /**
   * Returns true if any PRIMARY erotic regions (CHEST, GROIN, ASS) are exposed.
   * This drives NPC visual Lust reactions.
   * @param {Actor} actor 
   * @returns {boolean}
   */
  static isVisuallyEroticallyExposed(actor) {
    const exposed = AttireExposure.getExposedRegions(actor);

    return exposed.includes(BODY_REGIONS.CHEST.id) ||
           exposed.includes(BODY_REGIONS.GROIN.id) ||
           exposed.includes(BODY_REGIONS.ASS.id);
  }

  /**
   * Returns an array of fondleable exposed body regions (CHEST, GROIN, ASS, BELLY, THIGHS).
   * This drives groping/pleasure targeting logic.
   * @param {Actor} actor 
   * @returns {string[]} Array of BODY_REGIONS ids
   */
  static getFondleableExposedRegions(actor) {
    const exposed = AttireExposure.getExposedRegions(actor);

    return exposed.filter(regionId =>
      regionId === BODY_REGIONS.CHEST.id ||
      regionId === BODY_REGIONS.GROIN.id ||
      regionId === BODY_REGIONS.ASS.id ||
      regionId === BODY_REGIONS.ABDOMEN.id ||
      regionId === BODY_REGIONS.THIGHS.id
    );
  }

  /**
   * Returns true if a specific body region is exposed.
   * @param {Actor} actor 
   * @param {string} regionId 
   * @returns {boolean}
   */
  static isRegionExposed(actor, regionId) {
    const exposed = AttireExposure.getExposedRegions(actor);
    return exposed.includes(regionId);
  }
}
