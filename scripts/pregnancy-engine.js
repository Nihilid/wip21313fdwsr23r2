// pregnancy-engine.js
// Handles tracking of pregnancy stages and transitions from Fertilized ova

/**
 * PregnancyEngine handles fertilization-to-birth logic for actors.
 * Includes gestation tracking, fetus volume handling, and calendar-based checks.
 */

import { applyStuffedEffects, checkQueuedImplantation } from "./pregnancy-utils.js";
import { getSetting } from "./settings-manager.js";
import { logDebug, round2, clamp, getBarValue } from "./utils.js";
import { UUIDS } from "./uuid-defs.js";

/**
 * Randomized gestation duration generator.
 * @param {boolean} isRapid - Whether gestation is rapid (shorter duration)
 * @returns {number} Hours of gestation
 */
function calculateGestationHours(isRapid) {
  const base = isRapid ? 24 : 72;
  const extra = isRapid ? 12 : 24;
  return base + Math.floor(Math.random() * extra);
}

/**
 * Clear all pregnancy tracking flags from an actor.
 * @param {Actor} actor
 * @returns {Promise<unknown[]>} Resolves when all flags are cleared
 */
function clearPregnancyFlags(actor) {
  return Promise.all([
    actor.unsetFlag("dndPF2e", "pregnancy.startTime"),
    actor.unsetFlag("dndPF2e", "pregnancy.endTime"),
    actor.unsetFlag("dndPF2e", "pregnancy.stage"),
    actor.unsetFlag("dndPF2e", "pregnancy.count"),
    actor.unsetFlag("dndPF2e", "pregnancy.gestationHours"),
    actor.setFlag("dndPF2e", "belly.fetusVolume", 0)
  ]);
}

/**
 * PregnancyEngine flavor helpers for milk-based AI/breast size logic
 * @param {Actor} actor
 * @returns {{ milkVolume: number, capacity: number, fullness: number, breastSize: string }}
 */
export function getMilkFlavorStats(actor) {
  const hasFeat = actor.items.some(i => i.name === "Massive Milkmakers");
  const capacity = Number(actor.flags?.dndPF2e?.milk?.maxVolume ?? (hasFeat ? 5000 : 2500));
  const volume = Number(actor.flags?.dndPF2e?.milk?.currentVolume ?? 0);
  const fullness = clamp(volume / capacity, 0, 1);

  let breastSize = "modest";
  if (fullness >= 0.9) breastSize = "enormous";
  else if (fullness >= 0.75) breastSize = "very large";
  else if (fullness >= 0.5) breastSize = "large";
  else if (fullness >= 0.3) breastSize = "noticeable";

  return {
    milkVolume: round2(volume),
    capacity,
    fullness: round2(fullness),
    breastSize
  };
}

export class PregnancyEngine {
  /**
   * Handle time-based milk production and leakage events.
   * @param {Actor} actor
   * @param {number} minutes
   */
  async updateLactation(actor, minutes) {
    if (!actor || !actor.hasPlayerOwner) return;

    const pregnancies = Number(actor.flags?.dndPF2e?.pregnancy?.count ?? 0);
    const baseRate = getSetting("milkGenerationRate") || 10; // mL/hr/pregnancy
    const hasFeat = actor.items.some(i => i.name === "Massive Milkmakers");
    const rateMultiplier = hasFeat ? 1.5 : 1;
    const defaultCapacity = hasFeat ? 5000 : 2500; // mL per hour per pregnancy

    const genRatePerMinute = (pregnancies * baseRate * rateMultiplier) / 60;
    const current = Number(actor.flags?.dndPF2e?.milk?.currentVolume ?? 0);
    const capacity = Number(actor.flags?.dndPF2e?.milk?.maxVolume ?? defaultCapacity);

    const newVolume = clamp(current + genRatePerMinute * minutes, 0, capacity);
    await actor.setFlag("dndPF2e", "milk.currentVolume", round2(newVolume));

    if (newVolume >= 0.9 * capacity) {
      const lastLeak = Number(actor.flags?.dndPF2e?.milk?.lastLeakTime ?? 0);
      const now = game.time.worldTime;
      let leakInterval = 10800; // 3 hours at 30%
      if (newVolume >= 0.3 * capacity) leakInterval = 10800;
      if (newVolume >= 0.4 * capacity) leakInterval = 9000;
      if (newVolume >= 0.5 * capacity) leakInterval = 7200;
      if (newVolume >= 0.7 * capacity) leakInterval = 5400;
      if (newVolume >= 0.9 * capacity) leakInterval = 3600;
      if (newVolume >= capacity) leakInterval = 3600;

      if (now - lastLeak >= leakInterval) {
        await actor.setFlag("dndPF2e", "milk.lastLeakTime", now);
        await game.dndPF2e?.effectEngine?.applyEffect(actor, UUIDS.LACTATING);
        logDebug("info", `[D&Degenerates] 💧 ${actor.name} leaks milk due to pressure!`);
      }
    }
  }

