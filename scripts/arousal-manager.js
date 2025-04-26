// Version: 1.0.9
// Arousal Manager - Handles time-based stat changes for Dungeons & Degenerates

/**
 * ArousalManager handles progression of arousal-related stats over time.
 * Applies and removes relevant effects, and responds to token updates.
 *
 * Stats tracked:
 * - bar2: Arousal
 * - bar3: Lust
 * - bar4: Libido
 * - bar5: Stimulation
 */

import { applyEffect, removeEffect } from "./effect-engine.js";
import { getSetting } from "./settings-manager.js";
import { clampValue, validateActor } from "./utils.js";
import { BAR_MAPPING } from "./constants.js"; // New constants file, assumed.

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class ArousalManager {
  static initialize() {
    console.log("[D&Degenerates] ✅ ArousalManager initialized");
  }

  /**
   * Increases Arousal for an actor.
   * @param {Actor} actor 
   * @param {number} amount 
   */
  static async increaseArousal(actor, amount) {
    if (!validateActor(actor)) return;

    const current = ArousalManager.getBarValue(actor, BAR_MAPPING.AROUSAL) || 0;
    const newValue = clampValue(current + amount, 0, 100);
    await ArousalManager.updateBar(actor, BAR_MAPPING.AROUSAL, newValue);
    
    // Check for Orgasm or Effects
    await ArousalManager.checkArousalThresholds(actor, newValue);
  }

  /**
   * Increases Stimulation for an actor.
   * @param {Actor} actor 
   * @param {number} amount 
   */
  static async increaseStimulation(actor, amount) {
    if (!validateActor(actor)) return;

    const current = ArousalManager.getBarValue(actor, BAR_MAPPING.STIMULATION) || 0;
    const newValue = clampValue(current + amount, 0, 100);
    await ArousalManager.updateBar(actor, BAR_MAPPING.STIMULATION, newValue);

    // Check for Orgasm Trigger
    if (newValue >= 100) {
      await ArousalManager.handleOrgasm(actor);
    }
  }

  /**
   * Handles orgasm event.
   * @param {Actor} actor 
   */
  static async handleOrgasm(actor) {
    console.log(`[D&Degenerates] 💦 Orgasm triggered for ${actor.name}`);

    // Reset stimulation
    await ArousalManager.updateBar(actor, BAR_MAPPING.STIMULATION, 0);

    // Apply gender-specific orgasm effects
    const gender = actor.system.traits.gender?.value || "neutral";
    const orgasmEffect = (gender === "male")
      ? "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.zXZ2wXVYVTuET8MY" // Ejaculating
      : "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.rvqKrcRPi3g6wCFX"; // Cumming

    await applyEffect(actor, orgasmEffect);
  }

  /**
   * Updates any resource bar for an actor.
   * @param {Actor} actor 
   * @param {number} barId 
   * @param {number} value 
   */
  static async updateBar(actor, barId, value) {
    if (!validateActor(actor)) return;

    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return;

    await token.update({ [`flags.barbrawl.resourceBars.bar${barId}.value`]: value });
  }

  /**
   * Fetches the current value of a specific resource bar.
   * @param {Actor} actor 
   * @param {number} barId 
   * @returns {number|null}
   */
  static getBarValue(actor, barId) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return null;
    return getProperty(token, `flags.barbrawl.resourceBars.bar${barId}.value`) ?? null;
  }

  /**
   * Checks arousal thresholds for effect application.
   * @param {Actor} actor 
   * @param {number} arousal 
   */
  static async checkArousalThresholds(actor, arousal) {
    const threshold = getSetting("arousalThreshold") ?? 75;
    const effectUUID = "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.LCFosympIlNUW6SK"; // Example: Aroused

    if (arousal >= threshold) {
      await applyEffect(actor, effectUUID);
    } else {
      await removeEffect(actor, effectUUID);
    }
  }
}
