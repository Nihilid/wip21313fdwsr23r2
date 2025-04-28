// arousal-manager.js
// [D&Degenerates] Manages stimulation decay, orgasm detection, arousal adjustments, and ejaculation triggers

import { EventSystem } from "./event-system.js";
import { logDebug, clamp } from "./utils.js";
import { settings } from "./settings.js";

export const ArousalManager = {

  async increaseArousal(actor, amount) {
    if (!actor || amount == null) return;

    const current = actor.flags?.dndegen?.arousal || 0;
    const newAmount = clamp(current + amount, 0, 100);

    await actor.update({ "flags.dndegen.arousal": newAmount });
    logDebug(`[D&Degenerates] Increased arousal for ${actor.name}: ${current} -> ${newAmount}`);

    await this.checkOrgasm(actor, newAmount);
  },

  async checkOrgasm(actor, arousalValue) {
    if (!actor || arousalValue < 100) return;

    logDebug(`[D&Degenerates] Orgasm triggered for ${actor.name}!`);

    // Example: Reset arousal, trigger effects, etc.
    await actor.update({ "flags.dndegen.arousal": 0 });
    // Additional orgasm logic would be expanded here (e.g., ejaculation triggers)
  },

  async applyFondleStim(actor, region) {
    if (!actor || !region) return;

    let arousalGain = 5;
    switch (region) {
      case "breasts":
        arousalGain = 8;
        break;
      case "pussy":
        arousalGain = 10;
        break;
      case "belly":
        arousalGain = 6;
        break;
    }

    logDebug(`[D&Degenerates] Fondled region '${region}' on ${actor.name}, arousal gain: ${arousalGain}`);
    await this.increaseArousal(actor, arousalGain);
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

// Register EventSystem listeners for arousal events
EventSystem.on("IncreaseArousal", async ({ actor, amount }) => {
  if (!actor || amount == null) {
    logDebug("[D&Degenerates] Skipping IncreaseArousal event due to missing actor or amount.");
    return;
  }

  try {
    await ArousalManager.increaseArousal(actor, amount);
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

  try {
    await ArousalManager.applyFondleStim(target, region);
    logDebug(`[D&Degenerates] FondledRegion event processed for ${target.name}, region: ${region}.`);
  } catch (error) {
    console.error("[D&Degenerates] Error processing FondledRegion event:", error);
  }
});
