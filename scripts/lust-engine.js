// Lust Engine for Dungeons & Degenerates
// Handles lust aura influence, cooldowns, and bar decay

/**
 * LustEngine tracks and applies Lust stimuli from auras, attire, and effects.
 * Also handles lust decay and exposure-based scaling.
 */

import { getSetting } from './settings-manager.js';
import { getBarValue, calculateFalloff, calculateLustDecay, calculateStimulusIncrement } from './lust-utils.js';
import { applyEffect } from './effect-utils.js';
import { round2, clamp, setBarValue } from './utils.js';
import { AttireSystem } from './attire-system.js';

export class LustEngine {
  /**
   * Initialize the LustEngine and stimulus logic (injected later).
   */
  constructor() {
    this.stimuli = {
      getActiveStimuli: (actor) => {
        // Placeholder until config is populated elsewhere
      }
    };
  }

  /**
   * Apply Lust stimulus from source to a list of nearby observers.
   * @param {object} options
   * @param {Token} options.sourceToken
   * @param {Token[]} options.observers
   * @param {string} options.stimulus
   */
  async applyStimulus({ sourceToken, observers, stimulus }) {
    if (!sourceToken?.actor) return console.warn("[D&Degenerates] ❌ applyStimulus skipped — missing source actor.");
    if (!Array.isArray(observers) || observers.length === 0) return;

    const config = this.stimuli[stimulus];
    if (!config || !observers?.length) return;

    const CHA = Number(sourceToken.actor.system?.abilities?.cha?.mod ?? 0);
    logDebug("info", `[D&Degenerates] CHA mod for ${sourceToken.name} is: ${CHA}`);

    for (const observer of observers) {
      const Libido = Number(getBarValue(observer, "bar4")) || 0;
      const Lust = Number(getBarValue(observer, "bar3")) || 0;
      const base = config.base;
      const distance = canvas.grid.measureDistance(sourceToken.center, observer.center);
      const falloff = calculateFalloff(distance, config.falloff);
      let increment = calculateStimulusIncrement({ base, formula: config.formula, falloff, CHA, Libido });

      const attire = new AttireSystem(sourceToken.actor);
      const lustScale = AttireSystem.getLustCoverageScale(sourceToken.actor);
      increment *= lustScale;
      logDebug("info", `[D&Degenerates] 🎚️ Scaled Lust by coverage factor (${lustScale.toFixed(2)}): ${increment.toFixed(2)}`);
      const newValue = clamp(Lust + increment, Libido, 100);

      const rounded = round2(newValue);
      if (rounded !== Lust) {
        await setBarValue(observer, 3, rounded);
        await observer.document.setFlag("barbrawl", "resourceBars.bar3.value", rounded);
        logDebug("info", `[D&Degenerates] ✅ Fallback update for Lust applied to ${observer.name}`);
        logDebug("info", `[D&Degenerates] ${observer.name} affected by ${stimulus}: +${increment.toFixed(2)} Lust → ${rounded}`);
      } else {
        logDebug("info", `[D&Degenerates] No Lust change for ${observer.name} (Lust=${Lust}, Increment=${increment.toFixed(2)})`);
      }
    }
  }

  /**
   * Apply passive Lust decay for a single token.
   * @param {Token} token
   */
  applyLustDecay(token) {
    if (!token?.actor) return console.warn("[D&Degenerates] Lust decay skipped — missing actor.");

    const barData = token.document?.flags?.barbrawl?.resourceBars;
    if (!barData?.bar3 || !barData?.bar4) return console.warn("[D&Degenerates] Lust decay skipped — missing bar data.");
    const current = getBarValue(token, "bar3");
    const libido = getBarValue(token, "bar4");
    const decay = this.settings.lustDecay;
    if (current > libido && decay > 0) {
      const newValue = round2(clamp(calculateLustDecay(current, libido, decay), libido, 100));
      await setBarValue(token, 3, newValue);
      if (getSetting("debugMode")) console.log(`[D&Degenerates] Lust decayed: ${current} → ${newValue}`);
    }
  }

  /**
   * Find valid player-owned observers within aura radius.
   * @param {Token} sourceToken
   * @param {object} options
   * @param {number} [options.radius=30]
   * @param {boolean} [options.includeAllies=true]
   * @param {boolean} [options.excludeSelf=true]
   * @returns {Token[]} List of observers
   */
  getNearbyObservers(sourceToken, { radius = 30, includeAllies = true, excludeSelf = true } = {}) {
    return canvas.tokens.placeables.filter(observer => {
      if (!observer.actor?.hasPlayerOwner) return false;
      if (excludeSelf && observer === sourceToken) return false;
      if (!includeAllies && observer.document.disposition === sourceToken.document.disposition) return false;
      if (observer.actor.system.attributes?.hp?.value <= 0) return false;
      const distance = canvas.grid.measureDistance(sourceToken.center, observer.center);
      return distance <= radius;
    });
  }

