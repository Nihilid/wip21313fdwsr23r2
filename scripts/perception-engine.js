// perception-engine.js
import { getNearbyTokens } from "./utils.js"; // (optional, if using future utilities)

const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class PerceptionEngine {
  static initialize() {
    console.log(`[D&Degenerates] ✅ Perception Engine initialized`);
  }

  /**
   * Called every in-game minute by the Simple Calendar event.
   * Scans for exposed PCs and applies Lust influence to nearby NPCs.
   */
  static async handleExposureCheck() {
    for (const pc of game.actors.contents.filter(a => a.hasPlayerOwner && a.type === "character")) {
      if (!PerceptionEngine.isExposed(pc)) continue;
      if (await PerceptionEngine.isHiddenFromAll(pc)) continue;

      const nearbyNPCs = PerceptionEngine.getNearbyNPCs(pc);

      for (const npc of nearbyNPCs) {
        PerceptionEngine.applyLustGain(npc);
      }
    }
  }

  /**
   * Basic placeholder until full attire-exposure.js link.
   * Returns true if the actor is considered exposed.
   */
  static isExposed(actor) {
    // Placeholder: Always return true for now.
    // Will hook into attire-system.js exposure detection soon.
    return true;
  }

  /**
   * Determines if the actor is concealed, hidden, unnoticed, or undetected to everyone nearby.
   */
  static async isHiddenFromAll(actor) {
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return true;

    // Search all enemy tokens
    for (const npc of canvas.tokens.placeables.filter(t => t.actor && !t.actor.hasPlayerOwner)) {
      if (await PerceptionEngine.isHiddenFrom(token, npc)) {
        continue;
      } else {
        return false; // At least one NPC can see this PC.
      }
    }
    return true;
  }

  /**
   * Check if a specific observer (npc) perceives the target (pc).
   * Integrates with PF2e Perception module if available.
   */
  static async isHiddenFrom(targetToken, observerToken) {
    if (!targetToken || !observerToken) return true;

    if (game.modules.get("pf2e-perception")?.active && game.pf2eperception?.api) {
      // Use PF2e Perception module if available
      const result = await game.pf2eperception.api.checkVisibility(observerToken, targetToken);
      return !result.visible; // If visible = true, then not hidden.
    } else {
      // Basic fallback: assume visible if within 30ft and unobstructed
      const distance = canvas.grid.measureDistance(observerToken, targetToken);
      return distance > 30; // If beyond 30ft, considered hidden.
    }
  }

  /**
   * Returns all NPCs within configured perception range of the PC.
   */
  static getNearbyNPCs(pcActor) {
    const range = game.settings.get(MODULE_NAME, "perceptionDetectionRange") || 30;
    const token = pcActor.getActiveTokens(true, true)[0];
    if (!token) return [];

    return canvas.tokens.placeables.filter(npc => {
      if (!npc.actor || npc.actor.hasPlayerOwner) return false;
      const distance = canvas.grid.measureDistance(token, npc);
      return distance <= range;
    });
  }

  /**
   * Applies Lust gain to an NPC influenced by a PC's exposure.
   */
  static async applyLustGain(npcToken) {
    const lustGain = game.settings.get(MODULE_NAME, "perceptionLustGain") || 1;

    console.log(`[D&Degenerates] ❤️ NPC ${npcToken.name} influenced by exposed PC, gaining ${lustGain} Lust.`);

    // (Future) Hook into Lust Engine to actually increase Lust bar.
    // e.g., LustEngine.increaseLust(npcToken.actor, lustGain);
  }
}
