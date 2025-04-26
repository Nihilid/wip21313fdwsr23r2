// perception-engine.js
import { isPerceptionEnabled, getPerceptionDetectionRange, getPerceptionLustGain } from "./settings-manager.js";
import { LustEngine } from "./lust-engine.js";

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

    for (const pc of game.actors.contents.filter(a => a.hasPlayerOwner && a.type === "character")) {
      if (!PerceptionEngine.isExposed(pc)) continue;
      if (await PerceptionEngine.isHiddenFromAll(pc)) continue;

      const nearbyNPCs = PerceptionEngine.getNearbyNPCs(pc);

      for (const npc of nearbyNPCs) {
        await PerceptionEngine.applyLustGain(npc);
      }
    }
  }

  /**
   * Placeholder for full attire-exposure.js integration.
   * Returns true if the PC is considered exposed.
   */
  static isExposed(actor) {
    // TODO: Hook into attire-exposure.js exposure check
    // For now: assume PCs are always exposed for testing
    return true;
  }

  /**
   * Determines if the PC is concealed, hidden, unnoticed, or undetected to all nearby enemies.
   */
  static async isHiddenFromAll(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return true;

    for (const npc of canvas.tokens.placeables.filter(t => t.actor && !t.actor.hasPlayerOwner)) {
      if (await PerceptionEngine.isVisibleTo(token, npc)) {
        return false; // At least one NPC can see them
      }
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

    // TODO: Hook into Lust Engine for actual Lust bar adjustment
    // Example: LustEngine.increaseLust(npcToken.actor, lustGain);
  }
}
