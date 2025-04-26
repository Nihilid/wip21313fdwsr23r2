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

import { getSetting } from './settings-manager.js';
import { calculateLibidoChange, calculateArousalChange } from './arousal-utils.js';
import { clamp, round2, validateBars, logDebug, Bars } from './utils.js';
import { UUIDS } from './uuid-defs.js';
import {
  hasEffect,
  applyArousedEffect,
  removeArousedEffect,
  applyOrgasmEffect,
  applyArousedEffectIfNeeded
} from './effect-engine.js';
import { calculateStimulationDecay, handleOrgasmTrigger } from './stimulation-utils.js';

export class ArousalManager {
  /**
   * Perform an orgasm resistance check.
   * Rolls Fortitude save against static DC 20.
   * If resisted, stimulation is capped at 99. If not, climax is triggered.
   * @param {Actor} actor
   */
  async handleOrgasmResistance(actor) {
    const hasResisted = actor.flags?.dndPF2e?.orgasmResisted;
    const save = actor?.saves?.fort;
    if (!save?.roll) return logDebug("warn", "[D&Degenerates] ❌ Fort save missing for resistance check.");

    const libido = actor.flags?.barbrawl?.resourceBars?.bar4?.value ?? 0;
    const level = actor.system?.details?.level?.value ?? 1;
    const orgasmChainCount = actor.flags?.dndPF2e?.orgasmChainCount ?? 0;
    const dc = 15 + Math.floor(level / 2) + Math.floor(libido / 20) + (orgasmChainCount * 2);

    const result = await save.roll({ skipDialog: true });
    const resisted = hasResisted ? false : result.total >= dc;
    const stim = getProperty(actor, "flags.barbrawl.resourceBars.bar5.value") || 0;

    if (resisted && stim >= 100) {
      await actor.update({ "flags.barbrawl.resourceBars.bar5.value": 99 });
      logDebug("info", `[D&Degenerates] 🛡️ ${actor.name} resisted climax → Stimulation capped at 99.`);
    }

    if (!hasResisted && resisted) {
      await actor.setFlag("dndPF2e", "orgasmResisted", true);
    }

    if (!resisted) {
      await actor.setFlag("dndPF2e", "orgasmChainCount", orgasmChainCount + 1);
      await actor.unsetFlag("dndPF2e", "orgasmResisted");
      await handleOrgasmTrigger(actor, stim);
      await Bars.set(actor, 5, 0);
      await actor.unsetFlag("dndPF2e", "orgasmChainCount");
    }

    logDebug("info", `[D&Degenerates] 💦 Orgasm resistance roll: ${result.total} vs DC ${dc} → ${resisted ? "Resisted" : "Failed"}`);
  }
  }
  /**
   * Initializes the manager and registers update hooks.
   */
  constructor() {
    this.refreshSettings();
    this.registerStimulationHook();
    this.registerArousalEffectHook();
    this.stimProcessed = new Set();
  }

  /**
   * Reloads config settings from module settings.
   */
  refreshSettings() {
    this.arousalRate = getSetting('arousalRate') / 100 / 60;
    this.arousalMinRate = getSetting('arousalMinRate') / 100;
    this.libidoRate = getSetting('libidoRate') / 100 / 60;
    this.libidoMin = getSetting('libidoMin');
    this.libidoMinRate = getSetting('libidoMinRate') / 100;
    this.stimDecay = getSetting('stimDecay');
    this.debug = getSetting('debugMode');
  }

  /**
   * Register hook that reacts when stimulation reaches 100.
   * Applies orgasm effect and resets bar.
   */
  registerStimulationHook() {
    Hooks.on("updateToken", async (doc, changes) => {
      if (!changes.flags?.barbrawl?.resourceBars?.bar5?.value) return;

      const currentStim = changes.flags.barbrawl.resourceBars.bar5.value;
      const actor = doc.actor;
      if (typeof currentStim !== 'number' || currentStim < 100 || !actor) return;

      const stimKey = `${doc.id}-stim`;
      if (this.stimProcessed.has(stimKey)) return;
      this.stimProcessed.add(stimKey);
      setTimeout(() => this.stimProcessed.delete(stimKey), 100);

      await handleOrgasmTrigger(actor, currentStim);
      await Bars.set(doc, 5, 0);

      logDebug("info", `${actor.name} reached 100 Stimulation. Applied orgasm effect and reset to 0.`);
    });
  }

  /**
   * Register hook to apply or remove the "Aroused" effect instantly when bar2 changes.
   */
  registerArousalEffectHook() {
    Hooks.on("updateToken", async (doc, changes) => {
      if (!changes.flags?.barbrawl?.resourceBars?.bar2?.value) return;

      const newArousal = changes.flags.barbrawl.resourceBars.bar2.value;
      const actor = doc.actor;
      if (!actor || typeof newArousal !== 'number') return;

      await applyArousedEffectIfNeeded(actor, newArousal);
    });
  }

  /**
   * Updates all player-owned tokens on the canvas.
   * @param {number} minutes - Elapsed in-game minutes
   */
  async updateAllTokens(minutes) {
    const tokens = canvas.tokens.placeables.filter(token => token.actor?.hasPlayerOwner);
    logDebug("info", `Found ${tokens.length} eligible token(s) for update.`);
    for (const token of tokens) {
      await this.updateToken(token, minutes);
    }
  }

  /**
   * Updates all four bars on a single token.
   * @param {Token} token - Token to update
   * @param {number} minutes - Elapsed in-game minutes
   */
  async updateToken(token, minutes) {
    const bars = token.document.flags?.barbrawl?.resourceBars;
    if (!validateBars(bars)) return;

    this.refreshSettings();
    const secondsPerRound = game.modules.get("simple-calendar")?.api?.configuration?.secondsInCombatRound || 6;
    const rounds = minutes < 1 ? Math.floor(minutes * 60 / secondsPerRound) : 0;

    const arousal = bars.bar2?.value ?? 0;
    const lust = bars.bar3?.value ?? 0;
    const libido = bars.bar4?.value ?? 0;
    const stimulation = bars.bar5?.value ?? 0;

    logDebug("info", `DEBUG (${token.name}) | Arousal=${arousal} | Lust=${lust} | Libido=${libido} | Stimulation=${stimulation} | Minutes=${minutes}`);

    const newLibido = this.calculateLibido(libido, arousal, minutes);
    const newLust = this.calculateLust(lust, newLibido, libido, minutes);
    const newArousal = this.calculateArousal(arousal, newLust, minutes, rounds);
    const newStimulation = this.calculateStimulation(stimulation, minutes);

    logDebug("info", `Δ Arousal: ${round2(newArousal - arousal)} | Δ Libido: ${round2(newLibido - libido)}`);

    await token.document.setFlag("barbrawl", "resourceBars", {
      ...bars,
      bar2: { ...bars.bar2, value: newArousal },
      bar3: { ...bars.bar3, value: newLust },
      bar4: { ...bars.bar4, value: newLibido },
      bar5: { ...bars.bar5, value: newStimulation }
    });

    await applyArousedEffectIfNeeded(token.actor, newArousal);

    logDebug("info", `Updated token ${token.name} - After:`, {
      arousal: newArousal,
      libido: newLibido,
      lust: newLust,
      stimulation: newStimulation
    });
  }

  /**
   * Calculate libido progression using configured model and rate.
   * @param {number} libido
   * @param {number} arousal
   * @param {number} minutes
   * @returns {number}
   */
  calculateLibido(libido, arousal, minutes) {
    const libidoChangeRaw = calculateLibidoChange({
      libido,
      arousal,
      minutes,
      model: getSetting('libidoProgressionModel'),
      rate: this.libidoRate,
      minRate: this.libidoMinRate,
      minLibido: this.libidoMin
    });
    return round2(clamp(libido + libidoChangeRaw));
  }

  /**
   * Calculate lust value, decaying toward libido if not raised.
   * @param {number} lust
   * @param {number} newLibido
   * @param {number} oldLibido
   * @param {number} minutes
   * @returns {number}
   */
  calculateLust(lust, newLibido, oldLibido, minutes) {
    const decayRate = getSetting("lustDecay") / 100 / 60;
    const lustDecay = Math.max((lust - oldLibido) * decayRate * minutes, 0);
    return newLibido > lust ? round2(newLibido) : round2(Math.max(oldLibido, lust - lustDecay));
  }

  /**
   * Calculate arousal value as it trends toward lust.
   * @param {number} arousal
   * @param {number} newLust
   * @param {number} minutes
   * @param {number} rounds
   * @returns {number}
   */
  calculateArousal(arousal, newLust, minutes, rounds) {
    const arousalChangeRaw = calculateArousalChange({
      arousal,
      target: newLust,
      minutes,
      rounds,
      model: getSetting('arousalProgressionModel'),
      rate: this.arousalRate,
      minRate: this.arousalMinRate
    });
    return round2(clamp(arousal + arousalChangeRaw));
  }

  /**
   * Decay stimulation over time.
   * @param {number} stimulation
   * @param {number} minutes
   * @returns {number}
   */
  calculateStimulation(stimulation, minutes) {
    return round2(calculateStimulationDecay({ current: stimulation, rate: this.stimDecay, minutes }));
  }
}
