// lust-engine.js

import { clampValue, validateActor } from "./utils.js";
import { BAR_MAPPING } from "./constants.js";
import { Settings, isPerceptionEnabled } from "./settings.js";
import { LustThreshold } from "./lust-threshold.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class LustEngine {
  static initialize() {
    console.log(`[D&Degenerates] ✅ Lust Engine initialized`);
  }

  /**
   * Increase Lust for an actor, respecting their dynamic threshold.
   * @param {Actor} actor 
   * @param {number} amount 
   */
  static async increaseLust(actor, amount) {
    if (!validateActor(actor)) return;

    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return;

    const current = LustEngine.getCurrentLust(actor);
    const libido = LustEngine.getLibido(actor);
    const threshold = LustThreshold.calculateThreshold(actor);

    const targetLust = Math.min(current + amount, threshold);

    if (targetLust <= current) {
      console.log(`[D&Degenerates] 🧘 ${actor.name} is at or above their Lust Threshold (${threshold}), no passive Lust gain applied.`);
      return;
    }

    await token.update({ [`flags.barbrawl.resourceBars.bar3.value`]: targetLust });

    console.log(`[D&Degenerates] 🔥 Increased Lust for ${actor.name}: ${current} → ${targetLust} (Threshold: ${threshold})`);
  }

  /**
   * Passive Lust correction: Slowly climb toward Libido over time.
   * Happens even without external triggers.
   * @param {Actor} actor 
   */
  static async passiveLustCorrection(actor) {
    if (!validateActor(actor)) {
      console.log(`[D&Degenerates] ❌ passiveLustCorrection skipped invalid actor.`);
      return;
    }

    const token = actor.getActiveTokens(true, true)[0];
    if (!token) {
      console.log(`[D&Degenerates] ❌ passiveLustCorrection skipped: No active token for actor ${actor.name}.`);
      return;
    }

    const currentLust = LustEngine.getCurrentLust(actor);
    const libido = LustEngine.getLibido(actor);

    console.log(`[D&Degenerates] 🔍 Checking Passive Lust: ${actor.name} | Current Lust: ${currentLust} | Libido: ${libido}`);

    if (currentLust < libido) {
      const increase = 1; // Passive climb rate
      const newLust = Math.min(currentLust + increase, libido);

      await token.update({ [`flags.barbrawl.resourceBars.bar3.value`]: newLust });

      console.log(`[D&Degenerates] 💓 Passive Lust correction for ${actor.name}: ${currentLust} → ${newLust}`);
    } else {
      console.log(`[D&Degenerates] 🧘 Passive Lust: ${actor.name} is already at or above Libido, no correction needed.`);
    }
  }

  /**
   * Helper to retrieve current Lust value.
   */
  static getCurrentLust(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return 0;

    return getProperty(token, `flags.barbrawl.resourceBars.bar3.value`) ?? 0;
  }

  /**
   * Helper to retrieve Libido value.
   */
  static getLibido(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return 0;

    return getProperty(token, `flags.barbrawl.resourceBars.bar4.value`) ?? 0;
  }
}