  /**
   * Public handler triggered by Lust Aura macro or aura entry logic.
   * @param {object} options
   * @param {Token} sourceToken
   * @param {Token} targetToken
   */
  async handleLustAura({ sourceToken, targetToken }) {
    logDebug("info", "[D&Degenerates] handleLustAura() called");
    logDebug("info", "→ sourceToken:", sourceToken);
    logDebug("info", "→ targetToken:", targetToken);
    if (!sourceToken || !targetToken) return console.warn("[D&Degenerates] ❌ Trigger skipped — source or target is undefined.");
    if (!sourceToken.document || !targetToken.document) return console.warn("[D&Degenerates] ❌ Trigger skipped — token.document missing.");
    if (!sourceToken.actor || !targetToken.actor) return console.warn("[D&Degenerates] ❌ Trigger skipped — token.actor missing.");
    logDebug("info", `[D&Degenerates] ✅ Lust Aura handler invoked → ${targetToken.name} is affected by ${sourceToken.name}`);
    await globalThis.dndPF2e?.lustEngine?._handleLustAuraEntry(sourceToken, targetToken);
  }

  /**
   * Internal handler triggered by Lust Aura proximity logic.
   * Matches source traits/effects to configured stimuli.
   * @param {Token} sourceToken
   * @param {Token} targetToken
   */
  async _handleLustAuraEntry(sourceToken, targetToken) {
    if (!sourceToken?.actor || !targetToken?.actor) {
      console.warn("[D&Degenerates] ❌ Aura entry skipped — missing actor(s).");
      return;
    }

    const barData = targetToken.document?.flags?.barbrawl?.resourceBars;
    if (!barData?.bar3 || !barData?.bar4) {
      console.warn("[D&Degenerates] ❌ Aura entry skipped — missing lust/libido bars.");
      return;
    }
    if (!sourceToken?.actor || !targetToken?.actor) return;

    const stimulusTypes = Object.keys(this.stimuli.traitMap);
    const attire = new AttireSystem(sourceToken.actor);
    const actorTraits = attire.getEquippedItems()
      .flatMap(item => attire._extractTraits(item))
      .map(t => t.toLowerCase());
    const effectSlugs = sourceToken.actor.itemTypes.effect.map(e => e.slug ?? e.name.toLowerCase());

    for (const stimulus of stimulusTypes) {
      const hasTrait = this.stimuli.traitMap[stimulus]?.some(t => actorTraits.includes(t));
      const hasEffect = this.stimuli.effectMap[stimulus]?.some(e => effectSlugs.includes(e));
      const config = this.stimuli[stimulus];
      if (!config || !(hasTrait || hasEffect)) {
        if (game.settings.get("dndPF2e", "debugMode")) {
          console.log(`[D&Degenerates] Skipping stimulus '${stimulus}' → trait/effect not matched.`);
        }
        continue;
      }

      const Libido = Number(getBarValue(targetToken, "bar4")) || 0;
      const Lust = Number(getBarValue(targetToken, "bar3")) || 0;
      const base = config.base;
      const CHA = Number(sourceToken.actor?.system?.abilities?.cha?.mod ?? 0);
      const distance = canvas.grid.measureDistance(sourceToken.center, targetToken.center);
      const falloff = calculateFalloff(distance, config.falloff);

      let increment = calculateStimulusIncrement({ base, formula: config.formula, falloff, CHA, Libido });
      increment *= AttireSystem.getLustCoverageScale(sourceToken.actor);
      const rounded = round2(clamp(Lust + increment, Libido, 100));

      if (rounded !== Lust) {
        await setBarValue(targetToken, 3, rounded);
        await targetToken.document.setFlag("barbrawl", "resourceBars.bar3.value", rounded);
        if (game.settings.get("dndPF2e", "debugMode")) {
          console.log(`[D&Degenerates] 💢 Aura Lust gain applied to ${targetToken.name} from ${sourceToken.name}`);
          console.log(`[D&Degenerates] ${targetToken.name} affected by ${stimulus}: +${increment.toFixed(2)} → ${rounded}`);
        }
      }
    }
  }
}

// Register engine globally
if (globalThis.dndPF2e === undefined) globalThis.dndPF2e = {};
globalThis.dndPF2e.LustEngine = LustEngine;
