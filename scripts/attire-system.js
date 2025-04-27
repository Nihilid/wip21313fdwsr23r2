// attire-system.js

import { BODY_REGIONS } from "./attire-bodymap.js";
import { FlavorEngine } from "./flavor-engine.js";
import { clampValue } from "./utils.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class AttireSystem {
  /**
   * Called at the end of each combat round to attempt wardrobe malfunctions.
   */
  static async checkRoundMalfunctions() {
    for (const token of canvas.tokens.placeables.filter(t => t.actor && t.actor.hasPlayerOwner && t.actor.type === "character")) {
      const actor = token.actor;

      const coverage = actor.flags?.["dungeons-and-degenerates-pf2e"]?.coverage || {};
      const vulnerableRegions = Object.keys(BODY_REGIONS).filter(regionKey => {
        const regionId = BODY_REGIONS[regionKey].id;
        const regionCoverage = coverage[regionId] ?? 100;
        return regionCoverage > 0 && regionCoverage <= 60;
      });

      if (vulnerableRegions.length === 0) continue;

      // Roll malfunction check for each vulnerable region
      for (const regionKey of vulnerableRegions) {
        const regionId = BODY_REGIONS[regionKey].id;
        const regionCoverage = coverage[regionId] ?? 100;

        const malfunctionChance = AttireSystem.calculateMalfunctionChance(regionCoverage);

        const roll = Math.random() * 100;
        if (roll <= malfunctionChance) {
          console.log(`[D&Degenerates] 💥 Wardrobe malfunction on ${regionId} for ${actor.name} (Roll ${roll.toFixed(2)} ≤ ${malfunctionChance}%)`);

          await AttireSystem.triggerMalfunction(actor, regionId);
        }
      }
    }
  }

  /**
   * Calculates malfunction chance based on current region coverage.
   * @param {number} coverage 
   * @returns {number}
   */
  static calculateMalfunctionChance(coverage) {
    if (coverage > 50) return 5;   // Barely slipping
    if (coverage > 35) return 7;   // Slightly slipping
    if (coverage > 20) return 10;  // Moderate slipping
    return 15;                     // Severe chaos
  }

  /**
   * Applies a malfunction to a specific body region.
   * Reduces coverage, triggers flavor message.
   * @param {Actor} actor 
   * @param {string} regionId 
   */
  static async triggerMalfunction(actor, regionId) {
    const coverage = actor.flags?.["dungeons-and-degenerates-pf2e"]?.coverage || {};

    const currentCoverage = coverage[regionId] ?? 100;
    const newCoverage = clampValue(currentCoverage - 20, 0, 100); // Reduce by 20% (moderate slip)

    await actor.update({
      [`flags.dungeons-and-degenerates-pf2e.coverage.${regionId}`]: newCoverage
    });

    console.log(`[D&Degenerates] 👙 Coverage reduced for ${regionId}: ${currentCoverage}% → ${newCoverage}%`);

    // Trigger flavor
    FlavorEngine.playWardrobeMalfunctionFlavor(actor, regionId);
  }
}
