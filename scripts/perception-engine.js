// perception-engine.js

import { isPerceptionEnabled, getPerceptionDetectionRange, getPerceptionLustGain } from "./settings.js";
import { LustEngine } from "./lust-engine.js";
import { AttireExposure } from "./attire-exposure.js"; // ✅ New import

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class PerceptionEngine {
  static initialize() {
    console.log(`[D&Degenerates] ✅ Perception Engine initialized`);
  }

  /**
   * Called every in-game minute by the Simple Calendar event.
   * Scans exposed PCs and applies Lust influence to nearby NPCs.
   */
  static async handleExposureCheck() {
    if (!isPerceptionEnabled()) return;
    console.log("[D&Degenerates] 🛠️ handleExposureCheck running exposure scan...");

    for (const token of canvas.tokens.placeables.filter(t => t.actor && t.actor.hasPlayerOwner && t.actor.type === "character")) {
      const pc = token.actor;
      console.log(`[D&Degenerates] 🧠 Evaluating PC: ${pc.name}`);

      if (!AttireExposure.isVisuallyEroticallyExposed(pc)) {
        console.log(`[D&Degenerates] 🚫 PC ${pc.name} is not erotically exposed, skipping.`);
        continue;
      }

      if (await PerceptionEngine.isHiddenFromAll(pc)) {
        console.log(`[D&Degenerates] 🚫 PC ${pc.name} is hidden from all NPCs, skipping.`);
        continue;
      }

      const nearbyNPCs = PerceptionEngine.getNearbyNPCs(pc);
      console.log(`[D&Degenerates] 👀 Found ${nearbyNPCs.length} NPCs near ${pc.name}.`);

      for (const npc of nearbyNPCs) {
        console.log(`[D&Degenerates] 🔥 Applying Lust to NPC: ${npc.name}`);
        await PerceptionEngine.applyLustGain(npc);
      }
    }
  }

  /**
   * Determines if the PC is concealed, hidden, unnoticed, or undetected to all nearby enemies.
   */
  static async isHiddenFromAll(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) {
      console.log(`[D&Degenerates] 🚫 No active token for ${actor.name}, assuming hidden.`);
      return true;
    }

    let npcCount = 0;

    for (const npc of canvas.tokens.placeables.filter(t => t.actor && !t.actor.hasPlayerOwner)) {
      npcCount++;
      const visible = await PerceptionEngine.isVisibleTo(token, npc);
      console.log(`[D&Degenerates] 🔎 Visibility check: ${npc.name} sees ${token.name}? ${visible}`);
      if (visible) {
        return false;
      }
    }

    if (npcCount === 0) {
      console.log(`[D&Degenerates] 🚫 No NPCs found for visibility check.`);
    }

    return true;
  }

  /**
   * Check if an observer token perceives the target token.
   * Integrates with PF2e Perception module if available.
   */
  static async isVisibleTo(targetToken, observerToken) {
    if (!targetToken || !observerToken) return false;

    if (game.modules.get("pf2e-perception")?.active && game.pf2eperception?.api) {
      // Use PF2e Perception module visibility check
      const result = await game.pf2eperception.api.checkVisibility(observerToken, targetToken);
      return result?.visible ?? false;
    } else {
      // Fallback: Assume visible if within 30ft range
      const distance = canvas.grid.measureDistance(observerToken, targetToken);
      return distance <= 30;
    }
  }

  /**
   * Returns all NPCs within configured perception range of the PC.
   */
  static getNearbyNPCs(pcActor) {
    const range = getPerceptionDetectionRange();
    const token = pcActor.getActiveTokens(true, true)[0];
    if (!token) return [];

    return canvas.tokens.placeables.filter(npc => {
      if (!npc.actor || npc.actor.hasPlayerOwner) return false;
      const distance = canvas.grid.measureDistance(token, npc);
      return distance <= range;
    });
  }

  /**
   * Applies Lust gain to an NPC influenced by exposure.
   */
  static async applyLustGain(npcToken) {
    const lustGain = getPerceptionLustGain();
    if (npcToken?.actor) {
      await LustEngine.increaseLust(npcToken.actor, lustGain);
      console.log(`[D&Degenerates] ❤️ NPC ${npcToken.name} gains ${lustGain} Lust from PC exposure.`);
    }
  }
}
