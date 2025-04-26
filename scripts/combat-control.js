/**
 * Combat Control System for Grapple Mechanics
 * Tracks and resolves stacking grapple attempts, attachment effects, and movement impairments.
 * Applies or removes effects like Clumsy and Grabbed, and adjusts speed accordingly.
 * Designed for integration with Pathfinder 2e in Foundry VTT.
 * @module combat-control
 */

import {
  getSizeIndex,
  isValidActorToken,
  applyEffectByUuid,
  removeEffectsBySlug
} from "./combat-utils.js";

import { UUIDS } from "./uuid-defs.js";

/**
 * Manages grapple state and thresholds between tokens
 */
export class GrappleEngine {
  // (Grapple handling code already present)
}

/**
 * Core CombatControl action handlers for degeneracy-based AI
 */
export class CombatControl {

  /**
   * Perform a fondle attempt against the target.
   * @param {Token} npc
   * @param {Token} target
   */
  static async performFondle(npc, target) {
    if (!npc || !target) return;
    console.log(`[CombatControl] ✋ ${npc.name} attempts to fondle ${target.name}...`);

    const rapeEngine = game.dndPF2e?.rapeEngine;
    if (!rapeEngine) return console.error("RapeEngine not available.");

    const { success, roll, dc } = rapeEngine.attemptFondleResistance(npc, target);

    await roll.toMessage({
      speaker: ChatMessage.implementation.getSpeaker({ token: target }),
      flavor: `Fondle Resistance DC ${dc} → Rolled ${roll.total}`
    });

    if (!success) {
      console.log(`[CombatControl] 🤲 ${npc.name} successfully fondles ${target.name}!`);

      const scope = "barbrawl";
      const key = "resourceBars.bar5.value";
      const value = target.document.getFlag(scope, key) ?? 0;

      const attire = game.dndPF2e?.attireSystem;
      const coverage = attire?.getCoverageMap(target.actor) ?? {};
      const fondleParts = ["chest", "groin", "belly", "ass"];

      const targetPart = fondleParts.find(part => coverage[part]);
      const tier = coverage[targetPart]?.tier ?? "covered";

      const stimRoll = await new Roll("4d4").evaluate({ async: true });

      let multiplier = 1.0;
      if (tier === "exposed") multiplier = 1.5;
      else if (tier === "revealing") multiplier = 1.25;
      else if (tier === "covered") multiplier = 0.75;

      const scaledGain = Math.round(stimRoll.total * multiplier);
      const total = Math.clamped(value + scaledGain, 0, 100);

      await stimRoll.toMessage({
        speaker: ChatMessage.implementation.getSpeaker({ token: target }),
        flavor: `Fondled ${targetPart} (${tier}) → Stimulation: ${total} (+${scaledGain})`
      });
      await target.document.setFlag(scope, key, total);
      console.log(`[CombatControl] ➕ ${target.name}'s stimulation increased to ${total} from fondling.`);
    } else {
      console.log(`[CombatControl] ❌ ${target.name} resists ${npc.name}'s fondling attempt.`);
    }
  }

  /**
   * Perform a stripping attempt against the target.
   * @param {Token} npc
   * @param {Token} target
   */
  static performStrip(npc, target) {
    if (!npc || !target) return;
    console.log(`[CombatControl] 👙 ${npc.name} attempts to strip ${target.name}!`);
    // Future: Call attire system to forcibly unequip armor or clothing
  }

  /**
   * Perform a rape attempt against the target.
   * @param {Token} npc
   * @param {Token} target
   */
  /**
   * Choose the penetration method during rape attempt.
   * Prioritizes vaginal, then anal.
   * @param {Token} target
   * @returns {string} Penetration type
   */
  static choosePenetrationTarget(target) {
    const anatomy = target.actor?.system?.details?.anatomy ?? [];
    if (anatomy.includes("vagina")) return "vaginal";
    if (anatomy.includes("anus")) return "anal";
    return "anal"; // Fallback if nothing else
  }

