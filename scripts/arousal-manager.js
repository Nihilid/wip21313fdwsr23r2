// ==========================
// Dungeons & Degenerates - arousal-manager.js
// Handles time-based stat changes and orgasm handling
// ==========================

import { applyEffect, removeEffect } from "./effect-engine.js";
import { getArousalThreshold, getStimDecayRate, getOrgasmResistanceDC, getDecayImmunityDuration } from "./settings.js";
import { clampValue, validateActor, updateBar, getBarValue, detectGender } from "./utils.js";
import { BAR_MAPPING } from "./constants.js";
import { FlavorEngine } from "./flavor-engine.js";
import { EventSystem } from "./event-system.js";

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class ArousalManager {
  static initiliaze() {
    console.log("[D&Degenerates] ✅ ArousalManager initialized");

    // Register EventSystem listeners
    EventSystem.on("arousal.increase", ({ targetToken, amount }) => {
      if (!targetToken || !targetToken.actor || typeof amount !== "number") return;
      ArousalManager.increaseArousal(targetToken.actor, amount); // Pass the correct actor!
    });
  }

  static async increaseArousal(actor, amount) {
    if (!validateActor(actor)) return;

    const current = getBarValue(actor, BAR_MAPPING.AROUSAL) || 0;
    const newValue = clampValue(current + amount, 0, 100);
    await updateBar(actor, BAR_MAPPING.AROUSAL, newValue);

    await this.checkArousalThresholds(actor, newValue);
  }

  static async increaseStimulation(actor, amount) {
    if (!validateActor(actor)) return;

    const gender = detectGender(actor);
    if (gender === "male") {
      amount *= 0.5; // Males gain stimulation slower
    }

    const current = getBarValue(actor, BAR_MAPPING.STIMULATION) || 0;
    const newValue = clampValue(current + amount, 0, 100);
    await updateBar(actor, BAR_MAPPING.STIMULATION, newValue);

    await this.monitorStimulation(actor);
  }

  static async monitorStimulation(actor) {
    if (!validateActor(actor)) return;

    const stim = getBarValue(actor, BAR_MAPPING.STIMULATION);
    if (stim >= 100) {
      await this.handleOrgasmResistance(actor);
    }
  }

  static async handleOrgasmResistance(actor) {
    if (!validateActor(actor)) return;

    const gender = detectGender(actor);
    const isMolested = actor?.effects?.some(e => e.slug === "molested") ?? false;

    if (gender !== "female" || !isMolested) {
      console.log(`[D&Degenerates] ⚠️ Orgasm resistance skipped (not molested or not female): ${actor.name}`);
      await this.handleOrgasm(actor);
      return;
    }

    try {
      const fortSave = await actor.saves.fortitude?.roll({ skipDialog: true });
      if (!fortSave) {
        console.warn(`[D&Degenerates] ❌ No Fortitude save available for ${actor.name}.`);
        await this.handleOrgasm(actor);
        return;
      }

      const dc = getOrgasmResistanceDC() || 25;
      if (fortSave.total < dc) {
        console.log(`[D&Degenerates] 😵 ${actor.name} failed orgasm resistance (rolled ${fortSave.total} vs DC ${dc})`);
        await this.handleOrgasm(actor);
      } else {
        console.log(`[D&Degenerates] 😈 ${actor.name} resisted orgasm (rolled ${fortSave.total} vs DC ${dc})`);
        await FlavorEngine.sendResistMessage(actor);
      }
    } catch (err) {
      console.error(`[D&Degenerates] ❌ Error during orgasm resistance check:`, err);
      await this.handleOrgasm(actor);
    }
  }

  static async handleOrgasm(actor) {
    console.log(`[D&Degenerates] 💦 Orgasm triggered for ${actor.name}`);

    await updateBar(actor, BAR_MAPPING.STIMULATION, 0);

    const now = game.time.worldTime;
    const immunityMinutes = getDecayImmunityDuration() || 10;
    await actor.setFlag(MODULE_NAME, "lastOrgasmTime", now);
    await actor.setFlag(MODULE_NAME, "decayImmunityUntil", now + (immunityMinutes * 60));

    const gender = detectGender(actor);
    const isEjaculating = (gender === "male");

    const orgasmEffect = isEjaculating
      ? "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.zXZ2wXVYVTuET8MY"
      : "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.rvqKrcRPi3g6wCFX";

    await applyEffect(actor, orgasmEffect);
    await FlavorEngine.sendOrgasmMessage(actor, isEjaculating);
  }

  static async checkArousalThresholds(actor, arousal) {
    const threshold = getArousalThreshold() ?? 75;
    const effectUUID = "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.LCFosympIlNUW6SK";

    if (arousal >= threshold) {
      await applyEffect(actor, effectUUID);
    } else {
      await removeEffect(actor, effectUUID);
    }
  }

  static async handleTimeProgression() {
    for (const actor of game.actors.contents) {
      if (!validateActor(actor)) continue;

      const now = game.time.worldTime;
      const immunityUntil = getProperty(actor, `flags.${MODULE_NAME}.decayImmunityUntil`) || 0;

      if (now < immunityUntil) {
        console.log(`[D&Degenerates] ⏳ Skipping stimulation decay for ${actor.name} (decay immunity active)`);
        continue;
      }

      const currentStim = getBarValue(actor, BAR_MAPPING.STIMULATION) || 0;
      const decayRate = getStimDecayRate() || 5;
      const newStim = Math.max(currentStim - decayRate, 0);

      await updateBar(actor, BAR_MAPPING.STIMULATION, newStim);
      await this.monitorStimulation(actor);
    }
  }
}
