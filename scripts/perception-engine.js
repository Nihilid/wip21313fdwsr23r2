const MODULE_NAME = "dungeons-and-degenerates-pf2e";

export class PerceptionEngine {
  static initialize() {
    console.log(`[D&Degenerates] ✅ Perception Engine initialized`);
  }

  static async handleExposureCheck() {
    for (const pc of game.actors.contents.filter(a => a.hasPlayerOwner && a.type === "character")) {
      if (!PerceptionEngine.isExposed(pc)) continue;
      if (PerceptionEngine.isHidden(pc)) continue;

      for (const npc of PerceptionEngine.getNearbyNPCs(pc)) {
        PerceptionEngine.applyLustGain(npc);
      }
    }
  }

  static isExposed(actor) {
    // Check actor exposure status (e.g., nudity flags, attire coverage)
    // (Placeholder for attire-exposure.js or attire-utils.js integration)
    return true;
  }

  static isHidden(actor) {
    // Check if actor is Concealed, Hidden, Undetected, Unnoticed
    // (Placeholder for stealth state detection)
    return false;
  }

  static getNearbyNPCs(actor) {
    const range = game.settings.get(MODULE_NAME, "perceptionDetectionRange") || 30;
    const token = actor.getActiveTokens(true, true)[0];
    if (!token) return [];

    return canvas.tokens.placeables.filter(npc => {
      if (!npc.actor || npc.actor.hasPlayerOwner) return false;
      const distance = canvas.grid.measureDistance(token, npc);
      return distance <= range;
    });
  }

  static async applyLustGain(npc) {
    // Apply Lust gain to detected NPC
    console.log(`[D&Degenerates] ❤️ NPC ${npc.name} affected by exposure.`);
    // (Hook into Lust Engine to increase Lust appropriately)
  }
}
