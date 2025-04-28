// fertility-engine.js
// [D&Degenerates] Handles pregnancy risk calculations, womb volume tracking, fertilization, and milk production

import { EventSystem } from "./event-system.js";
import { logDebug, clamp } from "./utils.js";

export const FertilityEngine = {

  async applyInternalCumshot(targetActor, amount) {
    if (!targetActor || amount == null) return;

    const currentVolume = targetActor.flags?.dndegen?.wombVolume || 0;
    const newVolume = currentVolume + amount;

    await targetActor.update({ "flags.dndegen.wombVolume": newVolume });
    logDebug(`[D&Degenerates] Applied internal cumshot to ${targetActor.name}. New womb volume: ${newVolume}`);

    await this.checkForFertilization(targetActor);
  },

  async checkForFertilization(targetActor) {
    if (!targetActor) return;

    const ovulationStatus = targetActor.flags?.dndegen?.isOvulating || false;
    const currentVolume = targetActor.flags?.dndegen?.wombVolume || 0;
    const fertilityThreshold = game.settings.get("dndegen", "fertilityThreshold") || 5;

    if (ovulationStatus && currentVolume >= fertilityThreshold) {
      logDebug(`[D&Degenerates] Fertilization conditions met for ${targetActor.name}.`);
      await this.applyFertilizedEffect(targetActor);
    }
  },

  async applyFertilizedEffect(targetActor) {
    if (!targetActor) return;

    const effectUUID = "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.Fertilized";
    const effect = await fromUuid(effectUUID);
    if (!effect) {
      console.error("[D&Degenerates] Fertilized effect not found by UUID.");
      return;
    }

    await targetActor.createEmbeddedDocuments("Item", [effect.toObject()]);
    logDebug(`[D&Degenerates] Fertilized effect applied to ${targetActor.name}.`);
  },

  async decayWombVolume(actor, minutesPassed) {
    if (!actor || minutesPassed <= 0) return;

    const decayRate = game.settings.get("dndegen", "wombVolumeDecayRate") || 0.1;
    const currentVolume = actor.flags?.dndegen?.wombVolume || 0;
    const decayAmount = decayRate * minutesPassed;
    const newVolume = clamp(currentVolume - decayAmount, 0, 9999);

    await actor.update({ "flags.dndegen.wombVolume": newVolume });
    logDebug(`[D&Degenerates] Womb volume decayed for ${actor.name}: ${currentVolume} -> ${newVolume}`);
  },

};

// Register EventSystem listener for InternalCumshot
EventSystem.on("InternalCumshot", async ({ target, amount }) => {
  if (!target || amount == null) {
    logDebug("[D&Degenerates] Skipping InternalCumshot event due to missing target or amount.");
    return;
  }

  try {
    await FertilityEngine.applyInternalCumshot(target, amount);
    logDebug(`[D&Degenerates] InternalCumshot event processed for ${target.name} (amount: ${amount}).`);
  } catch (error) {
    console.error("[D&Degenerates] Error processing InternalCumshot event:", error);
  }
});

// [D&Degenerates] ✅ FertilityEngine now responds to EventSystem events and maintains full original functionality.
