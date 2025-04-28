// effect-engine.js
// [D&Degenerates] Manages sexual condition effects: Raped, Wombfucked, Scrawled, and related applications/removals

import { EventSystem } from "./event-system.js";
import { logDebug } from "./utils.js";
import { UUID_DEFS } from "./uuid-defs.js";
import { EventSystem } from "./event-system.js";
import { EventSystem } from "./event-system.js";

Hooks.once('ready', () => {
  EventSystem.on("effect.apply", ({ targetToken, type }) => {
    if (!targetToken || !targetToken.actor || !type) return;

    switch (type) {
      case "raped":
        EffectEngine.applyRapedEffect(targetToken);
        break;
      case "wombfucked":
        EffectEngine.applyWombfuckedEffect(targetToken);
        break;
      // Add more cases if needed later
    }
  });
});


export const EffectEngine = {

  async applyEffect(actor, effectUuid) {
    if (!actor || !effectUuid) return;

    const effect = await fromUuid(effectUuid);
    if (!effect) {
      console.error(`[D&Degenerates] Effect not found: ${effectUuid}`);
      return;
    }

    const existing = actor.items.find(i => i.flags.core?.sourceId === effectUuid);
    if (existing) {
      logDebug(`[D&Degenerates] Effect already present on ${actor.name}: ${effect.name}`);
      return;
    }

    await actor.createEmbeddedDocuments("Item", [effect.toObject()]);
    logDebug(`[D&Degenerates] Effect applied: ${effect.name} to ${actor.name}`);
  },

  async removeEffect(actor, effectUuid) {
    if (!actor || !effectUuid) return;

    const existing = actor.items.find(i => i.flags.core?.sourceId === effectUuid);
    if (!existing) {
      logDebug(`[D&Degenerates] No existing effect to remove from ${actor.name}: ${effectUuid}`);
      return;
    }

    await existing.delete();
    logDebug(`[D&Degenerates] Effect removed: ${existing.name} from ${actor.name}`);
  },

};

// Register EventSystem listeners for effects
EventSystem.on("ApplyRapedEffect", async ({ actor }) => {
  if (!actor) {
    logDebug("[D&Degenerates] Skipping ApplyRapedEffect event due to missing actor.");
    return;
  }

  try {
    await EffectEngine.applyEffect(actor, UUID_DEFS.RAPED);
    logDebug(`[D&Degenerates] ApplyRapedEffect event processed for ${actor.name}.`);
  } catch (error) {
    console.error("[D&Degenerates] Error processing ApplyRapedEffect event:", error);
  }
});

EventSystem.on("ApplyWombfuckedEffect", async ({ actor }) => {
  if (!actor) {
    logDebug("[D&Degenerates] Skipping ApplyWombfuckedEffect event due to missing actor.");
    return;
  }

  try {
    await EffectEngine.applyEffect(actor, UUID_DEFS.WOMB_FUCKED);
    logDebug(`[D&Degenerates] ApplyWombfuckedEffect event processed for ${actor.name}.`);
  } catch (error) {
    console.error("[D&Degenerates] Error processing ApplyWombfuckedEffect event:", error);
  }
});
