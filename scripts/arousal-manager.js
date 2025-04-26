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
import { getArousalThreshold, getStimDecayRate, getOrgasmResistanceDC } from "./settings-manager.js";
import { clampValue, validateActor } from "./utils.js";
import { BAR_MAPPING } from "./constants.js";

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

    await ArousalManager.monitorStimulation(actor);
  }

  /**
   * Monitors stimulation for overflow (100).
   * @param {Actor} actor 
   */
  static async monitorStimulation(actor) {
    if (!validateActor(actor)) return;

    const stim = ArousalManager.getBarValue(actor, BAR_MAPPING.STIMULATION);
    if (stim >= 100) {
      await ArousalManager.handleOrgasmResistance(actor);
    }
  }

  /**
   * Handles orgasm resistance save.
   * @param {Actor} actor 
   */
  static async handleOrgasmResistance(actor) {
    if (!validateActor(actor)) return;

    try {
      const fortSave = await actor.saves.fortitude?.roll({ skipDialog: true });
      if (!fortSave) {
        console.warn(`[D&Degenerates] ❌ No Fortitude save available for ${actor.name}.`);
        await ArousalManager.handleOrgasm(actor);
        return;
      }

      const dc = getOrgasmResistanceDC() || 25;
      if (fortSave.total < dc) {
        console.log(`[D&Degenerates] 😵 ${actor.name} failed orgasm resistance (rolled ${fortSave.total} vs DC ${dc})`);
        await ArousalManager.handleOrgasm(actor);
      } else {
        console.log(`[D&Degenerates] 😈 ${actor.name} resisted orgasm (rolled ${fortSave.total} vs DC ${dc})`);
        // (Optional) apply "On Edge" effect here later if we want
      }
    } catch (err) {
      console.error(`[D&Degenerates] ❌ Error during orgasm resistance check:`, err);
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
    const threshold = getArousalThreshold() ?? 75;
    const effectUUID = "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.LCFosympIlNUW6SK"; // Aroused effect

    if (arousal >= threshold) {
      await applyEffect(actor, effectUUID);
    } else {
      await removeEffect(actor, effectUUID);
    }
  }

  /**
   * Decays stimulation for all actors over time.
   */
  static async handleTimeProgression() {
    for (const actor of game.actors.contents) {
      if (!validateActor(actor)) continue;

      const currentStim = ArousalManager.getBarValue(actor, BAR_MAPPING.STIMULATION) || 0;
      const decayRate = getStimDecayRate() || 5;

      const newStim = Math.max(currentStim - decayRate, 0);
      await ArousalManager.updateBar(actor, BAR_MAPPING.STIMULATION, newStim);

      await ArousalManager.monitorStimulation(actor);
    }
  }
}