  /**
   * Perform a deliberate wombfuck attempt against a vaginally penetrated target.
   * Applies Wombfucking/BeingWombfucked effects and major stimulation.
   * @param {Token} npc
   * @param {Token} target
   */
  static async performWombfuck(npc, target) {
    if (!npc || !target) return;
    console.log(`[CombatControl] 🧿 ${npc.name} attempts to breach ${target.name}'s womb!`);

    applyEffectByUuid(npc.actor, UUIDS.WOMBFUCKING);
    applyEffectByUuid(target.actor, UUIDS.BEING_WOMBFUCKED);

    const scope = "barbrawl";
    const key = "resourceBars.bar5.value";
    const value = target.document.getFlag(scope, key) ?? 0;

    const roll = await new Roll("8d6").evaluate({ async: true });
    const scaledGain = Math.round(roll.total);
    const total = Math.clamped(value + scaledGain, 0, 100);

    await roll.toMessage({
      speaker: ChatMessage.implementation.getSpeaker({ token: target }),
      flavor: `${npc.name} brutally wombfucks ${target.name} → Stimulation: ${total} (+${scaledGain})`
    });
    await target.document.setFlag(scope, key, total);
    console.log(`[CombatControl] ➕ ${target.name}'s stimulation increased to ${total} from wombfucking.`);
  }