  /**
   * Check if an actor has reached full term and should give birth.
   * Clears pregnancy if complete.
   * @param {Actor} actor
   */
  async checkBirthReady(actor) {
    const endTime = getProperty(actor, "flags.dndPF2e.pregnancy.endTime");
    if (!endTime) return;

    const currentTime = game.time.worldTime;
    if (currentTime >= endTime) {
      logDebug("info", `🤱 ${actor.name} is ready to give birth!`);
      await clearPregnancyFlags(actor);
      logDebug("info", `👶 ${actor.name} has given birth. Pregnancy cleared.`);
    }
  }

  /**
   * Set up hooks for rest events and in-game time tracking.
   */
  constructor() {
    Hooks.on("dnd5e.restCompleted", async (actor) => {
      if (!actor?.hasPlayerOwner) return;
      await this.checkBirthReady(actor);
    });

    Hooks.on("simple-calendar-date-time-change", async ({ diff }) => {
      const minutes = Math.floor(diff / 60);
      if (minutes < 60) return;
      for (const token of canvas.tokens.placeables) {
        if (!token.actor?.hasPlayerOwner) continue;
        await checkQueuedImplantation(token.actor);
        await this.updateLactation(token.actor, minutes);
      }
    });
  }

  /**
   * Begin or advance a pregnancy from fertilized ova.
   * @param {Actor} actor
   */
  async advancePregnancy(actor) {
    if (!actor || !actor.itemTypes?.effect) return logDebug("warn", "[D&Degenerates] ⛔ Invalid actor passed to advancePregnancy.");
    const fertilized = actor.itemTypes.effect.filter(e => e.slug === "fertilized");
    if (fertilized.length === 0) return;

    const fetusVolumePerOvum = Number(getProperty(actor, "flags.dndPF2e.pregnancy.fetusVolumePerOvum")) || 2500;
    const spermVolume = Number(getProperty(actor, "flags.dndPF2e.belly.spermVolume")) || 0;
    const availableSpace = Math.max(0, 10000 - spermVolume);
    const maxFetuses = Math.floor(availableSpace / fetusVolumePerOvum);
    const fetusCount = Math.min(maxFetuses, fertilized.length);
    const totalVolume = fetusCount * fetusVolumePerOvum;

    await actor.setFlag("dndPF2e", "belly.fetusVolume", totalVolume);
    await actor.setFlag("dndPF2e", "pregnancy.stage", 1);
    await actor.setFlag("dndPF2e", "pregnancy.count", fetusCount);

    const isRapid = Boolean(getProperty(actor, "flags.dndPF2e.pregnancy.rapidGestation"));
    const duration = calculateGestationHours(isRapid);
    const startTime = game.time.worldTime;
    const endTime = startTime + duration * 3600;

    await actor.setFlag("dndPF2e", "pregnancy.startTime", startTime);
    await actor.setFlag("dndPF2e", "pregnancy.endTime", endTime);
    await actor.setFlag("dndPF2e", "pregnancy.gestationHours", duration);
    await applyStuffedEffects(actor, totalVolume);

    // 🍼 Squirting Milk on orgasm as well if milk volume is high
    const milkVolume = Number(actor.flags?.dndPF2e?.milk?.currentVolume ?? 0);
    const milkCapacity = Number(actor.flags?.dndPF2e?.milk?.maxVolume ?? (actor.items.some(i => i.name === "Massive Milkmakers") ? 5000 : 2500));
    if (milkVolume >= 0.5 * milkCapacity) {
      await game.dndPF2e?.effectEngine?.applyEffect(actor, UUIDS.SQUIRTING_MILK);
      logDebug("info", `[D&Degenerates] 🥛 ${actor.name} starts squirting milk due to orgasm!`);
    }

    // 🍼 Squirting Milk on fertilization if milk volume is high
    const milkVol = Number(actor.flags?.dndPF2e?.milk?.currentVolume ?? 0);
    const milkCap = Number(actor.flags?.dndPF2e?.milk?.maxVolume ?? (actor.items.some(i => i.name === "Massive Milkmakers") ? 5000 : 2500));
    if (milkVol >= 0.5 * milkCap) {
      await game.dndPF2e?.effectEngine?.applyEffect(actor, UUIDS.SQUIRTING_MILK);
      logDebug("info", `[D&Degenerates] 🥛 ${actor.name} starts squirting milk after being fertilized!`);
    }

    logDebug("info", `🤰 ${actor.name} is now pregnant with ${fetusCount} fetus(es)!`);

    const token = actor.getActiveTokens()[0];
    if (token) {
      game.dndPF2e?.ai?.onPregnant?.(token);
      const interest = game.dndPF2e?.ai?.getPregnancyInterest?.(token);
      if (interest > 1) {
        const msg = `${token.name}'s growing belly seems to be attracting unwanted attention...`;
        game.dndPF2e?.flavorEngine?.sendChat?.(msg);
      }
    }

    let removed = 0;
    for (const fx of fertilized) {
      if (removed >= fetusCount) {
        await fx.update({ "flags.dndPF2e.pregnancy.queued": true });
        continue;
      }
      await fx.delete();
      removed++;
    }
  }
}
