// rape-engine.js
// [D&Degenerates] Manages rape-related mechanics: penetration resistance, fondle resistance, libido-scaled difficulty checks

import { EventSystem } from "./event-system.js";
import { clamp, logDebug } from "./utils.js";

export const RapeEngine = {

  async attemptPenetration(sourceActor, targetActor) {
    if (!sourceActor || !targetActor) return;

    // Example penetration logic (simplified)
    const penetrationDC = this.calculatePenetrationDC(targetActor);
    const roll = await sourceActor.saves.fortitude.roll({ skipDialog: true });

    if (roll.total >= penetrationDC) {
      logDebug(`[D&Degenerates] ${sourceActor.name} successfully penetrates ${targetActor.name}`);

      // Emit internal cumshot event (handled by FertilityEngine)
      EventSystem.emit("InternalCumshot", { target: targetActor, amount: 1 });

      // Emit raped effect (handled by EffectEngine)
      EventSystem.emit("ApplyRapedEffect", { actor: targetActor });

      // Emit wombfucked effect (handled by EffectEngine)
      EventSystem.emit("ApplyWombfuckedEffect", { actor: targetActor });

      // Emit arousal gain (handled by ArousalManager)
      EventSystem.emit("IncreaseArousal", { actor: targetActor, amount: 10 });

    } else {
      logDebug(`[D&Degenerates] ${sourceActor.name} fails to penetrate ${targetActor.name}`);
    }
  },

  async attemptFondle(sourceActor, targetActor, region) {
    if (!sourceActor || !targetActor) return;

    const fondleDC = this.calculateFondleDC(targetActor);
    const roll = await sourceActor.saves.reflex.roll({ skipDialog: true });

    if (roll.total >= fondleDC) {
      logDebug(`[D&Degenerates] ${sourceActor.name} successfully fondles ${targetActor.name}'s ${region}`);

      // Emit fondle event for flavor and stimulation effects
      EventSystem.emit("FondledRegion", { source: sourceActor, target: targetActor, region });

      // Emit arousal gain (handled by ArousalManager)
      EventSystem.emit("IncreaseArousal", { actor: targetActor, amount: 5 });

    } else {
      logDebug(`[D&Degenerates] ${sourceActor.name} fails to fondle ${targetActor.name}'s ${region}`);
    }
  },

  calculatePenetrationDC(targetActor) {
    const baseDC = 20;
    const libidoInfluence = clamp(targetActor.system.attributes.lust?.value || 0, 0, 100) / 10;
    return baseDC + libidoInfluence;
  },

  calculateFondleDC(targetActor) {
    const baseDC = 15;
    const libidoInfluence = clamp(targetActor.system.attributes.lust?.value || 0, 0, 100) / 10;
    return baseDC + libidoInfluence;
  }

};

// [D&Degenerates] ✅ RapeEngine fully event-based and using logDebug for logging.
