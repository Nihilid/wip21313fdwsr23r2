// ai.js
// Handles degeneracy-aware behavior responses for AI/NPCs in Dungeons & Degenerates

export class DegenerateAI {

  /**
   * Chooses the best target based on exposure, restraint, and crowding.
   * @param {Token} npc
   * @returns {Token|null} Best available player-owned target
   */
  static chooseTarget(npc) {
    const pcs = canvas.tokens.placeables.filter(t => t.actor?.hasPlayerOwner);
    if (!pcs.length) return null;

    const scores = pcs.map(pc => {
      const actor = pc.actor;
      let score = 0;

      // Vulnerability Bonuses
      const restrained = actor.conditions?.some(c => ["restrained", "pinned", "immobilized", "grabbed"].includes(c.slug));
      if (restrained) score += 3;

      const attire = game.dndPF2e?.attireSystem;
      const coverage = attire?.getCoverageMap(actor) ?? {};
      const exposed = ["chest", "groin", "belly", "ass"].filter(part => coverage[part]?.tier === "exposed").length;
      if (exposed >= 2) score += 2;

      const pregnant = Number(actor.flags?.dndPF2e?.pregnancy?.count ?? 0) > 0;
      if (pregnant) score += 2;

      const scrawled = game.dndPF2e?.effectEngine?.getVisibleBodyScrawls?.(actor)?.length ?? 0;
      if (scrawled > 0) score += 1;

      // Crowd Control Penalty
      const enemiesEngaging = canvas.tokens.placeables.filter(t => {
        if (!t.actor || t.actor.hasPlayerOwner) return false;
        const dist = canvas.grid.measureDistance(pc, t);
        return dist <= 5; // Adjacent enemies
      }).length;
      score -= enemiesEngaging;

      return { pc, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.pc ?? null;
  }
  /**
   * Computes NPC interest in a character's nudity or exposed body.
   * @param {Token} token
   * @returns {number} Interest level (0–3)
   */
  static getExposureInterest(token) {
    const actor = token.actor;
    if (!actor) return 0;
    const exposed = game.dndPF2e?.effectEngine?.getVisibleBodyScrawls?.(actor)?.length > 0;
    const hasSkimpy = actor.items?.some(i => i.traits?.value?.includes("skimpy"));
    let interest = exposed ? 1 : 0;
    if (hasSkimpy) interest += 1;
    return Math.min(interest, 3);
  }

  /**
   * Computes NPC interest in a character's milk fullness.
   * @param {Token} token
   * @returns {number} Interest level (0–3)
   */
  static getLactationInterest(token) {
    const actor = token.actor;
    if (!actor) return 0;
    const volume = Number(actor.flags?.dndPF2e?.milk?.currentVolume ?? 0);
    const capacity = Number(actor.flags?.dndPF2e?.milk?.maxVolume ?? 2500);
    const ratio = volume / capacity;
    if (ratio >= 0.9) return 3;
    if (ratio >= 0.7) return 2;
    if (ratio >= 0.4) return 1;
    return 0;
  }

  /**
   * Computes NPC interest in a character's pregnancy based on race and mood hooks.
   * @param {Token} token - The visibly pregnant character
   * @returns {number} Interest level (0–3)
   */
  static getPregnancyInterest(token) {
    const actor = token.actor;
    if (!actor) return 0;

    const pregnancies = Number(actor.flags?.dndPF2e?.pregnancy?.count ?? 0);
    const race = actor.system?.details?.ancestry?.name?.toLowerCase?.() ?? "unknown";

    let base = pregnancies > 0 ? 1 : 0;
    if (["human", "elf", "halfling"].includes(race)) base += 1;
    if (["orc", "demon", "goblin"].includes(race)) base += 0; // neutral interest
    if (["tiefling"].includes(race)) base += 1;

    return Math.min(base, 3);
  }
  /**
   * Called when a target token is exposed in some way (wardrobe malfunction, stripping, etc.)
   * @param {Token} token - The exposed actor
   * @param {string[]} exposedParts - List of revealed body parts
   */
  /**
   * Called when a target visibly orgasms.
   * @param {Token} token
   */
  static onOrgasm(token) {
    const actor = token.actor;
    if (!actor) return;
    const nearby = canvas.tokens.placeables.filter(t => t.actor && t !== token && !t.actor.hasPlayerOwner);
    for (const npc of nearby) {
      const line = `${npc.name} watches ${actor.name} climax shamelessly...`;
      game.dndPF2e?.flavorEngine?.sendChat?.(line, { alias: npc.name });
    }
  }

  /**
   * Called when a target is visibly scrawled on.
   * @param {Token} token
   */
  static onScrawled(token) {
    const actor = token.actor;
    if (!actor) return;
    const visible = game.dndPF2e?.effectEngine?.getVisibleBodyScrawls?.(actor);
    if (!visible?.length) return;
    const actor = token.actor;
    if (!actor) return;
    const nearby = canvas.tokens.placeables.filter(t => t.actor && t !== token && !t.actor.hasPlayerOwner);
    for (const npc of nearby) {
      const line = `${npc.name} glances at the writing marked across ${actor.name}'s body...`;
      game.dndPF2e?.flavorEngine?.sendChat?.(line, { alias: npc.name });
    }
  }

  /**
   * Called when a pregnancy becomes visible or is announced.
   * @param {Token} token
   */
  static onPregnant(token) {
    const actor = token.actor;
    if (!actor) return;
    const nearby = canvas.tokens.placeables.filter(t => t.actor && t !== token && !t.actor.hasPlayerOwner);
    for (const npc of nearby) {
      const line = `${npc.name} eyes the swelling belly of ${actor.name} with twisted interest...`;
      game.dndPF2e?.flavorEngine?.sendChat?.(line, { alias: npc.name });
    }
  }

  /**
   * Calculates "drive" score for lurid NPCs to attempt capture or molestation.
   * Factors exposure, pregnancy, lactation, injury, and combat advantage.
   * @param {Token} npc - The NPC considering action
   * @param {Token} target - The PC or actor being evaluated
   * @returns {number} Drive score (0–10)
   */
  static calculateDrive(npc, target) {
    const actor = target.actor;
    if (!actor) return;

    if (this.shouldAttemptWombfuck(npc, target)) {
      console.log(`[AI] ${npc.name} aggressively attempts to breach ${target.name}'s womb!`);
      return CombatControl.performWombfuck(npc, target);
    }
    if (!actor) return 0;

    const exposure = this.getExposureInterest(target); // 0–3
    const pregnancy = this.getPregnancyInterest(target); // 0–3
    const lactation = this.getLactationInterest(target); // 0–3

    // Health Status Estimation
    const status = actor?.system?.attributes?.hp?.status || "Unharmed";
    let healthPenalty = 0;
    if (["Weak", "Unsteady", "Incapacitated"].includes(status)) healthPenalty = -2;

    // Combat Advantage Bonus
    const allies = canvas.tokens.placeables.filter(t => t.actor && !t.actor.hasPlayerOwner);
    const enemies = canvas.tokens.placeables.filter(t => t.actor && t.actor.hasPlayerOwner);
    const advantage = (allies.length > enemies.length) ? 1 : 0;

    // Body Scrawl Bonus
    const scrawls = game.dndPF2e?.effectEngine?.getVisibleBodyScrawls?.(actor)?.length ?? 0;

    // Final Drive Score
    const baseDrive = exposure + pregnancy + lactation + (scrawls > 0 ? 1 : 0) + healthPenalty + advantage;
    return Math.max(0, Math.min(10, baseDrive));
  }

  /**
   * Determines if an NPC should prioritize molestation over normal attacks.
   * Based on Drive score.
   * @param {Token} npc
   * @param {Token} target
   * @returns {boolean}
   */
  /**
   * Evaluates AI choice: attack normally, attempt grapple/molest, or use ranged abilities.
   * @param {Token} npc
   * @param {Token} target
   * @returns {"attack" | "grapple" | "ranged"}
   */
  static evaluateActionChoice(npc, target) {
    const drive = this.calculateDrive(npc, target);
    const actor = npc.actor;
    const targetActor = target.actor;
    if (!actor || !targetActor) return "attack";

    const hasRanged = actor.items?.some(i => i.system?.category === "ranged") ?? false;
    const isCaster = actor.items?.some(i => i.system?.category === "spell" || i.system?.type?.value === "spellcastingEntry") ?? false;

    const immobilized = targetActor.conditions?.some(c =>
      ["prone", "pinned", "restrained", "immobilized", "paralyzed", "grabbed"].includes(c.slug)
    );

    if ((hasRanged || isCaster) && !immobilized && drive < 7) {
      return "ranged";
    }
    if (drive >= 6) {
      return "grapple";
    }
    return "attack";
  }

  static shouldMolest(npc, target) {
    const drive = this.calculateDrive(npc, target);
    return drive >= 6;
  }

  /**
   * Primary AI behavior selector for lurid NPCs.
   * Decides whether to attack, grapple, or use ranged abilities.
   * @param {Token} npc
   * @param {Token} target
   */
  /**
   * Determines if an NPC is smaller than their target.
   * @param {Token} npc
   * @param {Token} target
   * @returns {boolean}
   */
  static isSmaller(npc, target) {
    const npcSize = npc.actor?.system?.traits?.size || "med";
    const targetSize = target.actor?.system?.traits?.size || "med";
    const sizes = ["tiny", "sm", "med", "lg", "huge", "grg"];
    return sizes.indexOf(npcSize) < sizes.indexOf(targetSize);
  }

  /**
   * Attempts a grapple or attach depending on size difference.
   * Smaller creatures may prefer Attach.
   * @param {Token} npc
   * @param {Token} target
   */
  /**
   * Attempts to fondle a grappled or pinned target to build arousal/stimulation.
   * @param {Token} npc
   * @param {Token} target
   */
  /**
   * Determines if an actor should Fondle based on their current Lust.
   * Higher Lust = higher chance to Fondle.
   * @param {Actor|Token} actor
   * @returns {boolean}
   */
  static shouldFondle(actor) {
    const lust = Number(actor.flags?.barbrawl?.resourceBars?.bar3?.value ?? 0);
    if (!lust) return false;
    const roll = Math.random() * 100;
    return roll < lust;
  }

  /**
   * Attempts to forcibly strip clothing or armor from the target.
   * @param {Token} npc
   * @param {Token} target
   */
  static attemptStrip(npc, target) {
    console.log(`[AI] ${npc.name} attempts to forcibly strip ${target.name}...`);
    // Future: CombatControl.performStrip(npc, target);
  }

  /**
   * Attempts to trip or knock prone the target.
   * @param {Token} npc
   * @param {Token} target
   */
  /**
   * Attempts to rape a fully restrained, sufficiently exposed target.
   * Placeholder for future sexual assault systems.
   * @param {Token} npc
   * @param {Token} target
   */
  static attemptRape(npc, target) {
    console.log(`[AI] ${npc.name} attempts to force themselves upon ${target.name}!`);
    // Future: CombatControl.performRape(npc, target);
  }

  static attemptTrip(npc, target) {
    console.log(`[AI] ${npc.name} attempts to trip ${target.name} to the ground...`);
    // Future: CombatControl.performTrip(npc, target);
  }

  /**
   * Chooses a body part to fondle based on target coverage.
   * Prefers exposed parts.
   * @param {Actor} actor
   * @returns {string|null} Body part or null
   */
  /**
   * Determines if the NPC should attempt womb penetration during ongoing rape.
   * @param {Token} npc
   * @param {Token} target
   * @returns {boolean}
   */
  static shouldAttemptWombfuck(npc, target) {
    if (!npc?.actor || !target?.actor) return false;

    const npcEffects = npc.actor.itemTypes?.effect?.map(e => e.slug) ?? [];
    const targetEffects = target.actor.itemTypes?.effect?.map(e => e.slug) ?? [];

    const raping = npcEffects.includes("raping-orifice");
    const beingRaped = targetEffects.includes("being-raped-orifice");

    if (!raping || !beingRaped) return false;

    const lust = Number(npc.actor.flags?.barbrawl?.resourceBars?.bar3?.value ?? 0);
    const bonus = Math.floor(lust / 20); // +1% per 20 Lust
    const baseChance = 30 + bonus;

    const roll = Math.random() * 100;
    return roll < baseChance;
  }

  static chooseFondleTarget(actor) {
    const attire = game.dndPF2e?.attireSystem;
    const coverage = attire?.getCoverageMap(actor) ?? {};
    const fondlePriority = ["chest", "groin", "belly", "ass"];

    // Sort parts based on exposure: exposed > revealing > concealed > covered
    fondlePriority.sort((a, b) => {
      const tiers = { exposed: 3, revealing: 2, concealed: 1, covered: 0 };
      return (tiers[coverage[b]?.tier] || 0) - (tiers[coverage[a]?.tier] || 0);
    });

    return fondlePriority.find(part => coverage[part]) ?? null;
  }

  static attemptFondle(npc, target) {
    const fondleTarget = this.chooseFondleTarget(target.actor);
    if (fondleTarget) {
      const attire = game.dndPF2e?.attireSystem;
      const tier = attire?.getCoverageMap(target.actor)?.[fondleTarget]?.tier ?? "covered";
      console.log(`[AI] ${npc.name} fondles ${target.name}'s ${fondleTarget} (${tier}).`);
    } else {
      console.log(`[AI] ${npc.name} attempts to fondle ${target.name} (no clear target).`);
    }
    // Future: CombatControl.performFondle(npc, target);
  }

  static attemptGrappleOrAttach(npc, target) {
    if (this.isSmaller(npc, target)) {
      if (Math.random() < 0.5) {
        CombatControl.performAttach(npc, target);
      } else {
        CombatControl.performCustomGrapple(npc, target);
      }
    } else {
      CombatControl.performCustomGrapple(npc, target);
    }
  }

  /**
   * Post-grapple behavior decision: Fondle, Strip, Trip, or Continue Grapple.
   * @param {Token} npc
   * @param {Token} target
   */
  static async aiPostGrappleBehavior(npc, target) {
    const actor = target.actor;
    if (!actor) return;

    const attire = game.dndPF2e?.attireSystem;
    const coverage = attire?.getCoverageMap(actor) ?? {};

    const restrained = actor.conditions?.some(c => c.slug === "restrained" || c.slug === "pinned");
    const criticalAssets = ["chest", "groin", "belly", "ass"];
    const exposedParts = criticalAssets.filter(part => coverage[part]?.tier === "exposed" || coverage[part]?.tier === "revealing");

    if (!restrained) {
      console.log(`[AI] ${npc.name} attempts to further restrain or trip ${target.name}.`);
      this.attemptTrip(npc, target); // fallback to Trip or re-pin attempt
      return;
    }

    if (restrained && exposedParts.length >= 2) {
      if (this.shouldFondle(npc)) {
        this.attemptFondle(npc, target);
      } else {
        this.attemptStrip(npc, target);
      }
      return;
    }

    if (restrained && exposedParts.length >= 3) {
      console.log(`[AI] ${npc.name} prepares to attempt rape on ${target.name}!`);
      // Future: CombatControl.performRape(npc, target);
      return;
    }

    // Default fallback
    this.attemptStrip(npc, target);
  } else {
      // Future: Strip, Trip, or re-pin logic could go here
      console.log(`[AI] ${npc.name} attempts to further restrain or strip ${target.name}.`);
      // Future placeholder for actions like CombatControl.performStrip()
    }
  }

  static aiChooseAction(npc, target = null) {
    if (!target) {
      target = this.chooseTarget(npc);
      if (!target) {
        console.log(`[AI] ${npc.name} finds no viable target!`);
        return;
      }
    }
    const choice = this.evaluateActionChoice(npc, target);
    switch (choice) {
      case "grapple":
        this.attemptGrappleOrAttach(npc, target);
        break;
      case "ranged":
        // Use ranged attack (placeholder)
        console.log(`[AI] ${npc.name} attacks ${target.name} with ranged weapon or spell.`);
        break;
      case "attack":
      default:
        // Use melee attack (placeholder)
        console.log(`[AI] ${npc.name} attacks ${target.name} in melee.`);
        break;
    }
  }

  static onExposure(token, exposedParts) {
    const actor = token.actor;
    if (!actor || !exposedParts?.length) return;

    const nearby = canvas.tokens.placeables.filter(t => {
      if (!t.actor || t === token) return false;
      const dist = canvas.grid.measureDistance(token, t);
      return dist <= 30 && t.actor.hasPlayerOwner === false;
    });

    for (const npc of nearby) {
      const response = `${npc.name} notices ${actor.name}'s exposed ${exposedParts.join(" and ")}...`;
      game.dndPF2e?.flavorEngine?.sendChat?.(response, { alias: npc.name });
    }
  }
}