  static async performRape(npc, target) {
    if (!npc || !target) return;
    console.log(`[CombatControl] 🔥 ${npc.name} attempts to rape ${target.name}!`);
    applyEffectByUuid(npc.actor, UUIDS.RAPING_ORIFICE);
    applyEffectByUuid(target.actor, UUIDS.BEING_RAPED_ORIFICE);

    const scope = "barbrawl";
    const key = "resourceBars.bar5.value";
    const value = target.document.getFlag(scope, key) ?? 0;

    // Base stimulation roll (heavier than fondle)
    const penetrationType = this.choosePenetrationTarget(target);

    const roll = await new Roll("6d6").evaluate({ async: true });
    const scaledGain = Math.round(roll.total);

    );
      if (wombRoll.total >= 80) {
        applyEffectByUuid(npc.actor, UUIDS.WOMBFUCKING);
        applyEffectByUuid(target.actor, UUIDS.BEING_WOMBFUCKED);
        console.log(`[CombatControl] 🧿 ${npc.name} breaches ${target.name}'s womb!`);
      }
    }
    const total = Math.clamped(value + scaledGain, 0, 100);

    await roll.toMessage({
      speaker: ChatMessage.implementation.getSpeaker({ token: target }),
      flavor: `${npc.name} forcibly ${penetrationType === "vaginal" ? "penetrates" : "violates"} ${target.name} (${penetrationType}) → Stimulation: ${total} (+${scaledGain})`
    });
    await target.document.setFlag(scope, key, total);
    console.log(`[CombatControl] ➕ ${target.name}'s stimulation increased to ${total} from rape.`);
    // Future: Handle penetration resolution, stimulation increase, pregnancy risk if relevant
  }

}
  constructor() {
    /**
     * Maps targetTokenId → Map of attackerTokenId → stack count
     * @type {Map<string, Map<string, number>>}
     */
    this.counters = new Map();
  }

  /**
   * Get or initialize the counter map for a given target
   * @param {string} targetId - Token ID of the grapple target
   * @returns {Map<string, number>} Attacker → count map
   */
  _getTargetMap(targetId) {
    if (!this.counters.has(targetId)) this.counters.set(targetId, new Map());
    return this.counters.get(targetId);
  }

  /**
   * Disengage all grapples on a target, restoring speed
   * @param {Token} token - Token to disengage
   */
  disengage(token) {
    this.counters.delete(token.id);
    const actor = token.actor;
    if (actor) {
      actor.update({ "system.attributes.speed.value": actor.system.attributes.speed._mod });
    }
    console.log(`[D&Degenerates] 🏃 ${token.name} disengages — counters reset and speed restored.`);
  }

  /**
   * Apply attachment effect when attacker is smaller than target
   * @param {Token} attacker - Grappling token
   * @param {Token} target - Target token
   */
  attach(attacker, target) {
    if (!isValidActorToken(attacker) || !isValidActorToken(target)) return;

    const attackerIndex = getSizeIndex(attacker.actor.system.traits.size.value);
    const targetIndex = getSizeIndex(target.actor.system.traits.size.value);

    if (attackerIndex <= targetIndex - 1) {
      const uuid = "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm"; // Clumsy
      applyEffectByUuid(target.actor, uuid);
      console.log(`[D&Degenerates] 🪢 ${attacker.name} attaches to ${target.name} → Clumsy applied.`);
    }
  }

  /**
   * Add or increment a grapple stack from attacker on target
   * @param {Token} attacker
   * @param {Token} target
   */
  addGrapple(attacker, target) {
    const targetMap = this._getTargetMap(target.id);
    const count = targetMap.get(attacker.id) || 0;
    targetMap.set(attacker.id, count + 1);
    this._checkRestraintThreshold(target);
    console.log(`[D&Degenerates] 🤼 ${attacker.name} grapples ${target.name} → ${count + 1} stack(s)`);
  }

  /**
   * Remove a grapple from attacker on target
   * @param {Token} attacker
   * @param {Token} target
   */
  releaseGrapple(attacker, target) {
    const targetMap = this._getTargetMap(target.id);
    targetMap.delete(attacker.id);
    this._checkRestraintThreshold(target);
    console.log(`[D&Degenerates] 🔓 ${attacker.name} releases grapple on ${target.name}`);
  }

  /**
   * Called when a target escapes an attacker’s grapple
   * @param {Token} target
   * @param {Token} attacker
   */
  escapeGrapple(target, attacker) {
    const targetMap = this._getTargetMap(target.id);
    if (targetMap.has(attacker.id)) {
      targetMap.delete(attacker.id);
      this._checkRestraintThreshold(target);
      console.log(`[D&Degenerates] 💨 ${target.name} escapes ${attacker.name}'s grapple!`);
    }
  }

  /**
   * Remove all grapples affecting a token
   * @param {Token} target
   */
  resetGrapplesFor(target) {
    this.counters.delete(target.id);
    console.log(`[D&Degenerates] 🧼 Grapples reset for ${target.name}`);
  }

  /**
   * Evaluate and apply restraint thresholds for a given target
   * Applies Grabbed, adjusts speed, or removes restraint based on grapple stacks
   * @param {Token} target
   */
  async _checkRestraintThreshold(target) {
    if (!target || !target.actor) return;

    const targetToken = canvas.tokens.get(target.id);
    const targetSizeIndex = getSizeIndex(target.actor.system?.traits?.size?.value);
    const targetMap = this._getTargetMap(target.id);

    let total = 0;
    let attachOnlyCount = 0;

    for (const [attackerId, count] of targetMap.entries()) {
      const attackerToken = canvas.tokens.get(attackerId);
      if (!isValidActorToken(attackerToken)) continue;

      const attackerSizeIndex = getSizeIndex(attackerToken.actor.system.traits.size.value);
      total += count;
      if (attackerSizeIndex === targetSizeIndex - 1) {
        attachOnlyCount += count;
      }
    }

    const isRestrained = total >= 4 || attachOnlyCount >= 4;
    const isImmobilized = attachOnlyCount >= 3;
    const currentlyRestrained = target.actor.itemTypes.effect.some(e => e.slug === "restrained");

    if (isRestrained && !currentlyRestrained) {
      console.log(`[D&Degenerates] 🚫 ${target.name} is now Restrained!`);
      const uuids = ["Compendium.pf2e.conditionitems.Item.1p1YynnpK3vYiFzK"]; // Grabbed
      for (const uuid of uuids) {
        await applyEffectByUuid(target.actor, uuid);
      }
    } else if (!currentlyRestrained && attachOnlyCount >= 1) {
      const originalSpeed = target.actor.system.attributes.speed.value;
      const newSpeed = attachOnlyCount >= 3 ? 10 : Math.max(originalSpeed - 10 * attachOnlyCount, 5);
      if (newSpeed !== originalSpeed) {
        await target.actor.update({ "system.attributes.speed.value": newSpeed });
        console.log(`[D&Degenerates] 🐌 ${target.name}'s speed reduced due to ${attachOnlyCount} attach counter(s): ${newSpeed} feet.`);
      } else if (attachOnlyCount === 0 && originalSpeed < target.actor.system.attributes.speed._mod) {
        await target.actor.update({ "system.attributes.speed.value": target.actor.system.attributes.speed._mod });
        console.log(`[D&Degenerates] 🐾 ${target.name}'s speed has recovered to normal.`);
      }
    } else if (!isRestrained && currentlyRestrained) {
      console.log(`[D&Degenerates] ✅ ${target.name} is no longer Restrained.`);
      await removeEffectsBySlug(target.actor, ["grabbed"]);
    }
  }
}
