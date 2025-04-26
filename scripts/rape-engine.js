// rape-engine.js
// Handles penetration, rape state tracking, and escalation effects

/**
 * RapeEngine manages forced penetration logic, state tracking, and effect escalation.
 * Integrates with the ArousalManager and CombatControl subsystems.
 */

import { logDebug } from "./utils.js";

export class RapeEngine {
  /**
   * @constructor
   * Initializes the penetration map for tracking active rape states.
   */
  constructor() {
    /** @type {Map<string, { orifice: string, attackerId: string, tool: string, womb: boolean }>} */
    this.penetrationMap = new Map();
  }

  /**
   * Get the current penetration state for a token.
   * @param {Token} target
   * @returns {object | undefined}
   */
  getPenetrationState(target) {
    return this.penetrationMap.get(target.id);
  }

  /**
   * Determine if penetration is possible.
   * @param {Token} attacker
   * @param {Token} target
   * @param {string} orifice
   * @returns {boolean}
   */
  canPenetrate(attacker, target, orifice) {
    if (!attacker?.actor || !target?.actor) return false;

    const exposed = game.dndPF2e?.attireSystem?.getExposureMap(target.actor);
    const isAccessible = exposed?.[orifice]?.tier === "exposed";
    const isVulnerable = ["restrained", "pinned", "prone", "supine", "unconscious", "downed"].some(slug =>
      target.actor.itemTypes.effect.some(e => e.slug === slug)
    );

    const isAttached = game.dndPF2e?.combatControl?.counters?.get(target.id)?.has(attacker.id);
    const isGrabbed = target.actor.itemTypes.effect.some(e => e.slug === "grabbed");

    return isAccessible && (isVulnerable || isAttached || isGrabbed);
  }

  /**
   * Perform a penetration attempt roll.
   * @param {Token} attacker
   * @param {Token} target
   * @param {string} orifice
   * @param {string} [tool="cock"]
   * @param {number} [bonus=0]
   * @returns {{ success: boolean, roll: Roll, dc: number }}
   */
  attemptPenetration(attacker, target, orifice, tool = "cock", bonus = 0) {
    if (!this.canPenetrate(attacker, target, orifice)) return { success: false, roll: null, dc: null };

    const libido = target.actor.flags?.barbrawl?.resourceBars?.bar4?.value ?? 0;
    const level = target.actor.system?.details?.level?.value ?? 1;
    const dc = 15 + Math.floor(level / 2) + Math.floor(libido / 20);

    const roll = new Roll(`1d20 + @skills.ath.mod + ${bonus}`, attacker.actor.getRollData()).evaluate({ async: false });
    const success = roll.total >= dc;

    return { success, roll, dc };
  }

