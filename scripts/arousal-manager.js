// arousal-manager.js
// [D&Degenerates] Manages stimulation decay, orgasm detection, arousal adjustments, and ejaculation triggers

import { EventSystem } from "./event-system.js";
import { logDebug, clamp } from "./utils.js";
import { settings } from "./settings.js";

export const ArousalManager = {

  async adjustArousalAndStimulation(actor, { arousal = 0, stimulation = 0 }) {
    if (!actor) return;

    const currentArousal = actor.flags?.dndegen?.arousal || 0;
    const currentStim = actor.flags?.dndegen?.stimulation || 0;

    const newArousal = clamp(currentArousal + arousal, 0, 100);
    const newStim = clamp(currentStim + stimulation, 0, 100);

    await actor.update({
      "flags.dndegen.arousal": newArousal,
      "flags.dndegen.stimulation": newStim,
    });

    logDebug(`[D&Degenerates] Arousal updated for ${actor.name}: ${currentArousal} -> ${newArousal}`);
    logDebug(`[D&Degenerates] Stimulation updated for ${actor.name}: ${currentStim} -> ${newStim}`);

    if (newStim >= 100) {
      await this.triggerOrgasm(actor);
    }
  },

  async triggerOrgasm(actor) {
    if (!actor) return;

    logDebug(`[D&Degenerates] Orgasm triggered for ${actor.name}!`);

    await actor.update({
      "flags.dndegen.stimulation": 0,
      // Optionally reset arousal here if desired
    });

    // Additional orgasm effect logic would be handled here
  },

  async decayArousalOverTime(actor, minutesPassed) {
    if (!actor || minutesPassed <= 0) return;

    const decayRate = settings.arousalDecayRate() || 1;
    const current = actor.flags?.dndegen?.arousal || 0;
    const decayAmount = decayRate * minutesPassed;
    const newAmount = clamp(current - decayAmount, 0, 100);

    await actor.update({ "flags.dndegen.arousal": newAmount });
    logDebug(`[D&Degenerates] Arousal decayed for ${actor.name}: ${current} -> ${newAmount}`);
  },

};

// Register EventSystem listeners for arousal and stimulation events
EventSystem.on("IncreaseArousal", async ({ actor, amount }) => {
  if (!actor || amount == null) {
    logDebug("[D&Degenerates] Skipping IncreaseArousal event due to missing actor or amount.");
    return;
  }

  try {
    await ArousalManager.adjustArousalAndStimulation(actor, { arousal: amount });
    logDebug(`[D&Degenerates] IncreaseArousal event processed for ${actor.name} (amount: ${amount}).`);
  } catch (error) {
    console.error("[D&Degenerates] Error processing IncreaseArousal event:", error);
  }
});

EventSystem.on("FondledRegion", async ({ source, target, region }) => {
  if (!target || !region) {
    logDebug("[D&Degenerates] Skipping FondledRegion event due to missing target or region.");
    return;
  }

  let arousalGain = 5;
  let stimulationGain = 5;

  switch (region) {
    case "breasts":
      arousalGain = 8;
      stimulationGain = 5;
      break;
    case "pussy":
      arousalGain = 10;
      stimulationGain = 8;
      break;
    case "belly":
      arousalGain = 6;
      stimulationGain = 4;
      break;
  }

  try {
    await ArousalManager.adjustArousalAndStimulation(target, { arousal: arousalGain, stimulation: stimulationGain });
    logDebug(`[D&Degenerates] FondledRegion event processed for ${target.name}, region: ${region}.`);
  } catch (error) {
    console.error("[D&Degenerates] Error processing FondledRegion event:", error);
  }
});

// [D&Degenerates] ✅ ArousalManager now uses a universal adjuster for Arousal and Stimulation.