  /**
   * Perform a fondle resistance roll.
   * @param {Token} attacker
   * @param {Token} target
   * @param {number} [bonus=0]
   * @returns {{ success: boolean, roll: Roll, dc: number }}
   */
  attemptFondleResistance(attacker, target, bonus = 0) {
    if (!attacker?.actor || !target?.actor) return { success: false, roll: null, dc: null };

    const libido = target.actor.flags?.barbrawl?.resourceBars?.bar4?.value ?? 0;
    const level = target.actor.system?.details?.level?.value ?? 1;
    const dc = 10 + Math.floor(level / 2) + Math.floor(libido / 25);

    const roll = new Roll(`1d20 + @skills.ath.mod + ${bonus}`, attacker.actor.getRollData()).evaluate({ async: false });
    const success = roll.total >= dc;

    return { success, roll, dc };
  }
  }

  /**
   * Apply penetration state and effects to a target.
   * @param {Token} attacker
   * @param {Token} target
   * @param {string} orifice
   * @param {string} [tool="cock"]
   * @param {boolean} [womb=false]
   */
  async applyPenetration(attacker, target, orifice, tool = "cock", womb = false) {
    this.penetrationMap.set(target.id, { orifice, attackerId: attacker.id, tool, womb });
    logDebug("info", `[D&Degenerates] 🍆 ${attacker.name} penetrates ${target.name}'s ${womb ? "womb" : orifice}`);

    const rapeUuid = `Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.being-raped-${orifice.toLowerCase()}`;
    await this.applyEffectFromUUID(rapeUuid, target.actor);

    if (womb) {
      const wombUuid = "Compendium.dungeons-and-degenerates-pf2e.degenerate-effects.Item.being-wombfucked";
      await this.applyEffectFromUUID(wombUuid, target.actor);
    }
  }

  /**
   * Apply an effect from a compendium UUID.
   * @param {string} uuid
   * @param {Actor} actor
   */
  async applyEffectFromUUID(uuid, actor) {
    try {
      const effect = await fromUuid(uuid);
      if (!effect) throw new Error("UUID not found");
      await actor.createEmbeddedDocuments("Item", [effect.toObject()]);
    } catch (err) {
      logDebug("warn", `❌ Failed to apply effect from UUID ${uuid}:`, err);
    }
  }

  /**
   * Escalate a condition effect's badge value.
   * @param {Token} target
   * @param {string} slug
   * @param {number} [amount=1]
   */
  async escalateEffect(target, slug, amount = 1) {
    try {
      const effect = target.actor.itemTypes.effect.find(e => e.slug === slug);
      if (effect) {
        const current = effect.system?.badge?.value ?? 1;
        await effect.update({ "system.badge.value": current + amount });
      }
    } catch (err) {
      logDebug("warn", `❌ Failed to escalate ${slug}:`, err);
    }
  }

  /**
   * Begin rape escalation sequence and resolve resistance.
   * @param {Token} attacker
   * @param {Token} target
   */
  async beginRape(attacker, target) {
    const state = this.getPenetrationState(target);
    if (!state) return;

    logDebug("info", `[D&Degenerates] 🔥 ${attacker.name} begins raping ${target.name} (${state.orifice})`);

    await this.escalateEffect(target, "clumsy");
    if (state.womb) {
      for (const slug of ["stupefied", "enfeebled", "clumsy", "stunned"]) {
        await this.escalateEffect(target, slug);
      }
    }

    await game.dndPF2e?.arousalManager?.handleOrgasmResistance?.(target.actor);

    // ✍️ Body scrawling during rape
    const flavor = game.dndPF2e?.flavorEngine;
    if (flavor?.generateBodyScrawl) {
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        const entry = flavor.generateBodyScrawl(attacker, target);
        if (entry) {
          await game.dndPF2e?.effectEngine?.applyBodyScrawl?.(target.actor, entry.text, attacker.name, entry.location);
        }
      }
    }
  }

  /**
   * Clear the penetration state and remove active rape effects.
   * @param {Token} target
   */
  async clearPenetration(target) {
    const prevState = this.getPenetrationState(target);
    this.penetrationMap.delete(target.id);
    logDebug("info", `[D&Degenerates] ❌ Penetration state cleared for ${target.name}`);

    const slugs = [
      `being-raped-${prevState?.orifice.toLowerCase()}`,
      "being-wombfucked"
    ];

    const toRemove = target.actor.itemTypes.effect.filter(e => slugs.includes(e.slug));
    for (const effect of toRemove) {
      await effect.delete();
    }
  }

  /**
   * Stub for resistance handling (currently self-recursive bug).
   * @param {Token} target
   */
  /**
   * @deprecated Orgasm resistance logic is now handled by ArousalManager.
   * This method is a stub and should not be called.
   * @param {Token} target
   */
  handleOrgasmResistance(target) {
    logDebug("warn", "[D&Degenerates] handleOrgasmResistance is deprecated. Use ArousalManager.handleOrgasmResistance instead.");
  } catch (err) {
      logDebug("warn", "❌ Error during orgasm resistance check:", err);
    }
  }

  /**
   * (Unused) helper to collect effect slugs from previous state.
   * @param {string} orifice
   * @param {boolean} womb
   * @returns {string[]}
   */
  getPenetrationEffectSlugs(orifice, womb) {
    const slugs = this.getPenetrationEffectSlugs(prevState?.orifice, prevState?.womb);
    if (womb) slugs.push("being-wombfucked");
    return slugs;
  }
}
